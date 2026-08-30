import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/**
 * ESLint 10 dropped `.eslintrc.json`; this is the flat-config replacement for
 * the `next/core-web-vitals` + `next/typescript` pair that file extended.
 * `eslint-config-next` 16 ships both as flat configs, so no FlatCompat shim is
 * needed.
 */
export default defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
    'drizzle/**',
  ]),
  ...nextCoreWebVitals,
  ...nextTypeScript,
]);
