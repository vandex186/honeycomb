module.exports = {
  root: true,
  ignorePatterns: [
    'dist/**',
    'docs/**',
    'node_modules/**',
    '**/*.d.ts',
  ],
  extends: ['eslint:recommended', 'prettier'],
  env: {
    es2022: true,
    browser: true,
    node: true,
  },
  rules: {
    'object-shorthand': 'error',
    'no-redeclare': 'off',
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        'no-undef': 'off',
      },
    },
    {
      files: ['src/**/*.ts'],
      excludedFiles: ['src/**/*.test.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        '@typescript-eslint/unified-signatures': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'off',
      },
    },
    {
      files: ['vite.config.ts', 'vitest.config.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        'no-undef': 'off',
      },
    },
    {
      files: ['playground/**/*', 'examples/**/*'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        'no-undef': 'off',
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': 'off',
      },
    },
  ],
}
