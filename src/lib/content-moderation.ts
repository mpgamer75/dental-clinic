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

// Patterns suspects (regex)
const SUSPICIOUS_PATTERNS = [
  /\b(?:https?:\/\/|www\.)[^\s]+/gi, // URLs (pas d'URLs dans les testimonials)
  /\b\d{10,}\b/g, // Numéros de téléphone longs
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Emails
  /(.)\1{4,}/g, // Caractères répétés (aaaaaa)
  /\$\d+|\d+\$|USD|EUR|€|\$/g, // Montants d'argent
  /\b(?:viagra|cialis|casino|lottery)\b/gi, // Spam keywords
];

// Pattern de contenu médical suspect
const MEDICAL_SPAM = [
  /lose \d+ (?:pounds|kg|weight)/gi,
  /(?:enlarge|increase|enhance) (?:penis|breast|size)/gi,
  /miracle (?:cure|treatment|pill)/gi,
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
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
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
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(normalizedMessage)) {
      flags.push(`Contains banned word: ${word}`);
      score -= 30;
    }
  }

  // Vérifier patterns spam (moins strict que testimonials)
  const spamPatterns = [
    /click here/gi,
    /buy now/gi,
    /limited time offer/gi,
    /free money/gi,
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
 * Sanitize HTML pour prévenir XSS
 * Retire tous les tags HTML et caractères dangereux
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Retirer HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Retirer scripts
    .replace(/javascript:/gi, '') // Retirer javascript: URLs
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Retirer event handlers
    .trim();
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
