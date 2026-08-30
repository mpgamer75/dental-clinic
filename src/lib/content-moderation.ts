/**
 * Content moderation — hardcoded, synchronous, no network, no model call.
 *
 * That is a property to keep, not a limitation to fix: this runs inside the
 * server action that answers a patient pressing "enviar". Anything that can
 * hang, rate-limit or bill here is a form that hangs for a patient in pain.
 * Every check below is a string operation over at most a couple of thousand
 * characters.
 *
 * WHAT THE SCORE MEANS NOW
 * ------------------------
 * `score` is a queue-priority hint. It is NOT a publish gate any more.
 * Testimonials all land as 'pending_approval' and a human publishes them —
 * see `testimonials_queue_idx` in migrations/0001_init.sql, which reads the
 * queue worst-score-first — so the score decides only what the reviewer is
 * shown at the top of the pile. The old rule published anything scoring >= 85
 * straight onto a medical practice's homepage on the word of a 45-word literal
 * blocklist, and that blocklist lost to a space: "v i a g r a" scored a clean
 * 100. Do not reintroduce an auto-publish threshold, here or at the call site.
 *
 * That change also flips which mistake is expensive, and the weights below are
 * tuned for the new asymmetry. A false negative now costs one noisy row in a
 * queue a human is reading anyway. A false positive tells a real patient that
 * their thank-you note is "inappropriate content" and throws it away. So
 * `isAppropriate` — still a hard gate, it bounces the submission back to the
 * writer — is reserved for input that is unambiguously not a testimonial:
 * profanity, illicit-goods spam, pharmacy spam, and malformed input. Signals
 * that merely describe low-quality writing (shouting, emoji, a link, a price)
 * cost priority, never admission.
 */

/* ============================================================================
   Normalisation — runs BEFORE any blocklist match
   ----------------------------------------------------------------------------
   The blocklist used to be matched against `value.toLowerCase()` and nothing
   else, so all of these walked straight past it with a perfect score:

       v i a g r a      separators between single letters
       v1agr4           digits standing in for letters
       ｖｉａｇｒａ       fullwidth forms
       𝔳𝔦𝔞𝔤𝔯𝔞      a maths-alphanumeric font trick
       vi<ZWSP>agra     a zero-width space wedged into the middle
       vіagra           a Cyrillic і

   `candidateForms` folds every one of them back to "viagra". The fold is
   deliberately lossy and one-way: it exists to be matched against and is never
   stored, never shown, and never used for the length or ratio checks — those
   need the text exactly as the writer typed it.
   ========================================================================== */

/**
 * ñ is parked behind a private-use sentinel for the duration of the fold.
 *
 * NFKD decomposes it to `n` + a combining tilde, and stripping the tilde turns
 * `coño` into `cono` — which is the word an endodontist uses for a gutta-percha
 * point ("cono de gutapercha"), and lives inside `diseño de sonrisa`, `año` and
 * `niño`. Folding it would have the profanity list fire on a testimonial for
 * the exact treatment it is describing. Every other Spanish diacritic is safe
 * to strip, because no listed term collides with a Spanish word once its
 * accents are gone.
 */
const NTILDE_SENTINEL = '\uE000';
const NTILDE_SOURCE = /[ñÑ]/g;
const NTILDE_RESTORE = /\uE000/g;

/** Combining marks left behind by NFKD (the accents themselves). */
const COMBINING_MARKS = /\p{M}+/gu;

/**
 * Zero-width and direction-changing characters — the set that is both stripped
 * before matching, so none of them can serve as a separator inside a banned
 * word, and flagged as a signal in its own right further down.
 *
 * Declared as a source string because two regexes need exactly these members
 * and a third needs them plus two more; a class written out three times is a
 * class that ends up meaning three different things.
 *
 * ZWJ (U+200D) and VS16 (U+FE0F) are deliberately NOT members. They are
 * load-bearing inside ordinary emoji sequences — the woman-health-worker emoji
 * a grateful patient types is a single grapheme assembled with a ZWJ — so they
 * have to be stripped before matching, but flagging them would punish a
 * patient for using the keyboard their phone gave them, and deleting them in
 * `sanitizeText` would break the emoji into its pieces on the page.
 */
const INVISIBLE_SOURCE = '[\\u00AD\\u200B\\u200C\\u200E\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF]';

/** What the fold strips: the invisibles above, plus the two emoji joiners. */
const FORMAT_CHARS = new RegExp(`${INVISIBLE_SOURCE}|[\\u200D\\uFE0F]`, 'g');

/**
 * Homoglyphs NFKD does not touch, because Cyrillic а and Latin a are genuinely
 * different letters to Unicode. They are the same letter to a reader, which is
 * the entire point of the substitution. Lowercase keys only: the fold has
 * already lowercased by the time this runs.
 */
const HOMOGLYPHS: Record<string, string> = {
  а: 'a', в: 'b', е: 'e', к: 'k', м: 'm', н: 'h', о: 'o', р: 'p', с: 'c',
  т: 't', у: 'y', х: 'x', і: 'i', ј: 'j', ѕ: 's',
  α: 'a', ε: 'e', ι: 'i', κ: 'k', μ: 'm', ν: 'v', ο: 'o', ρ: 'p', τ: 't',
};
const HOMOGLYPH_SOURCE = new RegExp(`[${Object.keys(HOMOGLYPHS).join('')}]`, 'g');

/**
 * Leetspeak, folded to one letter each.
 *
 * `1`, `!` and `|` stand for an `i` or an `l` and there is no way to tell which
 * the writer meant, so the fold picks `i` and the patterns take the guess back
 * out again: `acceptEitherLetter` lets every `i` and every `l` in a pattern
 * match both. Folding both ways instead — two candidate strings, one per
 * reading — loses to a word that mixes them, and "c1a1is" is exactly the sort
 * of thing that gets tried.
 */
const LEET: Record<string, string> = {
  '0': 'o', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's',
  '1': 'i', '!': 'i', '|': 'i',
};
const LEET_SOURCE = /[03457@$1!|]/g;

/** Anything that is not a letter or a digit is a separator. One quantifier
 *  over one class, so it has nothing to backtrack over. */
const NON_ALPHANUMERIC = /[^\p{L}\p{N}]+/u;

/**
 * How many consecutive single-character tokens it takes before they are
 * rejoined into one word.
 *
 * Two would be wrong: `a`, `e`, `o`, `u` and `y` are all real Spanish words, so
 * a run of two fuses ordinary prose. Three consecutive single letters does not
 * occur in natural Spanish, while the shortest listed term is four letters
 * long — so every spaced-out evasion clears the bar and no sentence does.
 */
const MIN_JOIN_RUN = 3;

function fold(value: string): string {
  return value
    .replace(NTILDE_SOURCE, NTILDE_SENTINEL)
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(FORMAT_CHARS, '')
    .toLowerCase()
    .replace(HOMOGLYPH_SOURCE, (char) => HOMOGLYPHS[char])
    .replace(LEET_SOURCE, (char) => LEET[char])
    .replace(NTILDE_RESTORE, 'ñ');
}

/**
 * Rejoins runs of single letters ("v i a g r a") and normalises every other
 * separator to a single space, so a multi-word term still matches across a
 * line break or a hyphen ("click-here", "buy\n\nnow").
 *
 * A split and a loop rather than a regex, on purpose: the pattern that says
 * "a letter, then repeated groups of separators-then-a-letter" needs a
 * quantifier inside a quantifier, and this function runs on unauthenticated
 * public input. A linear loop cannot be made to backtrack at all.
 */
function joinSpacedLetters(value: string): string {
  const tokens = value.split(NON_ALPHANUMERIC).filter(Boolean);
  const out: string[] = [];
  let run: string[] = [];

  const flushRun = () => {
    if (run.length >= MIN_JOIN_RUN) out.push(run.join(''));
    else out.push(...run);
    run = [];
  };

  for (const token of tokens) {
    if (token.length === 1) {
      run.push(token);
      continue;
    }
    flushRun();
    out.push(token);
  }
  flushRun();

  return out.join(' ');
}

/**
 * Every string a term is matched against: the original — lowercased and nothing
 * else, so an exact accented hit is never lost to the fold — then the fold,
 * then the fold with spaced-out letters rejoined.
 *
 * Deduplicated, so ordinary unaccented Spanish prose collapses to two forms and
 * the per-term cost stays close to what it was before normalisation existed.
 */
function candidateForms(value: string): string[] {
  const folded = fold(value);
  return [...new Set<string>([value.toLowerCase(), folded, joinSpacedLetters(folded)])];
}

/* ============================================================================
   Blocklist
   ----------------------------------------------------------------------------
   Weights are per term, not per list, because "cabrón" and "casino" are not the
   same kind of problem. A profanity or illicit hit is sized to cross the
   testimonial threshold on its own and bounce the submission; most spam hits
   are sized to sink the row to the top of the review queue and stop there.
   ========================================================================== */

type TermCategory = 'profanity' | 'spam' | 'illicit';

interface BannedTerm {
  term: string;
  category: TermCategory;
  /** Overrides the category default. Always carries its reason with it. */
  weight?: number;
}

const CATEGORY_WEIGHT: Record<TermCategory, number> = {
  profanity: 45,
  illicit: 45,
  spam: 30,
};

const BANNED_TERMS: readonly BannedTerm[] = [
  // Profanidad en español
  { term: 'puto', category: 'profanity' },
  { term: 'puta', category: 'profanity' },
  { term: 'mierda', category: 'profanity' },
  { term: 'coño', category: 'profanity' },
  { term: 'carajo', category: 'profanity' },
  { term: 'pendejo', category: 'profanity' },
  { term: 'pendeja', category: 'profanity' },
  { term: 'chingar', category: 'profanity' },
  { term: 'verga', category: 'profanity' },
  { term: 'marico', category: 'profanity' },
  { term: 'cabron', category: 'profanity' },
  { term: 'cabrona', category: 'profanity' },
  { term: 'hijueputa', category: 'profanity' },
  { term: 'malparido', category: 'profanity' },
  { term: 'malparida', category: 'profanity' },
  { term: 'gonorrea', category: 'profanity' },
  { term: 'berraco', category: 'profanity' },

  // Profanidad en inglés
  { term: 'fuck', category: 'profanity' },
  { term: 'shit', category: 'profanity' },
  { term: 'bitch', category: 'profanity' },
  { term: 'asshole', category: 'profanity' },
  { term: 'bastard', category: 'profanity' },
  { term: 'cunt', category: 'profanity' },
  { term: 'pussy', category: 'profanity' },
  { term: 'cock', category: 'profanity' },
  // `damn` is barely profanity and `dick` is a given name. Both stay on the
  // list because neither belongs on a clinic homepage, but neither is allowed
  // to reject a submission by itself: a patient called Dick would otherwise be
  // told his testimonial is inappropriate and shown the door.
  { term: 'damn', category: 'profanity', weight: 20 },
  { term: 'dick', category: 'profanity', weight: 20 },

  // Spam comercial. Pharmacy spam has no innocent reading in a dental
  // testimonial, so it rejects. Gambling does have one — Santiago has casinos
  // and patients have jobs — so it only buys the reviewer's attention.
  { term: 'viagra', category: 'spam', weight: 45 },
  { term: 'cialis', category: 'spam', weight: 45 },
  { term: 'casino', category: 'spam' },
  { term: 'poker', category: 'spam' },
  { term: 'lottery', category: 'spam' },
  { term: 'click here', category: 'spam' },
  { term: 'buy now', category: 'spam' },
  { term: 'limited time', category: 'spam' },
  { term: 'act now', category: 'spam' },
  { term: 'free money', category: 'spam' },
  { term: 'make money fast', category: 'spam' },
  // Ordinary English that a happy patient could write ("this clinic is a
  // winner"), so: a hint, not a verdict.
  { term: 'winner', category: 'spam', weight: 20 },
  { term: 'work from home', category: 'spam', weight: 20 },

  // Contenido ilícito
  { term: 'drug dealer', category: 'illicit' },
  { term: 'illegal drugs', category: 'illicit' },
  { term: 'cocaine', category: 'illicit' },
  { term: 'heroin', category: 'illicit' },
  { term: 'meth', category: 'illicit' },
  { term: 'marijuana sale', category: 'illicit' },
];

/**
 * Lets every `i` and every `l` in a pattern match either letter, which is how
 * the guess `LEET` had to make about `1`/`!`/`|` is handed back.
 *
 * Only ever applied to sources written by hand in this file, which is what
 * makes the blunt `.replace()` safe: no JavaScript escape sequence contains an
 * `i` or an `l`, and none of these sources contains a character class of its
 * own for the replacement to nest inside. Keep it that way.
 */
function acceptEitherLetter(source: string): string {
  return source.replace(/[il]/g, '[il]');
}

/**
 * Builds the matcher for one term.
 *
 * The boundaries are Unicode lookarounds, not `\b`. `\b` is defined in terms of
 * `[A-Za-z0-9_]`, so it sees a boundary between `o` and `ó` — matching a term
 * inside a longer accented Spanish word — while treating `_viagra_` as one
 * unbroken word and refusing to match it at all. `\p{L}\p{N}` gets both right.
 *
 * The separator between the words of a multi-word term is a character class
 * that cannot overlap the letters on either side of it, so a given string has
 * exactly one possible decomposition and the pattern cannot backtrack.
 */
function buildTermPattern(term: string): RegExp {
  const literal = acceptEitherLetter(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .replace(/\s+/g, '[^\\p{L}\\p{N}]+');
  return new RegExp(`(?<![\\p{L}\\p{N}])${literal}(?![\\p{L}\\p{N}])`, 'u');
}

/** Compiled once at module load. Fifty literal patterns against the two or
 *  three candidate forms of a field is a few hundred microseconds, which is
 *  why this is still a loop rather than one giant alternation — an alternation
 *  match would not say which term fired, and the reviewer needs to know. */
const COMPILED_TERMS: readonly (BannedTerm & { pattern: RegExp })[] = BANNED_TERMS.map((entry) => ({
  ...entry,
  pattern: buildTermPattern(entry.term),
}));

/*
 * IMPORTANT: no pattern that is tested against a submission carries the `g`
 * flag — not the term patterns built above, not the ones declared below.
 *
 * `RegExp.prototype.test()` on a global regex advances `lastIndex` and resumes
 * from there on the next call. These are module-level constants in a
 * long-lived server process, so the state persisted across HTTP requests: a
 * spam testimonial would be flagged once, leave `lastIndex` past the match,
 * and the very next submission containing the same pattern would test `false`
 * and score a clean 100. That no longer auto-publishes anything — nothing does
 * — but it would file real pharmacy spam at the very top of the human review
 * queue wearing a perfect score, which is the same bug in a different hat.
 *
 * `g` buys nothing for `.test()`, which only ever asks "does this match at
 * all". The few patterns that do need `g` are the ones used with `.match()`
 * and `.replace()`, both of which reset `lastIndex` themselves; they are
 * declared separately, below, and are never handed to `.test()`.
 */

/** Sources rather than literals so they go through `acceptEitherLetter` too —
 *  otherwise "m1racle cure" walks past a list that catches "miracle cure". */
const MEDICAL_SPAM: readonly RegExp[] = [
  'lose \\d+ (?:pounds|kg|weight)',
  '(?:enlarge|increase|enhance) (?:penis|breast|size)',
  'miracle (?:cure|treatment|pill)',
].map((source) => new RegExp(acceptEitherLetter(source), 'i'));

/* ============================================================================
   Structural signals
   ----------------------------------------------------------------------------
   Shape rather than vocabulary: a link, an address, a phone number, a price.
   These run against the ORIGINAL text only — the fold turns digits into
   letters, which would erase the very thing they are looking for.
   ========================================================================== */

interface StructuralSignal {
  flag: string;
  pattern: RegExp;
  weight: number;
  /** Skipped on fields where this is ordinary content rather than a signal.
   *  A patient writing "¿cuánto cuesta? mi teléfono es 8095551234" is using
   *  the contact form exactly as intended. */
  contactDetail?: boolean;
}

const STRUCTURAL_SIGNALS: readonly StructuralSignal[] = [
  { flag: 'contains a link', weight: 30, pattern: /(?:https?:\/\/|www\.)\S+/i },
  {
    flag: 'contains a bare domain',
    weight: 25,
    // The lookbehind excludes `.`, `@` and `/` so a link or an address already
    // charged for above is not charged for a second time — two signals on one
    // URL was enough to push an otherwise fine testimonial under the
    // rejection threshold and bounce it back to its author.
    pattern: /(?<![\p{L}\p{N}@./])[\p{L}\p{N}-]{2,63}\.(?:com|net|org|info|biz|shop|online|site|click|link|xyz|top|ru|cn|io|co)(?![\p{L}\p{N}])/iu,
  },
  {
    flag: 'contains an email address',
    weight: 30,
    contactDetail: true,
    // Every quantifier is bounded and no class overlaps the literal that
    // follows it, so a given string has one possible decomposition. The
    // pattern this replaced — [A-Z0-9.-]+\.[A-Z]{2,} — let `.` be matched by
    // both the class and the literal, so a 2000-character message of dots and
    // letters that never completed a match walked the engine through a cubic
    // number of splits. On a public intake form that is a denial of service.
    pattern: /[^\s@]{1,64}@[\p{L}\p{N}-]{1,63}(?:\.[\p{L}\p{N}-]{1,63}){0,3}\.[\p{L}]{2,24}/u,
  },
  {
    flag: 'contains a long run of digits',
    weight: 30,
    contactDetail: true,
    pattern: /(?<!\d)\d{10,}(?!\d)/,
  },
  {
    flag: 'contains a money amount',
    weight: 20,
    contactDetail: true,
    // The old pattern ended in a bare `\$`, which made its first two branches
    // dead weight and fired on any stray dollar sign.
    pattern: /[€$£]\s?\d|\d\s?[€$£]|(?<![\p{L}\p{N}])(?:usd|eur|dop)(?![\p{L}\p{N}])/iu,
  },
  { flag: 'repeats one character five or more times', weight: 30, pattern: /(.)\1{4,}/u },
];

/* ============================================================================
   Character-class guards
   ========================================================================== */

/**
 * Control characters that are unacceptable in any field, in any language.
 *
 * This is the server-side backstop for the rule the Zod schemas already state
 * at both ends of the wire. A moderator that can be pointed at a field with no
 * schema in front of it — which is the whole point of `moderateFields` — must
 * not be the weakest link in that chain.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** Legal inside a textarea, never inside a name or a city. */
const LINE_BREAKS = /[\t\n\r]/;

/**
 * Invisible characters that are not part of an emoji sequence. Two problems
 * under one flag: zero-width characters split a banned word without looking
 * like anything at all, and the bidi overrides (U+202A–U+202E) reorder how text
 * renders — so the reviewer approving a row in the admin queue can be shown
 * something other than what is stored, published and exported.
 */
const INVISIBLE_CHARS = new RegExp(INVISIBLE_SOURCE);

/** Same members, for stripping rather than testing. */
const INVISIBLE_CHARS_GLOBAL = new RegExp(INVISIBLE_SOURCE, 'g');

/** `g` because these are counted with `.match()` and stripped with
 *  `.replace()`, both of which reset `lastIndex`. Never given to `.test()`. */
const UPPERCASE_LETTERS = /\p{Lu}/gu;
const ANY_LETTER = /\p{L}/gu;
const SPECIAL_CHARS = /[!@#$%^&*()]/g;
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u20E3\u200D]/gu;

/* ============================================================================
   Public API
   ========================================================================== */

export interface ModerationField {
  /** Prefixes every flag this field produces, so a reviewer can tell which
   *  field was the problem. Use the column it will be stored in. */
  name: string;
  value: string;
  /** 'prose' allows line breaks and is judged on shouting, punctuation and
   *  emoji ratios. 'line' (the default) is a name, a city, a subject. */
  form?: 'line' | 'prose';
  minLength?: number;
  maxLength?: number;
  /** See `StructuralSignal.contactDetail`. */
  allowsContactDetails?: boolean;
}

export interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
  /** 0–100. A queue-priority hint, NOT a publish gate — see the file header.
   *  Across several fields it is the worst field's score, because a reviewer's
   *  attention should be bought by the worst thing in the row. */
  score: number;
  flags: string[];
  /** Per field, so the reviewer can be pointed straight at the bad one. */
  fieldScores: Record<string, number>;
}

export interface ModerationOptions {
  /** A field scoring below this bounces the whole submission back to its
   *  writer. Defaults to the testimonial threshold. */
  rejectBelow?: number;
}

/** Publication, next to the clinic's name, on its own homepage. */
const TESTIMONIAL_THRESHOLD = 60;

/**
 * A private message to the practice, which is why it is the more permissive of
 * the two. A patient swearing about the pain they are in still has to be able
 * to reach the clinic; refusing their message is a worse outcome than an ugly
 * row in an inbox only staff can see.
 */
const CONTACT_THRESHOLD = 50;

function scoreField(field: ModerationField): { score: number; flags: string[] } {
  const { name, value } = field;
  const form = field.form ?? 'line';
  const flags: string[] = [];
  let score = 100;

  const deduct = (points: number, reason: string) => {
    score -= points;
    flags.push(`${name}: ${reason}`);
  };

  // Malformed input is settled before anything else. A field carrying control
  // characters was not typed by a person into a browser, and scoring it as if
  // it were prose answers the wrong question about it.
  if (CONTROL_CHARS.test(value) || (form === 'line' && LINE_BREAKS.test(value))) {
    return { score: 0, flags: [`${name}: contains control characters`] };
  }

  if (INVISIBLE_CHARS.test(value)) {
    deduct(40, 'contains invisible or direction-changing characters');
  }

  const text = value.trim();

  if (field.minLength !== undefined && text.length < field.minLength) {
    deduct(50, `shorter than ${field.minLength} characters`);
  }
  if (field.maxLength !== undefined && text.length > field.maxLength) {
    deduct(20, `longer than ${field.maxLength} characters`);
  }

  const forms = candidateForms(text);

  for (const entry of COMPILED_TERMS) {
    if (forms.some((candidate) => entry.pattern.test(candidate))) {
      deduct(
        entry.weight ?? CATEGORY_WEIGHT[entry.category],
        `contains banned word "${entry.term}" (${entry.category})`,
      );
    }
  }

  for (const pattern of MEDICAL_SPAM) {
    if (forms.some((candidate) => pattern.test(candidate))) {
      deduct(35, 'contains a medical spam pattern');
    }
  }

  for (const signal of STRUCTURAL_SIGNALS) {
    if (signal.contactDetail && field.allowsContactDetails) continue;
    if (signal.pattern.test(text)) {
      deduct(signal.weight, signal.flag);
    }
  }

  // The ratios are prose-only. Names and cities arrive in block capitals all
  // day long because that is how they are printed on the cédula the patient is
  // copying from, and "Santiago (R.D.)" is punctuation-dense for its length.
  if (form === 'prose') {
    const letters = (text.match(ANY_LETTER) || []).length;
    const uppercase = (text.match(UPPERCASE_LETTERS) || []).length;
    if (text.length > 20 && letters > 0 && uppercase / letters > 0.5) {
      deduct(25, 'is mostly uppercase');
    }

    const special = (text.match(SPECIAL_CHARS) || []).length;
    if (text.length > 0 && special / text.length > 0.15) {
      deduct(20, 'is mostly special characters');
    }
  }

  // Only fires when emoji are actually present, so a field that is merely
  // short is charged for being short once rather than twice.
  const withoutEmoji = text.replace(EMOJI, '').trim();
  if (withoutEmoji.length < text.length && withoutEmoji.length < Math.max(field.minLength ?? 0, 3)) {
    deduct(30, 'has no content once the emoji are removed');
  }

  return { score: Math.max(0, Math.min(100, score)), flags };
}

/**
 * The moderator. Takes as many fields as the submission has, which is the
 * point of it: under the old API the testimonial `location` was never moderated
 * at all, because the entry point took a quote and a name as two positional
 * arguments and there was nowhere to put a third. "Santiago — viagra.com" went
 * onto the homepage under a patient's name, unread.
 */
export function moderateFields(
  fields: readonly ModerationField[],
  options?: ModerationOptions,
): ModerationResult {
  const rejectBelow = options?.rejectBelow ?? TESTIMONIAL_THRESHOLD;
  const flags: string[] = [];
  const fieldScores: Record<string, number> = {};
  let worst = 100;

  for (const field of fields) {
    const result = scoreField(field);
    fieldScores[field.name] = result.score;
    flags.push(...result.flags);
    worst = Math.min(worst, result.score);
  }

  return {
    isAppropriate: worst >= rejectBelow,
    reason: flags.length > 0 ? flags.join(', ') : undefined,
    score: worst,
    flags,
    fieldScores,
  };
}

/**
 * Testimonials: the quote, the display name, and — now — the location. All
 * three are published verbatim beside the clinic's name, so all three are read.
 *
 * The lengths mirror the Zod schemas in `actions.ts` so that the moderator
 * agrees with the validator that already ran, rather than inventing a second
 * opinion about the same field.
 */
export function moderateTestimonial(quote: string, name?: string, location?: string): ModerationResult {
  const fields: ModerationField[] = [
    { name: 'quote', value: quote, form: 'prose', minLength: 15, maxLength: 500 },
  ];

  if (name?.trim()) {
    fields.push({ name: 'name', value: name, minLength: 2, maxLength: 100 });
  }
  if (location?.trim()) {
    fields.push({ name: 'location', value: location, maxLength: 100 });
  }

  return moderateFields(fields, { rejectBelow: TESTIMONIAL_THRESHOLD });
}

/**
 * Contact messages: private, so the bar is lower, and the writer's own phone
 * number, address and questions about price are content rather than signal.
 */
export function moderateContactMessage(message: string, name?: string): ModerationResult {
  const fields: ModerationField[] = [
    { name: 'message', value: message, form: 'prose', minLength: 10, maxLength: 2000, allowsContactDetails: true },
  ];

  if (name?.trim()) {
    fields.push({ name: 'name', value: name, minLength: 2, maxLength: 100, allowsContactDetails: true });
  }

  return moderateFields(fields, { rejectBelow: CONTACT_THRESHOLD });
}

/**
 * Neutralises markup in a plain-text field before it is stored.
 *
 * The previous implementation stripped tags and THEN decoded HTML entities,
 * which is exactly backwards. Given `&lt;img src=x onerror=alert(1)&gt;` it
 * found no literal tags to strip, then turned `&lt;`/`&gt;` back into `<`/`>`
 * — manufacturing live markup that had not been there and writing it to the
 * database. The event-handler filter that ran afterwards only matched *quoted*
 * handlers, so the bare `onerror=alert(1)` survived intact.
 *
 * React escapes on render, so this was not a live XSS in the current UI, but
 * the stored value was hostile to any consumer that is not React: an admin
 * CSV export, a notification email, a printed treatment sheet.
 *
 * The fix is ordering, not encoding. Decode once so an encoded payload is
 * unmasked, then strip. Deliberately NOT re-encoding on the way out: storing
 * `&amp;` would double-escape through React and a patient writing
 * "Dr. Valerio & his team" would literally see "&amp;" on the page. Escaping
 * belongs at each output boundary, not in the database.
 */
export function sanitizeText(text: string): string {
  return (
    text
      // 1. Decode once, so encoded payloads are unmasked BEFORE stripping
      //    rather than reconstituted after it.
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;|&#0*39;|&#x0*27;/gi, "'")
      .replace(/&#0*47;|&#x0*2f;/gi, '/')
      .replace(/&amp;/gi, '&')
      // 2. Strip whole elements (body included), then any remaining tag, then
      //    an unterminated tag at end-of-string. The third rule excludes `<`
      //    from the run it scans: on a message of "<a <a <a …" that stops each
      //    attempt at the next `<` instead of walking it to the end of the
      //    string from every one of them, which is quadratic work handed to
      //    public input over a shape that is not markup either way.
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
      .replace(/<\/?[a-z][^<>]*>/gi, '')
      .replace(/<\/?[a-z][^>]*$/gi, '')
      // 3. Dangerous URL schemes and inline handlers, quoted or bare.
      .replace(/(?:javascript|vbscript)\s*:/gi, '')
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      // 4. Control characters, which hide payloads in logs and exports, and
      //    then the invisible formatting characters that outlive them — a bidi
      //    override stored here reorders the row wherever it is later read.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(INVISIBLE_CHARS_GLOBAL, '')
      .trim()
  );
}

/**
 * Valide un email de manière stricte.
 *
 * Anchored at both ends, and every repetition is separated by a literal `.`
 * that none of its own character classes can match — so a long malformed
 * address is rejected in linear time rather than being walked through a
 * combinatorial number of label splits.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Vérifier les domaines suspects
  const suspiciousDomains = [
    'tempmail.', 'throwaway.', 'guerrillamail.', '10minutemail.',
    'mailinator.', 'trashmail.', 'fakeinbox.',
  ];

  const domain = email.toLowerCase().split('@')[1];
  for (const suspicious of suspiciousDomains) {
    if (domain.includes(suspicious)) {
      return false;
    }
  }

  return true;
}

/**
 * Valide un numéro de téléphone
 */
export function validatePhone(phone: string): boolean {
  const digitsOnly = phone.replace(/[^0-9]/g, '');

  // Entre 7 et 15 chiffres
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }

  // Vérifier qu'il ne contient pas que le même chiffre (spam)
  const allSame = /^(\d)\1+$/.test(digitsOnly);
  if (allSame) {
    return false;
  }

  return true;
}
