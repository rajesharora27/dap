/**
 * ESLint Configuration for DAP Backend
 * 
 * This configuration enforces code quality standards including:
 * - TypeScript strict mode
 * - Code complexity limits
 * - Naming conventions
 * - Module boundary enforcement
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.*', 'jest.config.*']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      // ============================================
      // TypeScript Strict Rules
      // ============================================
      
      // Warn on explicit any - work towards removing
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Warn on unused variables (allow underscore prefix for intentional)
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      
      // Require explicit return types on functions (warn for now)
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true
      }],
      
      // Require explicit types at module boundaries
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      
      // Ban ts-comment without explanation
      '@typescript-eslint/ban-ts-comment': ['warn', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': 'allow-with-description',
        'ts-check': false
      }],
      
      // Ensure consistent type imports
      '@typescript-eslint/consistent-type-imports': ['warn', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false
      }],
      
      // No require imports (use ES modules)
      '@typescript-eslint/no-require-imports': 'warn',

      // ============================================
      // Code Quality & Complexity
      // ============================================
      
      // Cyclomatic complexity limit
      'complexity': ['warn', { max: 15 }],
      
      // Maximum depth of nested blocks
      'max-depth': ['warn', { max: 4 }],
      
      // Maximum lines per function
      'max-lines-per-function': ['warn', { 
        max: 150,
        skipBlankLines: true,
        skipComments: true
      }],
      
      // Maximum parameters in a function
      'max-params': ['warn', { max: 5 }],
      
      // Prefer const over let when not reassigned
      'prefer-const': 'error',
      
      // No useless catch that just rethrows
      'no-useless-catch': 'warn',
      
      // Disallow empty blocks (allow empty catch)
      'no-empty': ['warn', { allowEmptyCatch: true }],
      
      // Require case declarations in braces
      'no-case-declarations': 'warn',
      
      // No console in production code (allow warn/error)
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],

      // ============================================
      // Import Rules
      // ============================================
      
      // Import organization
      'import/order': ['warn', {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index'
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }],
      
      // No duplicate imports
      'import/no-duplicates': 'warn',

      // ============================================
      // Module Boundary Rules
      // ============================================
      
      'no-restricted-imports': ['error', {
        patterns: [
          // Prevent cross-module imports
          {
            group: ['../../modules/*'],
            message: '⛔ Use absolute imports for cross-module dependencies'
          },
          // Prevent direct Prisma imports outside of context
          {
            group: ['@prisma/client', '!**/shared/graphql/context*', '!**/prisma*'],
            message: '⛔ Import prisma from shared/graphql/context instead of @prisma/client directly'
          }
        ]
      }]
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        fetch: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly'
      }
    }
  }
);
