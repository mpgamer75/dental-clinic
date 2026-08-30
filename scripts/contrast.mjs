/**
 * WCAG contrast for the OKLCH tokens in globals.css.
 *
 * globals.css asserts that every foreground/background pair is >= AA in both
 * themes and warns against hand-tuning a channel without re-checking. That
 * promise is only worth anything if it can be re-run, so this re-runs it:
 * parse the tokens, convert OKLCH -> linear sRGB -> relative luminance, and
 * report every pair that matters.
 *
 *   node scripts/contrast.mjs [path-to-globals.css]
 *
 * Exits non-zero if any required pair fails, so it can gate a change.
 */
import fs from 'node:fs';

/* --- OKLCH -> sRGB (Björn Ottosson's oklab, D65) ------------------------- */
function oklchToSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Linear-light channel -> relative luminance contribution. Values outside
 *  [0,1] mean the colour is out of the sRGB gamut; clamp, and flag it. */
function luminance(linear) {
  const [r, g, b] = linear.map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const inGamut = (linear) => linear.every((v) => v >= -0.001 && v <= 1.001);

function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/* --- token parsing ------------------------------------------------------- */
function parseTokens(css) {
  const blocks = { root: {}, dark: {} };
  const re = /(:root|\.dark)\s*\{([\s\S]*?)\n  \}/g;
  let m;
  while ((m = re.exec(css))) {
    const target = m[1] === ':root' ? blocks.root : blocks.dark;
    for (const line of m[2].split('\n')) {
      const d = /^\s*(--[\w-]+)\s*:\s*([^;]+);/.exec(line);
      if (d) target[d[1]] = d[2].trim();
    }
  }
  return blocks;
}

function resolve(vars, fallback, value, depth = 0) {
  if (depth > 20) return value;
  return value.replace(/var\((--[\w-]+)\)/g, (_, n) => {
    const next = vars[n] ?? fallback[n];
    return next === undefined ? '' : resolve(vars, fallback, next, depth + 1);
  });
}

function triple(vars, fallback, name) {
  const raw = vars[name] ?? fallback[name];
  if (!raw) return null;
  const parts = resolve(vars, fallback, raw).trim().split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return parts.slice(0, 3);
}

/* --- the pairs the design system actually renders ------------------------ */
const PAIRS = [
  ['--ink', '--canvas', 4.5, 'body text on page'],
  ['--ink', '--canvas-sunk', 4.5, 'body text on sunk band'],
  ['--ink', '--surface', 4.5, 'body text on card'],
  ['--ink-soft', '--canvas', 4.5, 'secondary text on page'],
  ['--ink-soft', '--surface', 4.5, 'secondary text on card'],
  ['--ink-faint', '--canvas', 3.0, 'faint text (large/decorative)'],
  ['--primary-foreground', '--primary-base', 4.5, 'label on primary button'],
  ['--primary-base', '--canvas', 3.0, 'primary as a graphic/border'],
  ['--primary-base', '--surface', 3.0, 'primary on card'],
  ['--on-drench', '--drench', 4.5, 'text on drenched band'],
  ['--on-drench', '--drench-deep', 4.5, 'text on deep drenched band'],
  ['--brass-ink', '--canvas', 4.5, 'brass text on page'],
  ['--brass-ink', '--canvas-sunk', 4.5, 'brass text on sunk band'],
  ['--brass-lift', '--drench-deep', 4.5, 'brass text on deep drench'],
  ['--on-brass', '--brass', 4.5, 'text on brass fill'],
  ['--destructive-foreground', '--danger', 4.5, 'text on danger fill'],
  ['--success-foreground', '--ok', 4.5, 'text on success fill'],
  ['--warning-foreground', '--warn', 4.5, 'text on warning fill'],
  ['--sidebar-foreground', '--sidebar-background', 4.5, 'admin sidebar text'],
  ['--sidebar-primary-foreground', '--sidebar-primary', 4.5, 'admin sidebar active'],
  ['--accent-foreground', '--accent', 4.5, 'text on accent tint'],
  ['--ring', '--canvas', 3.0, 'focus ring on page'],
];

const file = process.argv[2] ?? 'src/app/globals.css';
const blocks = parseTokens(fs.readFileSync(file, 'utf8'));

let failures = 0;
let gamut = 0;
for (const theme of ['root', 'dark']) {
  const vars = blocks[theme];
  const fallback = theme === 'dark' ? blocks.root : {};
  console.log(`\n${theme === 'root' ? 'LIGHT' : 'DARK'}`);
  console.log('  ratio  min   pair');
  for (const [fg, bg, min, label] of PAIRS) {
    const f = triple(vars, fallback, fg);
    const b = triple(vars, fallback, bg);
    if (!f || !b) { console.log(`  ????   ${min.toFixed(1)}   ${label}  (token missing)`); failures++; continue; }
    const lf = oklchToSrgb(...f), lb = oklchToSrgb(...b);
    if (!inGamut(lf)) { console.log(`  !! ${fg} is outside the sRGB gamut`); gamut++; }
    if (!inGamut(lb)) { console.log(`  !! ${bg} is outside the sRGB gamut`); gamut++; }
    const c = contrast(lf, lb);
    const ok = c >= min;
    if (!ok) failures++;
    console.log(`  ${c.toFixed(2).padStart(5)}  ${min.toFixed(1)}  ${ok ? 'ok  ' : 'FAIL'} ${label}  (${fg} on ${bg})`);
  }
}

console.log(`\n${failures === 0 ? 'PASS' : `FAIL — ${failures} pair(s) below threshold`}${gamut ? `, ${gamut} gamut warning(s)` : ''}`);
process.exit(failures === 0 ? 0 : 1);
