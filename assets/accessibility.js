/**
 * Accessibility Enhancement Module
 * WCAG 2.1 Level AA Compliance
 * 
 * Focuses on essential accessibility features:
 * - Focus management and keyboard navigation
 * - Screen reader announcements
 * - Reduced motion support
 * - Focus-visible behavior
 */

class AccessibilityManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupLiveRegion();
    this.setupKeyboardNavigation();
    this.setupFocusVisible();
    
    if (Config?.debug?.enabled) {
      console.log('Accessibility Manager initialized (WCAG 2.1 AA)');
    }
  }

  /**
   * Create live region for screen reader announcements
   */
  setupLiveRegion() {
    // Polite announcements
    this.liveRegionPolite = document.createElement('div');
    this.liveRegionPolite.setAttribute('aria-live', 'polite');
    this.liveRegionPolite.setAttribute('aria-atomic', 'true');
    this.liveRegionPolite.className = 'sr-only';
    this.liveRegionPolite.id = 'live-region-polite';
    document.body.appendChild(this.liveRegionPolite);

    // Assertive announcements
    this.liveRegionAssertive = document.createElement('div');
    this.liveRegionAssertive.setAttribute('aria-live', 'assertive');
    this.liveRegionAssertive.setAttribute('aria-atomic', 'true');
    this.liveRegionAssertive.className = 'sr-only';
    this.liveRegionAssertive.id = 'live-region-assertive';
    document.body.appendChild(this.liveRegionAssertive);
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    const region = priority === 'assertive' ? this.liveRegionAssertive : this.liveRegionPolite;
    
    // Clear and set message
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // Clear after announcement
    setTimeout(() => {
      region.textContent = '';
    }, 3000);
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Handle escape key for modals and flyouts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });
  }

  /**
   * Handle escape key presses
   */
  handleEscape() {
    // Close modals
    const openModal = document.querySelector('.modal.is-open');
    if (openModal && window.Modal) {
      window.Modal.close();
      return;
    }

    // Close mobile menu
    const mobileMenu = document.querySelector('.mobile-menu[aria-hidden="false"]');
    if (mobileMenu && window.MobileMenu) {
      window.MobileMenu.close();
      return;
    }

    // Close cart flyout
    const cartFlyout = document.querySelector('.cart-flyout[aria-hidden="false"]');
    if (cartFlyout && window.cartManager) {
      window.cartManager.closeCart();
    }
  }

  /**
   * Setup focus-visible behavior
   */
  setupFocusVisible() {
    let usingKeyboard = false;

    // Track keyboard usage
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow')) {
        usingKeyboard = true;
        document.body.classList.add('keyboard-user');
      }
    });

    // Track mouse/touch usage
    document.addEventListener('mousedown', () => {
      usingKeyboard = false;
      document.body.classList.remove('keyboard-user');
    });

    document.addEventListener('touchstart', () => {
      usingKeyboard = false;
      document.body.classList.remove('keyboard-user');
    });

    // Handle focus events
    document.addEventListener('focus', (e) => {
      if (usingKeyboard) {
        e.target.classList.add('focus-visible');
      }
    }, true);

    // Handle blur events
    document.addEventListener('blur', (e) => {
      e.target.classList.remove('focus-visible');
    }, true);
  }
}

// Initialize accessibility manager
let accessibilityManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    accessibilityManager = new AccessibilityManager();
    window.AccessibilityManager = accessibilityManager;
  });
} else {
  accessibilityManager = new AccessibilityManager();
  window.AccessibilityManager = accessibilityManager;
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}