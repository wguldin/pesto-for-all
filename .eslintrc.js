module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  ignorePatterns: [
    'assets/cartjs.min.js'  // External minified library
  ],
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
    
    // New utilities and systems
    Utils: 'writable',
    Config: 'writable',
    ErrorHandler: 'writable',
    ThemeError: 'writable',
    CartError: 'writable',
    FormError: 'writable',
    ModalError: 'writable',
    APIError: 'writable',
    
    // Analytics globals
    gtag: 'readonly',
    
    // Test globals
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