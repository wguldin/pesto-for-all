/**
 * Configuration management for Pesto Shopify theme
 * Centralizes all theme settings and provides environment-aware configuration
 */

/**
 * @namespace Config
 * @description Theme configuration and settings management
 */
window.Config = {
  /**
   * Environment detection
   */
  environment: {
    isDevelopment: window.location.hostname === 'localhost' || 
                  window.location.hostname.includes('ngrok') ||
                  window.location.hostname.includes('dev'),
    isProduction: window.location.hostname.includes('.myshopify.com') ||
                 !window.location.hostname.includes('localhost'),
    isStaging: window.location.hostname.includes('staging') ||
              window.location.hostname.includes('preview')
  },

  /**
   * Debug settings based on environment
   */
  debug: {
    enabled: false, // Will be overridden based on environment
    cartEvents: false,
    formValidation: false,
    analytics: false,
    performance: false
  },

  /**
   * Cart configuration
   */
  cart: {
    maxQuantity: 50,
    maxItemQuantity: 10,
    autoOpen: true,
    showNotifications: true,
    notificationDuration: 3000,
    animationDuration: 400,
    dependencyTimeout: 5000,
    dependencyRetries: 100
  },

  /**
   * Form configuration
   */
  forms: {
    validateOnSubmit: true,
    validateOnBlur: true,
    showInlineErrors: true,
    submitTimeout: 10000,
    showLoadingStates: true
  },

  /**
   * Modal configuration
   */
  modals: {
    closeOnEscape: true,
    closeOnOverlay: true,
    focusOnOpen: true,
    restoreOnClose: true,
    animationDuration: 300
  },

  /**
   * Animation configuration
   */
  animations: {
    duration: 300,
    easing: 'ease',
    respectReducedMotion: true,
    intersectionThreshold: 0.1,
    intersectionRootMargin: '0px 0px -50px 0px'
  },

  /**
   * Performance configuration
   */
  performance: {
    enableLazyLoading: true,
    debounceDelay: 250,
    throttleDelay: 100,
    imageFadeIn: true,
    preloadCriticalImages: true
  },

  /**
   * Analytics configuration
   */
  analytics: {
    enabled: true,
    trackPageViews: true,
    trackCartEvents: true,
    trackFormSubmissions: true,
    trackErrors: true,
    enhancedEcommerce: true
  },

  /**
   * Notification configuration
   */
  notifications: {
    position: 'top-right',
    duration: 3000,
    showSuccess: false, // Cart opening provides sufficient feedback
    showError: true,
    showWarning: true,
    showInfo: false,
    maxVisible: 3
  },

  /**
   * API configuration
   */
  api: {
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  /**
   * Accessibility configuration
   */
  accessibility: {
    announceChanges: true,
    focusManagement: true,
    highContrast: false,
    reducedMotion: false // Will be detected dynamically
  },

  /**
   * Currency and formatting
   */
  formatting: {
    currency: 'USD',
    locale: 'en-US',
    showCurrency: true,
    currencyFormat: 'symbol' // 'symbol' or 'code'
  },

  /**
   * Initialize configuration based on environment and user preferences
   */
  init() {
    // Set debug flags based on environment
    if (this.environment.isDevelopment) {
      this.debug.enabled = true;
      this.debug.cartEvents = true;
      this.debug.formValidation = true;
      this.debug.analytics = true;
      this.debug.performance = true;
    }

    // Detect user preferences
    this.accessibility.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.accessibility.highContrast = window.matchMedia('(prefers-contrast: high)').matches;

    // Adjust animations based on user preference
    if (this.accessibility.reducedMotion) {
      this.animations.duration = 0;
      this.animations.respectReducedMotion = true;
      this.cart.animationDuration = 0;
      this.modals.animationDuration = 0;
    }

    // Detect connection speed and adjust performance settings
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      this.performance.enableLazyLoading = true;
      this.performance.imageFadeIn = false;
      this.performance.preloadCriticalImages = false;
      this.animations.duration = Math.min(this.animations.duration, 150);
    }

    // Load user preferences from localStorage
    this.loadUserPreferences();

    // Log configuration in development
    if (this.debug.enabled) {
      console.log('Theme configuration initialized:', this);
    }

    return this;
  },

  /**
   * Load user preferences from localStorage
   */
  loadUserPreferences() {
    try {
      const userPrefs = localStorage.getItem('theme_preferences');
      if (userPrefs) {
        const prefs = JSON.parse(userPrefs);
        
        // Apply user preferences
        if (prefs.reducedMotion !== undefined) {
          this.accessibility.reducedMotion = prefs.reducedMotion;
          if (prefs.reducedMotion) {
            this.animations.duration = 0;
            this.cart.animationDuration = 0;
            this.modals.animationDuration = 0;
          }
        }

        if (prefs.notifications !== undefined) {
          Object.assign(this.notifications, prefs.notifications);
        }

        if (prefs.currency !== undefined) {
          this.formatting.currency = prefs.currency;
        }
      }
    } catch (error) {
      if (this.debug.enabled) {
        console.warn('Failed to load user preferences:', error);
      }
    }
  },

  /**
   * Save user preferences to localStorage
   */
  saveUserPreferences() {
    try {
      const prefs = {
        reducedMotion: this.accessibility.reducedMotion,
        notifications: {
          showSuccess: this.notifications.showSuccess,
          showError: this.notifications.showError,
          duration: this.notifications.duration
        },
        currency: this.formatting.currency
      };

      localStorage.setItem('theme_preferences', JSON.stringify(prefs));
      return true;
    } catch (error) {
      if (this.debug.enabled) {
        console.warn('Failed to save user preferences:', error);
      }
      return false;
    }
  },

  /**
   * Get a configuration value by path
   * @param {string} path - Dot notation path (e.g., 'cart.maxQuantity')
   * @param {any} defaultValue - Default value if path doesn't exist
   * @returns {any} Configuration value
   */
  get(path, defaultValue = null) {
    try {
      const keys = path.split('.');
      let value = this;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return defaultValue;
        }
      }
      
      return value;
    } catch (error) {
      if (this.debug.enabled) {
        console.warn(`Failed to get config value for path: ${path}`, error);
      }
      return defaultValue;
    }
  },

  /**
   * Set a configuration value by path
   * @param {string} path - Dot notation path (e.g., 'cart.maxQuantity')
   * @param {any} value - Value to set
   * @returns {boolean} True if successful
   */
  set(path, value) {
    try {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let target = this;
      
      for (const key of keys) {
        if (!(key in target) || typeof target[key] !== 'object') {
          target[key] = {};
        }
        target = target[key];
      }
      
      target[lastKey] = value;
      return true;
    } catch (error) {
      if (this.debug.enabled) {
        console.warn(`Failed to set config value for path: ${path}`, error);
      }
      return false;
    }
  },

  /**
   * Update multiple configuration values
   * @param {Object} updates - Object with configuration updates
   * @returns {boolean} True if successful
   */
  update(updates) {
    try {
      const updateRecursive = (target, source) => {
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            updateRecursive(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      };

      updateRecursive(this, updates);
      return true;
    } catch (error) {
      if (this.debug.enabled) {
        console.warn('Failed to update configuration:', error);
      }
      return false;
    }
  },

  /**
   * Reset configuration to defaults
   */
  reset() {
    // Store current debug state
    const currentDebug = this.debug.enabled;
    
    // Reset by reinitializing
    this.init();
    
    if (currentDebug && this.debug.enabled) {
      console.log('Configuration reset to defaults');
    }
  },

  /**
   * Validate configuration values
   * @returns {Array} Array of validation errors
   */
  validate() {
    const errors = [];

    // Validate cart configuration
    if (this.cart.maxQuantity < 1) {
      errors.push('cart.maxQuantity must be at least 1');
    }

    if (this.cart.maxItemQuantity < 1) {
      errors.push('cart.maxItemQuantity must be at least 1');
    }

    if (this.cart.dependencyTimeout < 1000) {
      errors.push('cart.dependencyTimeout should be at least 1000ms');
    }

    // Validate animation configuration
    if (this.animations.duration < 0) {
      errors.push('animations.duration cannot be negative');
    }

    if (this.animations.intersectionThreshold < 0 || this.animations.intersectionThreshold > 1) {
      errors.push('animations.intersectionThreshold must be between 0 and 1');
    }

    // Validate notification configuration
    if (this.notifications.duration < 0) {
      errors.push('notifications.duration cannot be negative');
    }

    if (this.notifications.maxVisible < 1) {
      errors.push('notifications.maxVisible must be at least 1');
    }

    // Validate API configuration
    if (this.api.timeout < 1000) {
      errors.push('api.timeout should be at least 1000ms');
    }

    if (this.api.retryAttempts < 0) {
      errors.push('api.retryAttempts cannot be negative');
    }

    return errors;
  }
};

// Auto-initialize configuration when script loads
Config.init();

// Listen for user preference changes
if (window.matchMedia) {
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    Config.accessibility.reducedMotion = e.matches;
    if (e.matches) {
      Config.animations.duration = 0;
      Config.cart.animationDuration = 0;
      Config.modals.animationDuration = 0;
    }
    Config.saveUserPreferences();
  });

  window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
    Config.accessibility.highContrast = e.matches;
    Config.saveUserPreferences();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
}