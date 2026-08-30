/**
 * Resolve every design token in globals.css to its computed value.
 *
 * The palette is a two-layer system: a raw ramp, then semantic aliases that
 * point at it with var(). That indirection is what makes a rehue a one-place
 * edit, but it also means source text and computed value can diverge — an alias
 * can be rewritten with no visual effect, or a raw value can change and quietly
 * move a dozen semantic tokens with it. Reading the diff cannot tell you which
 * happened.
 *
 * So: resolve both revisions and compare computed values.
 *
 *   git show HEAD:src/app/globals.css > /tmp/before.css
 *   node scripts/resolve-tokens.mjs /tmp/before.css src/app/globals.css
 *
 * Use it to prove a refactor is a no-op, and after a rehue to confirm that
 * exactly the tokens you meant to move actually moved.
 */
import fs from 'node:fs';

/** Pull the :root and .dark custom-property blocks out of a stylesheet. */
function parse(file) {
  const css = fs.readFileSync(file, 'utf8');
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

/** Expand var() chains to a literal. `fallback` carries :root for .dark, which
 *  only overrides a subset of the palette. */
function resolve(vars, fallback, value, depth = 0) {
  if (depth > 20) return '<<cycle>>';
  return value.replace(/var\((--[\w-]+)\)/g, (_, name) => {
    const next = vars[name] ?? fallback[name];
    return next === undefined ? `<<missing ${name}>>` : resolve(vars, fallback, next, depth + 1);
  });
}

const [beforeFile, afterFile] = process.argv.slice(2);
if (!beforeFile || !afterFile) {
  console.error('usage: node scripts/resolve-tokens.mjs <before.css> <after.css>');
  process.exit(2);
}

const before = parse(beforeFile);
const after = parse(afterFile);

let diffs = 0;
let checked = 0;
for (const theme of ['root', 'dark']) {
  const bFall = theme === 'dark' ? before.root : {};
  const aFall = theme === 'dark' ? after.root : {};
  const names = new Set([...Object.keys(before[theme]), ...Object.keys(after[theme])]);
  for (const n of names) {
    const b = before[theme][n] === undefined ? undefined : resolve(before[theme], bFall, before[theme][n]);
    const a = after[theme][n] === undefined ? undefined : resolve(after[theme], aFall, after[theme][n]);
    checked++;
    if (b !== a) {
      diffs++;
      console.log(`  ${theme} ${n}\n    before: ${b}\n    after : ${a}`);
    }
  }
}

console.log(`\nresolved ${checked} token definitions across both themes`);
console.log(
  diffs === 0
    ? 'RESULT: computed values identical — no visual change'
    : `RESULT: ${diffs} token(s) changed value`,
);
process.exit(0);
