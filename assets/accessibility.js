/**
 * Accessibility Enhancement Module
 * Provides WCAG 2.0 AA compliance features
 */

class AccessibilityManager {
  constructor() {
    this.announcements = [];
    this.focusStack = [];
    this.init();
  }

  init() {
    this.createLiveRegion();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupReducedMotion();
    this.setupHighContrast();
    this.initializeARIA();
    
    if (Config?.debug?.enabled) {
      console.log('Accessibility Manager initialized');
    }
  }

  /**
   * Create live region for screen reader announcements
   */
  createLiveRegion() {
    // Polite announcements
    this.liveRegionPolite = document.createElement('div');
    this.liveRegionPolite.setAttribute('aria-live', 'polite');
    this.liveRegionPolite.setAttribute('aria-atomic', 'true');
    this.liveRegionPolite.className = 'live-region';
    this.liveRegionPolite.id = 'live-region-polite';
    document.body.appendChild(this.liveRegionPolite);

    // Assertive announcements
    this.liveRegionAssertive = document.createElement('div');
    this.liveRegionAssertive.setAttribute('aria-live', 'assertive');
    this.liveRegionAssertive.setAttribute('aria-atomic', 'true');
    this.liveRegionAssertive.className = 'live-region';
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
    
    // Clear and then set message to ensure it's announced
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // Track announcements
    this.announcements.push({
      message,
      priority,
      timestamp: Date.now()
    });

    // Keep only last 10 announcements
    if (this.announcements.length > 10) {
      this.announcements.shift();
    }
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscape();
      }
    });

    // Tab trap for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabTrap(e);
      }
    });

    // Arrow key navigation for product options
    document.addEventListener('keydown', (e) => {
      if (e.target.classList.contains('product-page__option-pill')) {
        this.handleArrowNavigation(e);
      }
    });
  }

  /**
   * Handle escape key press
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
    if (cartFlyout && window.Cart) {
      window.Cart.closeFlyout();
    }
  }

  /**
   * Handle tab trapping in modals
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleTabTrap(e) {
    const activeModal = document.querySelector('.modal.is-open, .mobile-menu[aria-hidden="false"], .cart-flyout[aria-hidden="false"]');
    if (!activeModal) return;

    const focusableElements = activeModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Handle arrow key navigation for grouped controls
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleArrowNavigation(e) {
    const currentPill = e.target;
    const pillContainer = currentPill.closest('.product-page__option-pills');
    const pills = pillContainer.querySelectorAll('.product-page__option-pill:not([disabled])');
    const pillsArray = Array.from(pills);
    const currentIndex = pillsArray.indexOf(currentPill);

    let nextIndex;
    
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % pillsArray.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + pillsArray.length) % pillsArray.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = pillsArray.length - 1;
        break;
      default:
        return;
    }

    pillsArray[nextIndex].focus();
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Store focus before opening modals
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-modal-open], .nav__cart, .nav__hamburger')) {
        this.storeFocus(document.activeElement);
      }
    });

    // Restore focus when modals close
    document.addEventListener('modal:closed', () => {
      this.restoreFocus();
    });

    // Enhanced focus indicators
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('button, a, input, select, textarea')) {
        e.target.classList.add('focus-visible');
      }
    });

    document.addEventListener('focusout', (e) => {
      e.target.classList.remove('focus-visible');
    });
  }

  /**
   * Store current focus element
   * @param {Element} element - Element to store
   */
  storeFocus(element) {
    this.focusStack.push(element);
  }

  /**
   * Restore focus to last stored element
   */
  restoreFocus() {
    const element = this.focusStack.pop();
    if (element && typeof element.focus === 'function') {
      setTimeout(() => {
        element.focus();
      }, 100);
    }
  }

  /**
   * Setup reduced motion preferences
   */
  setupReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleReducedMotion = (mq) => {
      if (mq.matches) {
        document.body.classList.add('reduce-motion');
        this.announce('Animations have been reduced for better accessibility', 'polite');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    };

    handleReducedMotion(mediaQuery);
    mediaQuery.addListener(handleReducedMotion);
  }

  /**
   * Setup high contrast mode support
   */
  setupHighContrast() {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleHighContrast = (mq) => {
      if (mq.matches) {
        document.body.classList.add('high-contrast');
        this.announce('High contrast mode detected', 'polite');
      } else {
        document.body.classList.remove('high-contrast');
      }
    };

    handleHighContrast(mediaQuery);
    mediaQuery.addListener(handleHighContrast);
  }

  /**
   * Initialize ARIA attributes
   */
  initializeARIA() {
    // Add missing ARIA labels
    this.addMissingAriaLabels();
    
    // Setup live regions for dynamic content
    this.setupDynamicARIA();
    
    // Add landmark roles
    this.addLandmarkRoles();
  }

  /**
   * Add missing ARIA labels
   */
  addMissingAriaLabels() {
    // Quantity inputs
    const quantityInputs = document.querySelectorAll('.quantity-input');
    quantityInputs.forEach((input, index) => {
      if (!input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', 'Product quantity');
        input.setAttribute('aria-describedby', `quantity-help-${index}`);
        
        // Add help text
        const helpText = document.createElement('div');
        helpText.id = `quantity-help-${index}`;
        helpText.className = 'sr-only';
        helpText.textContent = 'Use plus and minus buttons or type a number';
        input.parentNode.appendChild(helpText);
      }
    });

    // Product images without alt text
    const productImages = document.querySelectorAll('.product-gallery__main img, .product-card__image img');
    productImages.forEach(img => {
      if (!img.getAttribute('alt')) {
        const productTitle = img.closest('[data-product-id]')?.querySelector('h1, h2, h3, .product-card__title')?.textContent?.trim();
        if (productTitle) {
          img.setAttribute('alt', `${productTitle} product image`);
        }
      }
    });
  }

  /**
   * Setup dynamic ARIA updates
   */
  setupDynamicARIA() {
    // Cart count updates
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const count = cartCount.textContent.trim();
            if (count && count !== '0') {
              this.announce(`Cart updated. ${count} item${count !== '1' ? 's' : ''} in cart`, 'polite');
            }
          }
        });
      });
      
      observer.observe(cartCount, { childList: true, characterData: true, subtree: true });
    }

    // Product option changes
    document.addEventListener('change', (e) => {
      if (e.target.matches('.product-page__variant-select')) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        this.announce(`Selected ${selectedOption.textContent}`, 'polite');
      }
    });
  }

  /**
   * Add landmark roles
   */
  addLandmarkRoles() {
    // Main content area
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }

    // Search functionality
    const searchForm = document.querySelector('form[action*="search"]');
    if (searchForm && !searchForm.getAttribute('role')) {
      searchForm.setAttribute('role', 'search');
    }

    // Product listings
    const productGrids = document.querySelectorAll('.products-grid, .homepage-products-compact');
    productGrids.forEach(grid => {
      if (!grid.getAttribute('role')) {
        grid.setAttribute('role', 'region');
        grid.setAttribute('aria-label', 'Product listing');
      }
    });
  }

  /**
   * Validate color contrast (development helper)
   */
  validateContrast() {
    if (!Config?.debug?.enabled) return;

    const contrastRatios = [
      { bg: '#f4f4c9', fg: '#265428', element: 'body background' },
      { bg: '#a8c97b', fg: '#265428', element: 'buttons' },
      { bg: '#ffffff', fg: '#265428', element: 'cards' }
    ];

    contrastRatios.forEach(({ bg, fg, element }) => {
      const ratio = this.calculateContrast(bg, fg);
      const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL';
      console.log(`${element}: ${ratio.toFixed(2)}:1 (${level})`);
    });
  }

  /**
   * Calculate color contrast ratio
   * @param {string} bg - Background color
   * @param {string} fg - Foreground color
   * @returns {number} Contrast ratio
   */
  calculateContrast(bg, fg) {
    const getLuminance = (color) => {
      const rgb = color.match(/\w\w/g).map(x => parseInt(x, 16) / 255);
      const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(bg) + 0.05;
    const l2 = getLuminance(fg) + 0.05;
    return Math.max(l1, l2) / Math.min(l1, l2);
  }

  /**
   * Get accessibility status report
   * @returns {Object} Accessibility status
   */
  getStatus() {
    return {
      liveRegionActive: !!this.liveRegionPolite,
      announcementCount: this.announcements.length,
      focusStackSize: this.focusStack.length,
      reducedMotion: document.body.classList.contains('reduce-motion'),
      highContrast: document.body.classList.contains('high-contrast'),
      recentAnnouncements: this.announcements.slice(-5)
    };
  }
}

// Initialize accessibility manager
window.AccessibilityManager = new AccessibilityManager();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}