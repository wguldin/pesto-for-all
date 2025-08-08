module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    'vitest-globals/env': true
  },
  extends: [
    'eslint:recommended'
  ],
  plugins: [
    'vitest-globals'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    // Shopify globals
    Shopify: 'readonly',
    CartJS: 'readonly',
    jQuery: 'readonly',
    $: 'readonly',
    
    // Theme globals
    addToCart: 'writable',
    cartManager: 'writable',
    productForms: 'writable',
    blockTransitions: 'writable',
    mobileMenu: 'writable',
    
    // Test globals (handled by vitest-globals plugin)
    describe: 'readonly',
    it: 'readonly',
    expect: 'readonly',
    vi: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
    beforeAll: 'readonly',
    afterAll: 'readonly'
  },
  rules: {
    // Code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    
    // Best practices
    'eqeqeq': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Modern JS
    'prefer-const': 'warn',
    'no-var': 'warn',
    'prefer-template': 'warn',
    
    // Shopify theme specific
    'no-alert': 'warn' // Prefer proper notifications
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-console': 'off' // Allow console in tests
      }
    }
  ]
};