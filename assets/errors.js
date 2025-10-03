/**
 * Custom error classes for the Pesto Shopify theme
 * Provides structured error handling with context and recovery strategies
 */

/**
 * Base theme error class
 * @class ThemeError
 * @extends Error
 */
class ThemeError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} code - Error code for categorization
   * @param {Object} context - Additional context information
   * @param {Error} originalError - Original error that caused this error
   */
  constructor(message, code = 'THEME_ERROR', context = {}, originalError = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.userAgent = navigator.userAgent;
    this.url = window.location.href;
    
    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging
   * @returns {Object} JSON representation of error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      userAgent: this.userAgent,
      url: this.url,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }

  /**
   * Get user-friendly error message
   * @returns {string} User-friendly message
   */
  getUserMessage() {
    return this.message;
  }

  /**
   * Check if error is recoverable
   * @returns {boolean} True if error can be recovered from
   */
  isRecoverable() {
    return true;
  }

  /**
   * Get suggested recovery actions
   * @returns {Array<string>} Array of recovery suggestions
   */
  getRecoveryActions() {
    return ['Please try again later', 'Refresh the page', 'Contact support if the problem persists'];
  }
}

/**
 * Cart-specific error class
 * @class CartError
 * @extends ThemeError
 */
class CartError extends ThemeError {
  constructor(message, code = 'CART_ERROR', context = {}, originalError = null) {
    super(message, code, context, originalError);
  }

  getUserMessage() {
    const messages = {
      'CART_QUANTITY_LIMIT': `Cannot add more items. Cart limit is ${Config?.get('cart.maxQuantity', 50)} items.`,
      'CART_ITEM_UNAVAILABLE': 'This item is no longer available.',
      'CART_VARIANT_NOT_FOUND': 'Product variant not found. Please select a different option.',
      'CART_DEPENDENCY_TIMEOUT': 'Cart system is loading. Please wait a moment and try again.',
      'CART_NETWORK_ERROR': 'Unable to update cart. Please check your connection and try again.',
      'CART_INVALID_QUANTITY': 'Please enter a valid quantity.',
      'CART_ITEM_LIMIT_EXCEEDED': `Cannot add more than ${Config?.get('cart.maxItemQuantity', 10)} of this item.`
    };

    return messages[this.code] || this.message || 'There was a problem with your cart.';
  }

  isRecoverable() {
    const nonRecoverableCodes = ['CART_ITEM_UNAVAILABLE', 'CART_VARIANT_NOT_FOUND'];
    return !nonRecoverableCodes.includes(this.code);
  }

  getRecoveryActions() {
    const actions = {
      'CART_QUANTITY_LIMIT': ['Remove some items from your cart', 'Try adding fewer items'],
      'CART_ITEM_UNAVAILABLE': ['Select a different product', 'Check back later for availability'],
      'CART_VARIANT_NOT_FOUND': ['Select different product options', 'Choose another variant'],
      'CART_DEPENDENCY_TIMEOUT': ['Wait a moment and try again', 'Refresh the page'],
      'CART_NETWORK_ERROR': ['Check your internet connection', 'Try again in a moment'],
      'CART_INVALID_QUANTITY': ['Enter a number between 1 and ' + (Config?.get('cart.maxItemQuantity', 10))],
      'CART_ITEM_LIMIT_EXCEEDED': ['Reduce the quantity', 'Maximum ' + (Config?.get('cart.maxItemQuantity', 10)) + ' per item']
    };

    return actions[this.code] || super.getRecoveryActions();
  }
}

/**
 * Form-specific error class
 * @class FormError
 * @extends ThemeError
 */
class FormError extends ThemeError {
  constructor(message, code = 'FORM_ERROR', context = {}, originalError = null) {
    super(message, code, context, originalError);
  }

  getUserMessage() {
    const messages = {
      'FORM_VALIDATION_ERROR': 'Please check the form for errors.',
      'FORM_SUBMISSION_TIMEOUT': 'Form submission timed out. Please try again.',
      'FORM_NETWORK_ERROR': 'Unable to submit form. Please check your connection.',
      'FORM_INVALID_EMAIL': 'Please enter a valid email address.',
      'FORM_REQUIRED_FIELD': 'This field is required.',
      'FORM_SERVER_ERROR': 'Server error occurred. Please try again later.',
      'FORM_RATE_LIMITED': 'Too many attempts. Please wait before trying again.'
    };

    return messages[this.code] || this.message || 'There was a problem with the form.';
  }

  isRecoverable() {
    const nonRecoverableCodes = ['FORM_RATE_LIMITED'];
    return !nonRecoverableCodes.includes(this.code);
  }

  getRecoveryActions() {
    const actions = {
      'FORM_VALIDATION_ERROR': ['Check all required fields', 'Ensure email addresses are valid'],
      'FORM_SUBMISSION_TIMEOUT': ['Check your internet connection', 'Try submitting again'],
      'FORM_NETWORK_ERROR': ['Check your internet connection', 'Try again in a moment'],
      'FORM_INVALID_EMAIL': ['Enter a valid email format (example@domain.com)'],
      'FORM_REQUIRED_FIELD': ['Fill in all required fields marked with *'],
      'FORM_SERVER_ERROR': ['Try again in a few minutes', 'Contact support if problem persists'],
      'FORM_RATE_LIMITED': ['Wait a few minutes before trying again']
    };

    return actions[this.code] || super.getRecoveryActions();
  }
}

/**
 * Modal-specific error class
 * @class ModalError
 * @extends ThemeError
 */
class ModalError extends ThemeError {
  constructor(message, code = 'MODAL_ERROR', context = {}, originalError = null) {
    super(message, code, context, originalError);
  }

  getUserMessage() {
    const messages = {
      'MODAL_NOT_FOUND': 'Modal window not found.',
      'MODAL_INITIALIZATION_ERROR': 'Failed to initialize modal.',
      'MODAL_FOCUS_ERROR': 'Unable to focus modal element.'
    };

    return messages[this.code] || this.message || 'There was a problem with the modal.';
  }

  getRecoveryActions() {
    return ['Refresh the page', 'Try the action again'];
  }
}

/**
 * API-specific error class
 * @class APIError
 * @extends ThemeError
 */
class APIError extends ThemeError {
  constructor(message, code = 'API_ERROR', context = {}, originalError = null) {
    super(message, code, context, originalError);
    this.statusCode = context.statusCode || null;
    this.endpoint = context.endpoint || null;
  }

  getUserMessage() {
    const messages = {
      'API_TIMEOUT': 'Request timed out. Please try again.',
      'API_NETWORK_ERROR': 'Network error. Please check your connection.',
      'API_SERVER_ERROR': 'Server error. Please try again later.',
      'API_RATE_LIMITED': 'Too many requests. Please wait before trying again.',
      'API_UNAUTHORIZED': 'Authentication required.',
      'API_FORBIDDEN': 'Access denied.',
      'API_NOT_FOUND': 'Resource not found.',
      'API_VALIDATION_ERROR': 'Invalid request data.'
    };

    return messages[this.code] || this.message || 'There was a problem connecting to the server.';
  }

  isRecoverable() {
    const nonRecoverableCodes = ['API_UNAUTHORIZED', 'API_FORBIDDEN', 'API_NOT_FOUND'];
    return !nonRecoverableCodes.includes(this.code);
  }

  getRecoveryActions() {
    const actions = {
      'API_TIMEOUT': ['Check your internet connection', 'Try again'],
      'API_NETWORK_ERROR': ['Check your internet connection', 'Try again in a moment'],
      'API_SERVER_ERROR': ['Try again later', 'Contact support if problem persists'],
      'API_RATE_LIMITED': ['Wait a moment before trying again'],
      'API_UNAUTHORIZED': ['Please log in', 'Check your credentials'],
      'API_FORBIDDEN': ['You do not have permission for this action'],
      'API_NOT_FOUND': ['The requested item was not found'],
      'API_VALIDATION_ERROR': ['Check your input data', 'Ensure all required fields are filled']
    };

    return actions[this.code] || super.getRecoveryActions();
  }
}

/**
 * Error handler class for centralized error management
 * @class ErrorHandler
 */
class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 50;
    this.isInitialized = false;
  }

  /**
   * Initialize error handler
   */
  init() {
    if (this.isInitialized) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError(event.reason, {
        type: 'unhandled_promise_rejection'
      });
    });

    this.isInitialized = true;

    if (Config?.debug?.enabled) {
      console.log('Error handler initialized');
    }
  }

  /**
   * Handle a theme error
   * @param {ThemeError|Error} error - Error to handle
   * @param {Object} options - Handling options
   */
  handle(error, options = {}) {
    // Ensure error is a ThemeError instance
    if (!(error instanceof ThemeError)) {
      error = new ThemeError(error.message, 'UNKNOWN_ERROR', {}, error);
    }

    // Add to error queue
    this.addToQueue(error);

    // Log error
    this.logError(error, options);

    // Show user notification if requested
    if (options.showNotification !== false && error.isRecoverable()) {
      this.showErrorNotification(error, options);
    }

    // Track error in analytics
    if (Config?.analytics?.trackErrors) {
      this.trackError(error);
    }

    // Report to external service in production
    if (Config?.environment?.isProduction && options.report !== false) {
      this.reportError(error);
    }
  }

  /**
   * Handle global JavaScript errors
   * @param {Error} error - The error
   * @param {Object} context - Error context
   */
  handleGlobalError(error, context = {}) {
    const themeError = new ThemeError(
      error.message || 'Uncaught error',
      'GLOBAL_ERROR',
      context,
      error
    );

    this.handle(themeError, { report: true });
  }

  /**
   * Add error to queue
   * @param {ThemeError} error - Error to add
   */
  addToQueue(error) {
    this.errorQueue.push(error);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Log error to console
   * @param {ThemeError} error - Error to log
   * @param {Object} options - Logging options
   */
  logError(error, options = {}) {
    if (!Config?.debug?.enabled && !options.forceLog) return;

    const logData = {
      ...error.toJSON(),
      recoverable: error.isRecoverable(),
      recoveryActions: error.getRecoveryActions()
    };

    if (error instanceof CartError) {
      console.error('[CART ERROR]', logData);
    } else if (error instanceof FormError) {
      console.error('[FORM ERROR]', logData);
    } else if (error instanceof ModalError) {
      console.error('[MODAL ERROR]', logData);
    } else if (error instanceof APIError) {
      console.error('[API ERROR]', logData);
    } else {
      console.error('[THEME ERROR]', logData);
    }
  }

  /**
   * Show error notification to user
   * @param {ThemeError} error - Error to show
   * @param {Object} options - Notification options
   */
  showErrorNotification(error, options = {}) {
    if (!Config?.notifications?.showError) return;

    const message = options.customMessage || error.getUserMessage();
    const duration = options.duration || Config?.notifications?.duration || 5000;

    if (typeof Utils !== 'undefined' && Utils.Notifications) {
      Utils.Notifications.show(message, 'error', duration);
    }
  }

  /**
   * Track error in analytics
   * @param {ThemeError} error - Error to track
   */
  trackError(error) {
    if (typeof Utils !== 'undefined' && Utils.Analytics) {
      Utils.Analytics.trackEvent('error', error.name, error.code, null);
    }
  }

  /**
   * Report error to external service
   * @param {ThemeError} error - Error to report
   */
  reportError(error) {
    // In a real implementation, this would send to an error tracking service
    // like Sentry, Bugsnag, or a custom endpoint
    if (Config?.debug?.enabled) {
      console.log('Error would be reported to external service:', error.toJSON());
    }
  }

  /**
   * Get recent errors
   * @param {number} limit - Maximum number of errors to return
   * @returns {Array<ThemeError>} Recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errorQueue.slice(-limit);
  }

  /**
   * Clear error queue
   */
  clearErrors() {
    this.errorQueue = [];
  }

  /**
   * Create error of specific type
   * @param {string} type - Error type (cart, form, modal, api)
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} context - Error context
   * @param {Error} originalError - Original error
   * @returns {ThemeError} Created error instance
   */
  createError(type, message, code, context = {}, originalError = null) {
    switch (type.toLowerCase()) {
      case 'cart':
        return new CartError(message, code, context, originalError);
      case 'form':
        return new FormError(message, code, context, originalError);
      case 'modal':
        return new ModalError(message, code, context, originalError);
      case 'api':
        return new APIError(message, code, context, originalError);
      default:
        return new ThemeError(message, code, context, originalError);
    }
  }
}

// Create global error handler instance
window.ErrorHandler = new ErrorHandler();

// Auto-initialize error handler
document.addEventListener('DOMContentLoaded', () => {
  window.ErrorHandler.init();
});

// Export classes for use in other modules
window.ThemeError = ThemeError;
window.CartError = CartError;
window.FormError = FormError;
window.ModalError = ModalError;
window.APIError = APIError;