/**
 * Utility functions for the Pesto Shopify theme
 * Provides common functionality used across multiple modules
 */

/**
 * @namespace Utils
 * @description Collection of utility functions for common operations
 */
window.Utils = {
  /**
   * @namespace Utils.DOM
   * @description DOM manipulation utilities
   */
  DOM: {
    /**
     * Safely query selector with error handling
     * @param {string} selector - CSS selector string
     * @param {Element|Document} parent - Parent element to search within
     * @returns {Element|null} Found element or null
     */
    safeQuerySelector(selector, parent = document) {
      try {
        return parent.querySelector(selector);
      } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
        return null;
      }
    },

    /**
     * Safely query all selectors with error handling
     * @param {string} selector - CSS selector string
     * @param {Element|Document} parent - Parent element to search within
     * @returns {NodeList} NodeList of found elements (empty if error)
     */
    safeQuerySelectorAll(selector, parent = document) {
      try {
        return parent.querySelectorAll(selector);
      } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
        return parent.querySelectorAll('no-element-match');
      }
    },

    /**
     * Add event listener with automatic cleanup
     * @param {Element} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     * @returns {Function} Cleanup function
     */
    addEventListenerWithCleanup(element, event, handler, options = {}) {
      if (!element || typeof handler !== 'function') {
        console.warn('Invalid parameters for event listener');
        return () => {};
      }

      element.addEventListener(event, handler, options);
      
      return () => {
        element.removeEventListener(event, handler, options);
      };
    },

    /**
     * Check if element exists and is visible
     * @param {Element} element - Element to check
     * @returns {boolean} True if element exists and is visible
     */
    isElementVisible(element) {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0';
    },

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Animate element with CSS classes
     * @param {Element} element - Element to animate
     * @param {string} animationClass - CSS class for animation
     * @param {number} duration - Animation duration in milliseconds
     * @returns {Promise} Promise that resolves when animation completes
     */
    animateElement(element, animationClass, duration = 300) {
      return new Promise((resolve) => {
        if (!element) {
          resolve();
          return;
        }

        element.classList.add(animationClass);
        
        const cleanup = () => {
          element.classList.remove(animationClass);
          resolve();
        };

        setTimeout(cleanup, duration);
      });
    }
  },

  /**
   * @namespace Utils.Format
   * @description Formatting utilities
   */
  Format: {
    /**
     * Format price as currency
     * @param {number} cents - Price in cents
     * @param {string} currency - Currency code (default: USD)
     * @param {string} locale - Locale for formatting (default: en-US)
     * @returns {string} Formatted price string
     */
    money(cents, currency = 'USD', locale = 'en-US') {
      if (typeof cents !== 'number') {
        console.warn('Invalid price value:', cents);
        return '$0.00';
      }

      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency
        }).format(cents / 100);
      } catch (error) {
        console.warn('Error formatting money:', error);
        return `$${(cents / 100).toFixed(2)}`;
      }
    },

    /**
     * Format number with thousand separators
     * @param {number} num - Number to format
     * @param {string} locale - Locale for formatting (default: en-US)
     * @returns {string} Formatted number string
     */
    number(num, locale = 'en-US') {
      if (typeof num !== 'number') {
        console.warn('Invalid number value:', num);
        return '0';
      }

      try {
        return new Intl.NumberFormat(locale).format(num);
      } catch (error) {
        console.warn('Error formatting number:', error);
        return num.toString();
      }
    },

    /**
     * Pluralize text based on count
     * @param {number} count - Count value
     * @param {string} singular - Singular form
     * @param {string} plural - Plural form (optional, adds 's' to singular if not provided)
     * @returns {string} Pluralized text
     */
    pluralize(count, singular, plural = null) {
      if (typeof count !== 'number') {
        console.warn('Invalid count for pluralization:', count);
        return singular;
      }

      return count === 1 ? singular : (plural || `${singular}s`);
    }
  },

  /**
   * @namespace Utils.Validate
   * @description Input validation utilities
   */
  Validate: {
    /**
     * Validate email address format
     * @param {string} email - Email address to validate
     * @returns {boolean} True if valid email format
     */
    email(email) {
      if (typeof email !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email.trim());
    },

    /**
     * Validate phone number format
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if valid phone format
     */
    phone(phone) {
      if (typeof phone !== 'string') return false;
      const phoneRegex = /^[+]?[1-9]\d{0,15}$/;
      return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
    },

    /**
     * Validate that value is within range
     * @param {number} value - Value to check
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @returns {boolean} True if value is within range
     */
    range(value, min, max) {
      const num = parseFloat(value);
      if (isNaN(num)) return false;
      return num >= min && num <= max;
    },

    /**
     * Sanitize HTML string to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeHtml(str) {
      if (typeof str !== 'string') return '';
      const temp = document.createElement('div');
      temp.textContent = str;
      return temp.innerHTML;
    },

    /**
     * Validate quantity input
     * @param {any} quantity - Quantity value to validate
     * @param {number} min - Minimum allowed quantity (default: 1)
     * @param {number} max - Maximum allowed quantity (default: 100)
     * @returns {number} Valid quantity number
     */
    quantity(quantity, min = 1, max = 100) {
      const num = parseInt(quantity);
      if (isNaN(num) || num < min) return min;
      if (num > max) return max;
      return num;
    }
  },

  /**
   * @namespace Utils.Storage
   * @description Local storage utilities with error handling
   */
  Storage: {
    /**
     * Set item in localStorage with error handling
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {boolean} True if successful
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
        return false;
      }
    },

    /**
     * Get item from localStorage with error handling
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Stored value or default value
     */
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item !== null ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return defaultValue;
      }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if successful
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
        return false;
      }
    },

    /**
     * Clear all localStorage items
     * @returns {boolean} True if successful
     */
    clear() {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
        return false;
      }
    }
  },

  /**
   * @namespace Utils.Performance
   * @description Performance monitoring utilities
   */
  Performance: {
    /**
     * Measure execution time of a function
     * @param {Function} fn - Function to measure
     * @param {string} label - Label for the measurement
     * @returns {any} Function result
     */
    measure(fn, label = 'Function') {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      console.log(`${label} took ${(end - start).toFixed(2)}ms`);
      return result;
    },

    /**
     * Check if user prefers reduced motion
     * @returns {boolean} True if user prefers reduced motion
     */
    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Get connection information
     * @returns {Object} Connection info object
     */
    getConnectionInfo() {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!connection) {
        return { type: 'unknown', downlink: null, effectiveType: 'unknown' };
      }

      return {
        type: connection.type || 'unknown',
        downlink: connection.downlink || null,
        effectiveType: connection.effectiveType || 'unknown'
      };
    }
  },

  /**
   * @namespace Utils.Notifications
   * @description Notification system utilities
   */
  Notifications: {
    /**
     * Show notification with consistent styling
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info, warning)
     * @param {number} duration - Duration in milliseconds (default: 3000)
     * @returns {Element} Notification element
     */
    show(message, type = 'info', duration = 3000) {
      // Remove existing notifications of same type
      const existingNotifications = document.querySelectorAll(`.notification--${type}`);
      existingNotifications.forEach(notification => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      });

      const notification = document.createElement('div');
      notification.className = `notification notification--${type}`;
      notification.textContent = Utils.Validate.sanitizeHtml(message);
      
      // Get theme colors
      const colors = {
        success: '#4caf50',
        error: '#f44336',
        info: '#2196f3',
        warning: '#ff9800'
      };

      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        color: 'white',
        fontWeight: '600',
        fontSize: '0.875rem',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        backgroundColor: colors[type] || colors.info,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '300px',
        wordWrap: 'break-word'
      });

      document.body.appendChild(notification);

      // Animate in
      requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
      });

      // Auto remove
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, duration);

      return notification;
    }
  },

  /**
   * @namespace Utils.Analytics
   * @description Analytics and tracking utilities
   */
  Analytics: {
    /**
     * Track custom event
     * @param {string} action - Event action
     * @param {string} category - Event category
     * @param {string} label - Event label (optional)
     * @param {number} value - Event value (optional)
     */
    trackEvent(action, category, label = null, value = null) {
      // Google Analytics 4
      if (typeof gtag !== 'undefined' && gtag) {
        gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value
        });
      }

      // Console log for development
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('ngrok')) {
        console.log('Analytics Event:', { action, category, label, value });
      }
    },

    /**
     * Track cart events
     * @param {string} action - Cart action (add, remove, view, etc.)
     * @param {Object} item - Item data
     */
    trackCart(action, item = {}) {
      this.trackEvent(action, 'cart', item.title || item.name, item.price);
      
      // Enhanced ecommerce tracking
      if (typeof gtag !== 'undefined' && gtag && action === 'add_to_cart') {
        gtag('event', 'add_to_cart', {
          currency: 'USD',
          value: (item.price || 0) / 100,
          items: [{
            item_id: item.id || item.variant_id,
            item_name: item.title || item.name,
            category: item.product_type,
            quantity: item.quantity || 1,
            price: (item.price || 0) / 100
          }]
        });
      }
    }
  }
};

// Initialize utilities
document.addEventListener('DOMContentLoaded', () => {
  if (Config?.debug?.enabled) {
    console.log('Utils library loaded');
  }
  
  // Track page view
  Utils.Analytics.trackEvent('page_view', 'navigation', window.location.pathname);
});