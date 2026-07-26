/**
 * Content Moderation System - Hardcoded filters for testimonials and messages
 * No external AI dependencies
 */

// Liste de mots interdits (profanité, spam, contenu inapproprié)
const BANNED_WORDS = [
  // Profanité en espagnol
  'puto', 'puta', 'mierda', 'coño', 'carajo', 'pendejo', 'pendeja', 'chingar', 'verga', 'marico',
  'cabron', 'cabrona', 'hijueputa', 'malparido', 'malparida', 'gonorrea', 'berraco',

  // Profanité en anglais
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'cunt', 'dick', 'pussy', 'cock',

  // Spam patterns
  'viagra', 'cialis', 'casino', 'poker', 'lottery', 'winner', 'click here', 'buy now',
  'limited time', 'act now', 'free money', 'make money fast', 'work from home',

  // Contenu médical inapproprié
  'drug dealer', 'illegal drugs', 'cocaine', 'heroin', 'meth', 'marijuana sale',
];

/*
 * IMPORTANT: none of the patterns below carry the `g` flag.
 *
 * `RegExp.prototype.test()` on a global regex advances `lastIndex` and resumes
 * from there on the next call. These are module-level constants in a
 * long-lived server process, so the state persisted across HTTP requests: a
 * spam testimonial would be flagged once, leave `lastIndex` past the match,
 * and the very next submission containing the same pattern would test `false`
 * and score a clean 100 — auto-approving straight onto the public homepage
 * (the auto-approve threshold is score >= 85).
 *
 * `g` buys nothing here because `.test()` only ever asks "does this match at
 * all". Do not add it back. If a pattern ever needs `g` for `.replace()`,
 * declare that one separately.
 */

// Patterns suspects (regex)
const SUSPICIOUS_PATTERNS = [
  /\b(?:https?:\/\/|www\.)[^\s]+/i, // URLs (pas d'URLs dans les testimonials)
  /\b\d{10,}\b/, // Numéros de téléphone longs
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Emails
  /(.)\1{4,}/, // Caractères répétés (aaaaaa)
  /\$\d+|\d+\$|USD|EUR|€|\$/, // Montants d'argent
  /\b(?:viagra|cialis|casino|lottery)\b/i, // Spam keywords
];

// Pattern de contenu médical suspect
const MEDICAL_SPAM = [
  /lose \d+ (?:pounds|kg|weight)/i,
  /(?:enlarge|increase|enhance) (?:penis|breast|size)/i,
  /miracle (?:cure|treatment|pill)/i,
];

export interface ModerationResult {
  isAppropriate: boolean;
  reason?: string;
  score: number; // 0-100, 100 = très approprié
  flags: string[];
}

/**
 * Modère le contenu des testimonials
 */
export function moderateTestimonial(quote: string, name?: string): ModerationResult {
  const flags: string[] = [];
  let score = 100;

  const normalizedQuote = quote.toLowerCase().trim();
  const normalizedName = name?.toLowerCase().trim() || '';

  // 1. Vérifier la longueur
  if (quote.length < 15) {
    flags.push('Testimonial too short');
    score -= 50;
  }

  if (quote.length > 500) {
    flags.push('Testimonial too long');
    score -= 20;
  }

  // 2. Vérifier les mots bannis
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalizedQuote) || regex.test(normalizedName)) {
      flags.push(`Contains banned word: ${word}`);
      score -= 40;
    }
  }

  // 3. Vérifier les patterns suspects
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(quote)) {
      flags.push(`Contains suspicious pattern: ${pattern.source}`);
      score -= 30;
    }
  }

  // 4. Vérifier le spam médical
  for (const pattern of MEDICAL_SPAM) {
    if (pattern.test(quote)) {
      flags.push('Contains medical spam pattern');
      score -= 35;
    }
  }

  // 5. Vérifier le ratio majuscules (SPAM en CAPS LOCK)
  const uppercaseRatio = (quote.match(/[A-Z]/g) || []).length / quote.length;
  if (uppercaseRatio > 0.5 && quote.length > 20) {
    flags.push('Too many uppercase letters (possible spam)');
    score -= 25;
  }

  // 6. Vérifier les caractères spéciaux excessifs
  const specialCharsRatio = (quote.match(/[!@#$%^&*()]/g) || []).length / quote.length;
  if (specialCharsRatio > 0.15) {
    flags.push('Too many special characters');
    score -= 20;
  }

  // 7. Vérifier si c'est juste des emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const textWithoutEmojis = quote.replace(emojiRegex, '').trim();
  if (textWithoutEmojis.length < 10) {
    flags.push('Content is mostly emojis');
    score -= 30;
  }

  // Score final
  const finalScore = Math.max(0, Math.min(100, score));
  const isAppropriate = finalScore >= 60; // Seuil: 60/100

  return {
    isAppropriate,
    reason: flags.length > 0 ? flags.join(', ') : undefined,
    score: finalScore,
    flags,
  };
}

/**
 * Modère les messages de contact
 */
export function moderateContactMessage(message: string): ModerationResult {
  const flags: string[] = [];
  let score = 100;

  const normalizedMessage = message.toLowerCase().trim();

  // Vérifier les mots bannis
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalizedMessage)) {
      flags.push(`Contains banned word: ${word}`);
      score -= 30;
    }
  }

  // Vérifier patterns spam (moins strict que testimonials)
  const spamPatterns = [
    /click here/i,
    /buy now/i,
    /limited time offer/i,
    /free money/i,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(message)) {
      flags.push('Contains spam pattern');
      score -= 25;
    }
  }

  // Messages de contact peuvent contenir emails/téléphones, donc on ne les bloque pas
  // Mais on détecte les messages trop courts
  if (message.length < 10) {
    flags.push('Message too short');
    score -= 40;
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const isAppropriate = finalScore >= 50; // Seuil plus permissif pour contact

  return {
    isAppropriate,
    reason: flags.length > 0 ? flags.join(', ') : undefined,
    score: finalScore,
    flags,
  };
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
      //    an unterminated tag at end-of-string.
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
      .replace(/<\/?[a-z][^>]*>/gi, '')
      .replace(/<\/?[a-z][^>]*$/gi, '')
      // 3. Dangerous URL schemes and inline handlers, quoted or bare.
      .replace(/(?:javascript|vbscript)\s*:/gi, '')
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      // 4. Control characters, which hide payloads in logs and exports.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
  );
}

/**
 * Valide un email de manière stricte
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
