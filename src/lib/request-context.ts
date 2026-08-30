/* ============================================================================
   Request context — who is asking, without keeping who is asking
   ----------------------------------------------------------------------------
   The rate limiter needs a stable per-client key and the audit log needs a
   plausible trail, but neither needs an IP address. A raw address is personal
   data under the DR's Ley 172-13 and under the GDPR for any European patient,
   and this is a dental clinic: the row it would sit next to already says which
   procedure someone enquired about. So the address is hashed with a server-side
   salt the moment it is read and the plaintext never leaves this module.

   The hash is deliberately not reversible and deliberately not portable: change
   IP_HASH_SALT and every existing bucket and audit trail becomes unlinkable to
   any address, which is the intended property if the salt ever leaks.
   ========================================================================== */

import 'server-only';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';

/** Long enough to be useful in an incident, short enough that a browser sending
    a kilobyte of junk cannot bloat the audit table. */
const USER_AGENT_MAX_LENGTH = 255;

export interface RequestContext {
  /** Salted SHA-256 of the client address, or null when no proxy header was present. */
  ipHash: string | null;
  /** Trimmed, control-character-free User-Agent, or null. */
  userAgent: string | null;
}

let cachedSalt: string | undefined;

function ipHashSalt(): string {
  if (cachedSalt) return cachedSalt;

  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    /* Hashing without a salt would be worse than not hashing at all: the IPv4
       space is 2^32, so an unsalted digest is reversed by a laptop in minutes
       while looking, in the database, exactly like protected data. */
    throw new Error(
      'IP_HASH_SALT is not set. Rate limiting and the audit log both key on a salted hash of ' +
        'the client address; an unsalted digest of an IPv4 address is trivially reversible, so ' +
        'there is no safe fallback. Generate 32+ random bytes into .env.local and into the ' +
        'Vercel project environment.',
    );
  }

  cachedSalt = salt;
  return salt;
}

/**
 * The client address as this deployment sees it.
 *
 * The FIRST entry of `x-forwarded-for` is the right one here, which is the
 * opposite of the usual advice, and it is worth being precise about why. Vercel's
 * edge discards whatever `x-forwarded-for` the client sent and writes its own
 * header with the observed peer address in position 0. Every entry after that
 * was appended by a hop between the edge and this function — and a caller can
 * pre-seed those by sending its own header, so reading the last entry would let
 * anyone mint an unlimited number of distinct rate-limit buckets simply by
 * varying a string.
 *
 * That reasoning holds only behind a proxy that rewrites the header. On a host
 * that merely appends, none of the entries is trustworthy and this function must
 * be replaced by that platform's own address accessor before it is relied on.
 */
export function clientIpFromHeaders(headerList: Headers): string | null {
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const real = headerList.get('x-real-ip')?.trim();
  return real ? real : null;
}

/** Salted SHA-256 of an address, base64url so it stays short in a bucket key. */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(`${ipHashSalt()}:${ip}`).digest('base64url');
}

/**
 * A User-Agent safe to store: control characters stripped (they would corrupt a
 * log line read in a terminal) and truncated to a fixed length.
 */
export function truncateUserAgent(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;

  const cleaned = userAgent.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!cleaned) return null;

  return cleaned.length > USER_AGENT_MAX_LENGTH
    ? cleaned.slice(0, USER_AGENT_MAX_LENGTH)
    : cleaned;
}

/**
 * Read once per request and pass the result around. `headers()` is cheap but it
 * also marks the render dynamic, so calling it from three helpers in one action
 * costs three opt-outs where one would do.
 */
export async function getRequestContext(): Promise<RequestContext> {
  const headerList = await headers();

  return {
    ipHash: hashIp(clientIpFromHeaders(headerList)),
    userAgent: truncateUserAgent(headerList.get('user-agent')),
  };
}
