class Modal {
  constructor(modalId) {
    try {
      this.modal = document.getElementById(modalId);
      if (!this.modal) {
        throw new Error(`Modal with ID "${modalId}" not found`);
      }
      
      this.overlay = this.modal.querySelector('.modal__overlay');
      this.container = this.modal.querySelector('.modal__container');
      this.closeButtons = this.modal.querySelectorAll('[data-modal-close]');
      this.openButtons = document.querySelectorAll(`[data-modal-open="${modalId}"]`);
      this.form = this.modal.querySelector('form');
      this.formContent = this.modal.querySelector('.modal__form-content');
      this.successContent = this.modal.querySelector('.modal__success-content');
      
      this.init();
    } catch (error) {
      console.error('Error initializing modal:', error);
    }
  }

  init() {
    if (!this.modal) return;
    
    try {
      // Add event listeners
      this.closeButtons.forEach(button => {
        button.addEventListener('click', () => this.close());
      });

      this.openButtons.forEach(button => {
        button.addEventListener('click', () => this.open());
      });

      // Store bound functions for cleanup
      this.boundEscapeHandler = (e) => {
        if (e.key === 'Escape' && this.modal.classList.contains('is-open')) {
          this.close();
        }
      };

      this.boundOverlayHandler = (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      };

      this.boundContainerHandler = (e) => {
        e.stopPropagation();
      };

      // Close on escape key
      document.addEventListener('keydown', this.boundEscapeHandler);

      // Close on overlay click, but not on container click
      if (this.overlay) {
        this.overlay.addEventListener('click', this.boundOverlayHandler);
      }

      // Prevent click propagation on container
      if (this.container) {
        this.container.addEventListener('click', this.boundContainerHandler);
      }

      // Handle form submission
      if (this.form) {
        this.form.addEventListener('submit', (e) => {
          // Let the form submit normally
          // The success state will be handled by the page reload
          if (this.form.checkValidity()) {
            this.showSuccess();
          }
        });
      }
    } catch (error) {
      console.error('Error setting up modal event listeners:', error);
    }
  }

  cleanup() {
    // Clean up event listeners to prevent memory leaks
    if (this.boundEscapeHandler) {
      document.removeEventListener('keydown', this.boundEscapeHandler);
    }
    if (this.overlay && this.boundOverlayHandler) {
      this.overlay.removeEventListener('click', this.boundOverlayHandler);
    }
    if (this.container && this.boundContainerHandler) {
      this.container.removeEventListener('click', this.boundContainerHandler);
    }
  }

  open() {
    this.modal.classList.add('is-open');
    // Reset form state
    this.resetState();
    // Focus on the first focusable element
    const focusableElements = this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  close() {
    this.modal.classList.remove('is-open');
    // Reset form state when closing
    this.resetState();
  }

  showSuccess() {
    try {
      if (this.formContent && this.successContent) {
        this.formContent.style.display = 'none';
        this.successContent.style.display = 'block';
      }
    } catch (error) {
      console.error('Error showing success state:', error);
    }
  }

  resetState() {
    if (this.formContent && this.successContent) {
      this.formContent.style.display = 'block';
      this.successContent.style.display = 'none';
      if (this.form) {
        this.form.reset();
      }
    }
  }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const waitlistModal = new Modal('waitlist-modal');
});

// Mobile Menu Manager
class MobileMenu {
  constructor() {
    try {
      this.hamburger = document.querySelector('.nav__hamburger');
      this.mobileMenu = document.getElementById('mobile-menu');
      this.closeBtn = document.querySelector('.mobile-menu__close');
      this.headerWrapper = document.querySelector('.header-wrapper');
      
      if (this.hamburger && this.mobileMenu && this.closeBtn) {
        this.init();
      }
    } catch (error) {
      console.error('Error initializing mobile menu:', error);
    }
  }

  init() {
    try {
      // Bind methods to preserve 'this' context
      this.boundEscapeHandler = (e) => {
        if (this.mobileMenu.getAttribute('aria-hidden') === 'false' && e.key === 'Escape') {
          this.close();
        }
      };

      this.boundOverlayHandler = (e) => {
        if (e.target === this.mobileMenu) this.close();
      };

      this.boundResizeHandler = () => {
        if (this.mobileMenu.getAttribute('aria-hidden') === 'false') {
          this.close();
        }
      };

      // Set up event listeners
      this.hamburger.addEventListener('click', () => this.open());
      this.closeBtn.addEventListener('click', () => this.close());
      document.addEventListener('keydown', this.boundEscapeHandler);
      this.mobileMenu.addEventListener('click', this.boundOverlayHandler);
      window.addEventListener('resize', this.boundResizeHandler);

      // Close menu when clicking on any link
      const menuLinks = this.mobileMenu.querySelectorAll('a');
      menuLinks.forEach(link => {
        link.addEventListener('click', () => this.close());
      });

    } catch (error) {
      console.error('Error setting up mobile menu event listeners:', error);
    }
  }

  open() {
    try {
      this.mobileMenu.setAttribute('aria-hidden', 'false');
      this.hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (this.headerWrapper) {
        this.headerWrapper.classList.add('mobile-menu-open');
      }
      
      // Focus first link
      const firstLink = this.mobileMenu.querySelector('a');
      if (firstLink) firstLink.focus();
    } catch (error) {
      console.error('Error opening mobile menu:', error);
    }
  }

  close() {
    try {
      this.mobileMenu.setAttribute('aria-hidden', 'true');
      this.hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (this.headerWrapper) {
        this.headerWrapper.classList.remove('mobile-menu-open');
      }
      this.hamburger.focus();
    } catch (error) {
      console.error('Error closing mobile menu:', error);
    }
  }

  cleanup() {
    // Clean up event listeners
    if (this.boundEscapeHandler) {
      document.removeEventListener('keydown', this.boundEscapeHandler);
    }
    if (this.boundOverlayHandler && this.mobileMenu) {
      this.mobileMenu.removeEventListener('click', this.boundOverlayHandler);
    }
    if (this.boundResizeHandler) {
      window.removeEventListener('resize', this.boundResizeHandler);
    }
  }
}

// Initialize mobile menu
document.addEventListener('DOMContentLoaded', () => {
  window.mobileMenu = new MobileMenu();
}); 