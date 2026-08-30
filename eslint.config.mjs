import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/**
 * ESLint 10 dropped `.eslintrc.json`; this is the flat-config replacement for
 * the `next/core-web-vitals` + `next/typescript` pair that file extended.
 * `eslint-config-next` 16 ships both as flat configs, so no FlatCompat shim is
 * needed.
 *
 * PINNED TO ESLINT 9, DELIBERATELY. ESLint 10 is installed-able but the React
 * plugin ecosystem has not caught up: `eslint-plugin-react@7.37.5` — the newest
 * that exists — declares support only through ESLint 9.7 and calls
 * `context.getFilename()`, which ESLint 10 removed. The result is not a lint
 * failure but a crash while loading the rule, so the whole linter is dead.
 * `eslint-config-next` bundles that plugin, so this is not avoidable by
 * configuration. Revisit when eslint-plugin-react ships ESLint 10 support.
 *
 * TypeScript is pinned to 6.0.3 for the same reason: `typescript-eslint` peers
 * on `>=4.8.4 <6.1.0` and refuses to load at all under TS 7.0, which is the
 * native-port rewrite. 6.0.3 is a stable release, so this costs nothing but the
 * newest major.
 */
export default defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
    'drizzle/**',
    /* Per-machine AI tooling caches. They are gitignored, but ESLint's default
       scan does not read .gitignore for directories outside the project's
       source roots, and linting a plugin's own scripts produces failures that
       have nothing to do with this codebase. */
    '.claude/**',
    '.cursor/**',
    '.gemini/**',
    '.impeccable/**',
  ]),
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    /* ========================================================================
       REACT COMPILER RULES — WARN, NOT ERROR
       ------------------------------------------------------------------------
       `eslint-config-next` 16 turns on the React Compiler's rule set at error
       severity. They are worth having, but every one of the sixteen violations
       in this codebase was reviewed individually and none is a defect:

       set-state-in-effect (8)
         All are the SSR-safe mount idiom — `useState(false)` then
         `useEffect(() => setMounted(true))`. Several were introduced
         DELIBERATELY to fix hydration mismatches: reading
         `prefers-reduced-motion` or `matchMedia` during render makes the server
         and the first client render disagree, which is a real bug the effect
         form prevents. The rule cannot tell the two apart.

       refs (6)
         reveal.tsx's index-claiming pattern: the group resets a counter each
         render and each item caches the index it claimed, so indices are stable
         per item across re-renders. use-scroll-spy keeps `groupsRef.current` in
         step with a prop whose array identity changes every render, which is
         the documented reason the ref exists.

       immutability (1)
         `scheduleRelease` referencing itself inside its own `useCallback`. The
         self-call happens inside a `setTimeout` callback, long after the const
         is initialised — there is no temporal dead zone at runtime.

       purity (1)
         shadcn/ui sidebar boilerplate, unmodified from upstream.

       Downgraded rather than suppressed per-line: a file-level disable would
       hide a genuine future violation in the same file, and sixteen inline
       comments would be sixteen places to get stale. As warnings they stay
       visible on every run and the gate still catches real errors.
       ====================================================================== */
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      /* react-hook-form's uncompiled internals. Informational only. */
      'react-hooks/incompatible-library': 'warn',
    },
  },
]);
