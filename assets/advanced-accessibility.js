/**
 * Advanced Accessibility Features - Beyond WCAG 2.0
 * Implements cutting-edge inclusive design patterns
 */

class AdvancedAccessibility {
  constructor() {
    this.preferences = this.loadUserAccessibilityPreferences();
    this.voiceCommands = new Map();
    this.init();
  }

  init() {
    this.setupCognitiveSupport();
    this.setupVoiceControl();
    this.setupAdvancedScreenReader();
    this.setupPersonalization();
    this.setupAccessibilityAnalytics();
    this.initializeAIAssistance();
    
    console.log('Advanced Accessibility Features initialized');
  }

  /**
   * WCAG 2.1 AAA Features
   */
  setupCognitiveSupport() {
    // Reading assistance
    this.addReadingSupport();
    
    // Attention and focus assistance
    this.setupFocusAssistance();
    
    // Language simplification
    this.setupLanguageSupport();
  }

  addReadingSupport() {
    // Add reading indicators and progress
    const textBlocks = document.querySelectorAll('p, .product-description, .block__text');
    
    textBlocks.forEach((block, index) => {
      // Add reading time estimate
      const wordCount = block.textContent.trim().split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
      
      if (readingTime > 1) {
        const indicator = document.createElement('span');
        indicator.className = 'reading-time sr-only';
        indicator.textContent = `Estimated reading time: ${readingTime} minute${readingTime !== 1 ? 's' : ''}`;
        block.insertBefore(indicator, block.firstChild);
      }
      
      // Add paragraph numbering for long content
      if (block.textContent.length > 500) {
        block.setAttribute('aria-label', `Paragraph ${index + 1}`);
      }
    });
  }

  setupFocusAssistance() {
    // Reduce distractions when focusing
    document.addEventListener('focusin', (e) => {
      if (this.preferences.reducedDistraction) {
        document.body.classList.add('focus-mode');
        
        // Dim non-essential content
        document.querySelectorAll('*:not(:focus):not(:focus *)').forEach(el => {
          if (!el.closest('.product-page, .cart-flyout, .modal')) {
            el.style.opacity = '0.3';
          }
        });
      }
    });

    document.addEventListener('focusout', (e) => {
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          document.body.classList.remove('focus-mode');
          document.querySelectorAll('[style*="opacity"]').forEach(el => {
            el.style.opacity = '';
          });
        }
      }, 100);
    });
  }

  setupLanguageSupport() {
    // Add definitions for complex terms
    this.addTermDefinitions();
    
    // Simplify technical language
    this.addLanguageSimplification();
  }

  addTermDefinitions() {
    const technicalTerms = {
      'organic': 'grown without synthetic pesticides or fertilizers',
      'artisanal': 'made in small batches using traditional methods',
      'sustainable': 'environmentally friendly and renewable',
      'locally sourced': 'obtained from nearby producers'
    };

    Object.keys(technicalTerms).forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      document.body.innerHTML = document.body.innerHTML.replace(regex, 
        `<abbr title="${technicalTerms[term]}" aria-label="${term}, defined as: ${technicalTerms[term]}">${term}</abbr>`
      );
    });
  }

  /**
   * Voice Control Optimization (Dragon NaturallySpeaking, etc.)
   */
  setupVoiceControl() {
    // Add voice command hints
    this.addVoiceCommands();
  }

  addVoiceCommands() {
    // Register common voice commands
    this.voiceCommands.set('add to cart', () => {
      const addButton = document.querySelector('.product-page__add-to-cart, .add-to-cart');
      if (addButton && !addButton.disabled) addButton.click();
    });

    this.voiceCommands.set('open cart', () => {
      const cartButton = document.querySelector('.nav__cart');
      if (cartButton) cartButton.click();
    });

    this.voiceCommands.set('go to shop', () => {
      window.location.href = '/collections/all';
    });

    this.voiceCommands.set('search products', () => {
      const searchInput = document.querySelector('[type="search"], .search-input');
      if (searchInput) searchInput.focus();
    });

    // Add voice command indicators
    this.addVoiceIndicators();
  }

  addVoiceIndicators() {
    const voiceElements = [
      { selector: '.product-page__add-to-cart', command: 'add to cart' },
      { selector: '.nav__cart', command: 'open cart' },
      { selector: 'a[href*="collections"]', command: 'go to shop' }
    ];

    voiceElements.forEach(({ selector, command }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.setAttribute('data-voice-command', command);
        el.setAttribute('aria-keyshortcuts', `Say "${command}"`);
      });
    });
  }

  /**
   * Advanced Screen Reader Features
   */
  setupAdvancedScreenReader() {
    // Enhanced landmarks
    this.addEnhancedLandmarks();

  }

  addEnhancedLandmarks() {
    // Add more specific landmark roles
    const productSection = document.querySelector('.product-page');
    if (productSection) {
      productSection.setAttribute('role', 'main');
      productSection.setAttribute('aria-label', 'Product details and purchase options');
    }

    const cartSection = document.querySelector('.cart-flyout');
    if (cartSection) {
      cartSection.setAttribute('role', 'dialog');
      cartSection.setAttribute('aria-label', 'Shopping cart contents and checkout');
    }

    // Add page structure summary
    this.addPageStructureSummary();
  }

  addPageStructureSummary() {
    const summary = document.createElement('div');
    summary.className = 'page-summary sr-only';
    summary.setAttribute('aria-label', 'Page structure summary');
    
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const landmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]');
    
    summary.innerHTML = `
      <p>This page contains ${headings.length} headings and ${landmarks.length} main sections.</p>
      <p>Use heading navigation to jump between sections.</p>
      <p>Press H to move between headings, L for landmarks, and B for buttons.</p>
    `;
    
    document.body.insertBefore(summary, document.body.firstChild);
  }

  /**
   * Accessibility Personalization
   */
  setupPersonalization() {
    // Create accessibility preference panel
    this.createPreferencePanel();
    
    // Apply saved preferences
    this.applyPreferences();
  }

  createPreferencePanel() {
    // Hidden preference controls
    const panel = document.createElement('div');
    panel.className = 'accessibility-preferences sr-only';
    panel.innerHTML = `
      <h2>Accessibility Preferences</h2>
      <fieldset>
        <legend>Visual Preferences</legend>
        <label><input type="checkbox" id="high-contrast"> High Contrast Mode</label>
        <label><input type="checkbox" id="large-text"> Larger Text</label>
        <label><input type="checkbox" id="reduced-motion"> Reduce Motion</label>
      </fieldset>
      <fieldset>
        <legend>Cognitive Assistance</legend>
        <label><input type="checkbox" id="reading-aids"> Reading Assistance</label>
        <label><input type="checkbox" id="focus-assistance"> Focus Assistance</label>
        <label><input type="checkbox" id="memory-aids"> Memory Aids</label>
      </fieldset>
      <button id="save-preferences">Save Preferences</button>
    `;
    
    document.body.appendChild(panel);
    this.bindPreferenceEvents();
  }

  bindPreferenceEvents() {
    document.getElementById('save-preferences')?.addEventListener('click', () => {
      const prefs = {};
      document.querySelectorAll('.accessibility-preferences input').forEach(input => {
        prefs[input.id] = input.checked;
      });
      
      localStorage.setItem('accessibilityPreferences', JSON.stringify(prefs));
      this.preferences = prefs;
      this.applyPreferences();
      
      if (window.AccessibilityManager) {
        window.AccessibilityManager.announce('Accessibility preferences saved', 'polite');
      }
    });
  }

  applyPreferences() {
    Object.keys(this.preferences).forEach(pref => {
      if (this.preferences[pref]) {
        document.body.classList.add(`pref-${pref}`);
      }
    });
  }

  /**
   * Accessibility Analytics
   */
  setupAccessibilityAnalytics() {
    this.monitorAccessibilityErrors();
  }

  monitorAccessibilityErrors() {
    // Monitor for accessibility-related errors
    window.addEventListener('error', (e) => {
      if (e.message.includes('aria') || e.message.includes('role')) {
        console.warn('Accessibility-related error:', e);
      }
    });
  }

  /**
   * AI-Powered Accessibility Assistance
   */
  initializeAIAssistance() {
    // Smart content descriptions
    this.generateSmartDescriptions();
  }

  generateSmartDescriptions() {
    // Enhanced alt text for complex images
    document.querySelectorAll('img[src*="product"]').forEach(img => {
      if (!img.alt || img.alt.length < 10) {
        const productTitle = img.closest('.product-card, .product-page')
          ?.querySelector('h1, h2, h3, .product-card__title')?.textContent;
        
        if (productTitle) {
          img.alt = `${productTitle} - Product image showing details and packaging`;
        }
      }
    });
  }


  loadUserAccessibilityPreferences() {
    return JSON.parse(localStorage.getItem('accessibilityPreferences') || '{}');
  }
}

// Initialize advanced accessibility
window.AdvancedAccessibility = new AdvancedAccessibility();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedAccessibility;
}