import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

const FEATURES = ['auth', 'accounts', 'campaigns', 'changelog', 'system']
// Identity is cross-cutting: any feature may ask "who is the user and what can they do".
const SHARED_FEATURES = ['auth']

const DS_PUBLIC_ONLY = [
  {
    group: ['@/design-system/components/*', '@/design-system/composables/*'],
    message: "Import from '@/design-system' (its public API), not from its internals.",
  },
]
const restrict = (files, patterns) => ({ files, rules: { 'no-restricted-imports': ['error', { patterns }] } })

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', 'test-results', 'playwright-report', 'storybook-static', 'review-fixtures'] },
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  // Accessibility rules for templates (labels, alt text, roles, keyboard handlers, ...): WCAG 2.2 AA starts at the linter.
  ...vueA11y.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/first-attribute-linebreak': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      // Text a user typed must never be rendered as HTML (XSS).
      'vue/no-v-html': 'error',
    },
  },

  /*
   * Architecture boundaries (see docs/architecture.md). Dependency direction:
   *   app -> features -> shared -> (nothing)        design-system -> (nothing)
   *   features and shared may use design-system, only through its public entry '@/design-system'.
   *
   * NOTE: with flat config a later rule REPLACES an earlier one for the same files, so each layer
   * below lists every pattern that applies to it. Do not add a second override for the same globs.
   */
  restrict(
    ['src/design-system/**/*.{ts,vue}'],
    [
      {
        group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**', '@/shared/*', '@/shared/**'],
        message: 'The design system is standalone: it cannot depend on application code.',
      },
    ],
  ),
  restrict(
    ['src/shared/**/*.{ts,vue}'],
    [
      {
        group: ['@/features/*', '@/features/**', '@/app/*', '@/app/**'],
        message: 'shared is infrastructure: it cannot depend on features or the app shell.',
      },
      ...DS_PUBLIC_ONLY,
    ],
  ),
  ...FEATURES.map((feature) =>
    restrict(
      [`src/features/${feature}/**/*.{ts,vue}`],
      [
        {
          group: FEATURES.filter((f) => f !== feature && !SHARED_FEATURES.includes(f)).flatMap((f) => [
            `@/features/${f}`,
            `@/features/${f}/**`,
          ]),
          message: 'Features do not import each other. Share through @/shared, or compose in @/app.',
        },
        { group: ['@/app/*', '@/app/**'], message: 'Features cannot depend on the app shell.' },
        ...DS_PUBLIC_ONLY,
      ],
    ),
  ),
  restrict(['src/app/**/*.{ts,vue}'], DS_PUBLIC_ONLY),
  // Our form components label their control with `for` + a generated id (checked by their specs), never by nesting.
  {
    files: ['src/design-system/components/DsInput.vue', 'src/design-system/components/DsSelect.vue'],
    rules: { 'vuejs-accessibility/label-has-for': ['error', { required: { some: ['nesting', 'id'] } }] },
  },
  // Specs mount several tiny throwaway components.
  { files: ['src/**/*.spec.ts'], rules: { 'vue/one-component-per-file': 'off' } },

  // Display formats live in one module (see .claude/rules/dates-and-formats.md).
  {
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/shared/utils/format.ts', 'src/**/*.spec.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        ...['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString'].map((property) => ({
          property,
          message:
            'Format dates and money with @/shared/utils/format (formatDate, formatDateTime, formatMoney) or <DateText>, so every screen looks the same.',
        })),
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.object.name='Intl'][callee.property.name=/^(DateTimeFormat|NumberFormat)$/]",
          message: 'Use @/shared/utils/format instead of building Intl formatters in components.',
        },
      ],
    },
  },
  // The app entry point loads the generated tokens and base styles directly.
  { files: ['src/app/main.ts'], rules: { 'no-restricted-imports': 'off' } },
)
