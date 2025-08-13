/**
 * Cart Manager Class
 * Manages cart functionality including add/remove items, quantity updates, and UI state
 * @class CartManager
 */
class CartManager {
  /**
   * Initialize CartManager
   */
  constructor() {
    // DOM elements
    this.cartFlyout = Utils.DOM.safeQuerySelector('#cart-flyout');
    this.cartButton = Utils.DOM.safeQuerySelector('.nav__cart');
    this.cartCloseButton = Utils.DOM.safeQuerySelector('.cart-flyout__close');
    this.cartCount = Utils.DOM.safeQuerySelector('#cart-count');
    this.cartItems = Utils.DOM.safeQuerySelector('#cart-items');
    this.cartOverlay = null;
    
    // State management
    this.initialized = false;
    this.eventCleanupFunctions = [];
    
    // Configuration from global config
    this.maxRetries = Config.get('cart.dependencyRetries', 100);
    this.retryCount = 0;
    this.maxQuantity = Config.get('cart.maxQuantity', 50);
    this.animationDuration = Config.get('cart.animationDuration', 400);
    
    // Wait for jQuery and CartJS to be available
    this.waitForDependencies();
  }

  /**
   * Wait for required dependencies (jQuery and CartJS) to load
   * @returns {Promise} Resolves when dependencies are loaded
   */
  waitForDependencies() {
    return new Promise((resolve, reject) => {
      const checkDependencies = () => {
        if (typeof jQuery !== 'undefined' && typeof CartJS !== 'undefined') {
          this.init();
          resolve();
        } else if (this.retryCount >= this.maxRetries) {
          const error = ErrorHandler.createError(
            'cart',
            'Cart dependencies (jQuery/CartJS) failed to load',
            'CART_DEPENDENCY_TIMEOUT',
            { retryCount: this.retryCount, maxRetries: this.maxRetries }
          );
          ErrorHandler.handle(error);
          reject(error);
        } else {
          this.retryCount++;
          setTimeout(checkDependencies, Config.get('cart.dependencyTimeout', 5000) / this.maxRetries);
        }
      };
      checkDependencies();
    });
  }

  /**
   * Initialize cart manager
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    try {
      this.createOverlay();
      this.bindEvents();
      this.initializeCartJS();
      
      if (Config.debug.enabled) {
        console.log('CartManager initialized successfully');
      }
    } catch (error) {
      const themeError = ErrorHandler.createError(
        'cart',
        'Failed to initialize cart manager',
        'CART_INITIALIZATION_ERROR',
        { originalError: error.message },
        error
      );
      ErrorHandler.handle(themeError);
    }
  }

  /**
   * Initialize CartJS with configuration and event handlers
   */
  initializeCartJS() {
    try {
      // Initialize Cart.js with proper cart data
      const initialCartData = window.cartData || {
        item_count: 0,
        total_price: 0,
        items: [],
        attributes: {},
        note: null,
        currency: Config.get('formatting.currency', 'USD')
      };
      
      CartJS.init(initialCartData, {
        debug: Config.debug.cartEvents
      });
      
      // Set up Cart.js event listeners with cleanup tracking
      const requestCompleteHandler = (event, cart) => {
        this.updateCart(cart);
        if (Config.debug.cartEvents) {
          console.log('Cart request completed:', cart);
        }
        Utils.Analytics.trackCart('cart_updated', { item_count: cart.item_count });
      };
      
      const readyHandler = (event, cart) => {
        this.updateCart(cart);
        if (Config.debug.cartEvents) {
          console.log('Cart ready:', cart);
        }
      };
      
      jQuery(document).on('cart.requestComplete', requestCompleteHandler);
      jQuery(document).on('cart.ready', readyHandler);
      
      // Store cleanup functions
      this.eventCleanupFunctions.push(
        () => jQuery(document).off('cart.requestComplete', requestCompleteHandler),
        () => jQuery(document).off('cart.ready', readyHandler)
      );
      
      // Update the cart UI with initial data
      this.updateCart(initialCartData);
    } catch (error) {
      const themeError = ErrorHandler.createError(
        'cart',
        'Failed to initialize CartJS',
        'CART_DEPENDENCY_ERROR',
        { originalError: error.message },
        error
      );
      ErrorHandler.handle(themeError);
    }
  }

  /**
   * Create cart overlay for closing cart when clicking outside
   */
  createOverlay() {
    this.cartOverlay = document.createElement('div');
    this.cartOverlay.className = 'cart-overlay';
    
    const overlayClickHandler = () => this.closeCart();
    this.cartOverlay.addEventListener('click', overlayClickHandler);
    
    // Store cleanup function
    this.eventCleanupFunctions.push(
      () => this.cartOverlay.removeEventListener('click', overlayClickHandler)
    );
    
    document.body.appendChild(this.cartOverlay);
  }

  /**
   * Bind event listeners with proper cleanup tracking
   */
  bindEvents() {
    // Cart open/close handlers
    const openCartHandler = () => this.openCart();
    const closeCartHandler = () => this.closeCart();
    
    if (this.cartButton) {
      this.cartButton.addEventListener('click', openCartHandler);
      this.eventCleanupFunctions.push(
        () => this.cartButton.removeEventListener('click', openCartHandler)
      );
    }
    
    if (this.cartCloseButton) {
      this.cartCloseButton.addEventListener('click', closeCartHandler);
      this.eventCleanupFunctions.push(
        () => this.cartCloseButton.removeEventListener('click', closeCartHandler)
      );
    }
    
    // Quantity buttons using event delegation
    const quantityClickHandler = (e) => {
      if (e.target.classList.contains('quantity-btn--plus')) {
        this.animateButtonClick(e.target);
        this.updateQuantity(e.target.dataset.itemKey, 1);
      } else if (e.target.classList.contains('quantity-btn--minus')) {
        this.animateButtonClick(e.target);
        this.updateQuantity(e.target.dataset.itemKey, -1);
      }
    };
    
    document.addEventListener('click', quantityClickHandler);
    this.eventCleanupFunctions.push(
      () => document.removeEventListener('click', quantityClickHandler)
    );

    // Close cart on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && this.isCartOpen()) {
        this.closeCart();
      }
    };
    
    document.addEventListener('keydown', escapeHandler);
    this.eventCleanupFunctions.push(
      () => document.removeEventListener('keydown', escapeHandler)
    );
  }

  /**
   * Open cart flyout with proper accessibility and analytics
   */
  openCart() {
    if (!this.cartFlyout) {
      const error = ErrorHandler.createError(
        'cart',
        'Cart flyout element not found',
        'CART_DOM_ERROR'
      );
      ErrorHandler.handle(error);
      return;
    }
    
    this.cartFlyout.setAttribute('aria-hidden', 'false');
    
    if (this.cartButton) {
      this.cartButton.setAttribute('aria-expanded', 'true');
    }
    
    if (this.cartOverlay) {
      this.cartOverlay.classList.add('is-visible');
    }
    
    document.body.style.overflow = 'hidden';
    
    // Track cart opening
    Utils.Analytics.trackCart('cart_opened');
    
    if (Config.debug.cartEvents) {
      console.log('Cart opened');
    }
  }

  /**
   * Close cart flyout with proper cleanup
   */
  closeCart() {
    if (!this.cartFlyout) return;
    
    this.cartFlyout.setAttribute('aria-hidden', 'true');
    
    if (this.cartButton) {
      this.cartButton.setAttribute('aria-expanded', 'false');
    }
    
    if (this.cartOverlay) {
      this.cartOverlay.classList.remove('is-visible');
    }
    
    document.body.style.overflow = '';
    
    if (Config.debug.cartEvents) {
      console.log('Cart closed');
    }
  }

  isCartOpen() {
    return this.cartFlyout.getAttribute('aria-hidden') === 'false';
  }

  /**
   * Add item to cart with validation and error handling
   * @param {string|number} variantId - Product variant ID
   * @param {number} quantity - Quantity to add (default: 1)
   * @param {Object} properties - Additional item properties
   * @returns {Promise} Promise that resolves when item is added
   */
  async addToCart(variantId, quantity = 1, properties = {}) {
    try {
      // Validate inputs
      if (!variantId) {
        throw ErrorHandler.createError(
          'cart',
          'Product variant ID is required',
          'CART_VARIANT_NOT_FOUND',
          { variantId, quantity, properties }
        );
      }
      
      quantity = Utils.Validate.quantity(quantity, 1, Config.get('cart.maxItemQuantity', 10));
      
      // Check cart quantity limits before adding
      const currentCartTotal = this.getCurrentCartTotal();
      const newCartTotal = currentCartTotal + quantity;
      const maxQuantity = Config.get('cart.maxQuantity', 50);
      
      if (newCartTotal > maxQuantity) {
        const maxAllowed = maxQuantity - currentCartTotal;
        const error = ErrorHandler.createError(
          'cart',
          `Cart limit exceeded. Maximum ${maxQuantity} items allowed.`,
          maxAllowed <= 0 ? 'CART_QUANTITY_LIMIT' : 'CART_QUANTITY_LIMIT',
          { currentTotal: currentCartTotal, attemptedQuantity: quantity, maxAllowed }
        );
        throw error;
      }

      // Use Cart.js addItem method
      return new Promise((resolve, reject) => {
        CartJS.addItem(variantId, quantity, properties, {
          success: (data) => {
            if (Config.get('cart.autoOpen', true)) {
              this.openCart();
            }
            
            // Track successful add to cart
            Utils.Analytics.trackCart('add_to_cart', {
              id: variantId,
              quantity: quantity,
              price: data.price || 0
            });
            
            if (Config.debug.cartEvents) {
              console.log('Item added to cart:', { variantId, quantity, properties });
            }
            
            resolve(data);
          },
          error: (jqXHR) => {
            let errorMessage = 'Failed to add item to cart';
            let errorCode = 'CART_ADD_ERROR';
            
            try {
              const errorData = JSON.parse(jqXHR.responseText);
              errorMessage = errorData.message || errorMessage;
              
              // Map common Shopify error messages to codes
              if (errorMessage.includes('not available') || errorMessage.includes('sold out')) {
                errorCode = 'CART_ITEM_UNAVAILABLE';
              } else if (errorMessage.includes('inventory')) {
                errorCode = 'CART_INSUFFICIENT_INVENTORY';
              }
            } catch (e) {
              // Use default error message
            }
            
            const error = ErrorHandler.createError(
              'cart',
              errorMessage,
              errorCode,
              { variantId, quantity, properties, responseText: jqXHR.responseText }
            );
            
            ErrorHandler.handle(error);
            reject(error);
          }
        });
      });
      
    } catch (error) {
      // Handle errors that occurred before CartJS call
      if (error instanceof ThemeError) {
        ErrorHandler.handle(error);
      } else {
        const themeError = ErrorHandler.createError(
          'cart',
          error.message || 'Failed to add item to cart',
          'CART_ADD_ERROR',
          { variantId, quantity, properties },
          error
        );
        ErrorHandler.handle(themeError);
      }
      throw error;
    }
  }

  updateQuantity(itemKey, change) {
    const item = this.findCartItem(itemKey);
    
    if (!item) {
      return;
    }

    const quantityDisplay = item.querySelector('.quantity-display');
    if (!quantityDisplay) {
      return;
    }

    const currentQuantity = parseInt(quantityDisplay.textContent);
    const newQuantity = Math.max(0, currentQuantity + change);

    // Check cart quantity limits
    if (change > 0) { // Only check when increasing
      const currentCartTotal = this.getCurrentCartTotal();
      const newCartTotal = currentCartTotal + change;
      
      if (newCartTotal > 50) {
        this.showNotification('Cart cannot exceed 50 items total', 'error');
        this.animateButtonError(item.querySelector(change > 0 ? '.quantity-btn--plus' : '.quantity-btn--minus'));
        return;
      }
    }

    // Update display immediately for responsive feel
    quantityDisplay.textContent = newQuantity;
    this.animateQuantityChange(quantityDisplay);

    if (newQuantity === 0) {
      // Add removal animation and remove from DOM immediately after
      const item = this.findCartItem(itemKey);
      if (item) {
        item.classList.add('cart-item--removing');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
          item.remove();
        }, 400); // Slightly longer to match the new animation timing
        
        // Also trigger Cart.js removal (this may take longer but won't affect UI)
        this.removeItem(itemKey);
      } else {
        this.removeItem(itemKey);
      }
      return;
    }

    // Find the line number for this item key
    const lineNumber = this.getLineNumberForKey(itemKey);
    if (lineNumber) {
      CartJS.updateItem(lineNumber, newQuantity, {}, {
        error: () => {
          // Revert the quantity display on error
          quantityDisplay.textContent = currentQuantity;
          this.showNotification('Failed to update quantity', 'error');
        }
      });
    }
  }

  removeItem(itemKey) {
    const lineNumber = this.getLineNumberForKey(itemKey);
    if (lineNumber) {
      CartJS.removeItem(lineNumber, {
        error: () => {
          this.showNotification('Failed to remove item', 'error');
        }
      });
    }
  }

  getLineNumberForKey(itemKey) {
    // Cart.js uses 1-based line numbers, we need to find the line number for the item key
    if (CartJS.cart && CartJS.cart.items) {
      for (let i = 0; i < CartJS.cart.items.length; i++) {
        if (CartJS.cart.items[i].key === itemKey) {
          return i + 1; // Cart.js uses 1-based indexing
        }
      }
    }
    return null;
  }

  findCartItem(itemKey) {
    return document.querySelector(`[data-item-key="${itemKey}"]`);
  }

  updateCart(cart) {
    this.updateCartCount(cart.item_count);
    this.updateCartContent(cart);
  }

  updateCartCount(count = null) {
    if (count === null) {
      count = CartJS.cart ? CartJS.cart.item_count : 0;
    }
    
    if (this.cartCount) {
      const oldCount = parseInt(this.cartCount.textContent) || 0;
      this.cartCount.textContent = count;
      this.cartCount.style.display = count > 0 ? 'flex' : 'none';
      
      // Animate cart badge if count changed
      if (oldCount !== count) {
        this.animateCartBadge();
      }
    }
  }

  updateCartContent(cart) {
    if (!this.cartItems) return;

    // Update footer visibility
    this.updateFooterVisibility(cart.item_count > 0);

    if (cart.item_count === 0) {
      this.cartItems.innerHTML = `
        <div class="cart-flyout__empty">
          <p>Your cart is empty</p>
          <a href="/collections/all" class="button button--secondary">Start Shopping</a>
        </div>
      `;
      return;
    }

    // Clear empty state if it exists (when transitioning from empty to having items)
    const emptyState = this.cartItems.querySelector('.cart-flyout__empty');
    if (emptyState) {
      this.cartItems.innerHTML = '';
    }

    // Ensure footer exists
    this.ensureCartFooter(cart.total_price);

    // Use intelligent updating to preserve DOM elements and prevent image reloading
    this.updateCartItemsIntelligently(cart.items);

    // Update subtotal
    this.updateCartSubtotal(cart.total_price);
  }

  updateFooterVisibility(hasItems) {
    const footer = document.querySelector('.cart-flyout__footer');
    if (footer) {
      footer.style.display = hasItems ? 'block' : 'none';
    }
  }

  ensureCartFooter(totalPrice) {
    // Footer is now in the HTML structure, just ensure it exists
    const footer = document.querySelector('.cart-flyout__footer');
    // Footer should exist in HTML structure
    if (!footer) {
      console.warn('Cart footer not found in HTML structure');
    }
  }

  updateCartSubtotal(totalPrice) {
    const subtotalElement = document.querySelector('.cart-flyout__subtotal-amount');
    if (subtotalElement) {
      subtotalElement.textContent = this.formatMoney(totalPrice);
    }
  }


  updateCartItemsIntelligently(newItems) {
    const existingItems = Array.from(this.cartItems.querySelectorAll('.cart-item'));
    // const existingKeys = existingItems.map(item => item.dataset.itemKey);
    const newKeys = newItems.map(item => item.key);

    // Remove items that are no longer in the cart
    existingItems.forEach(item => {
      if (!newKeys.includes(item.dataset.itemKey)) {
        item.remove();
      }
    });

    // Add or update items
    newItems.forEach((item) => {
      const existingItem = this.cartItems.querySelector(`[data-item-key="${item.key}"]`);
      
      if (existingItem) {
        // Update existing item without touching the image
        this.updateExistingCartItem(existingItem, item);
      } else {
        // Add new item
        const newItemElement = this.createCartItemElement(item);
        this.cartItems.appendChild(newItemElement);
      }
    });

    // Reorder items to match cart order
    this.reorderCartItems(newItems);
  }

  updateExistingCartItem(itemElement, itemData) {
    // Update quantity display with animation
    const quantityDisplay = itemElement.querySelector('.quantity-display');
    if (quantityDisplay) {
      const oldQuantity = parseInt(quantityDisplay.textContent);
      const newQuantity = itemData.quantity;
      
      if (oldQuantity !== newQuantity) {
        quantityDisplay.textContent = newQuantity;
        this.animateQuantityChange(quantityDisplay);
      }
    }

    // Update price with animation (should show line total, not unit price)
    const priceElement = itemElement.querySelector('.cart-item__price');
    if (priceElement) {
      const oldPrice = priceElement.textContent;
      const newPrice = this.formatMoney(itemData.final_line_price || itemData.final_price * itemData.quantity);
      
      if (oldPrice !== newPrice) {
        priceElement.textContent = newPrice;
      }
    }

    // Update title to use variant title as main product name if available
    const titleElement = itemElement.querySelector('.cart-item__title');
    if (titleElement) {
      const variantTitle = itemData.variant_title || itemData.variant?.title;
      const productTitle = itemData.product_title || itemData.title;
      const displayTitle = (variantTitle && variantTitle !== 'Default Title') 
        ? variantTitle 
        : productTitle;
      titleElement.textContent = displayTitle;
    }

    // Note: We intentionally don't update the image to prevent reloading
  }

  createCartItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item cart-item--entering';
    itemElement.dataset.itemKey = item.key;
    
    // Use variant title as product name if available, otherwise use product title
    
    // Use variant title as product name if available, otherwise use product title
    // CartJS uses different property names than Liquid
    const variantTitle = item.variant_title || item.variant?.title;
    const productTitle = item.product_title || item.title;
    const displayTitle = (variantTitle && variantTitle !== 'Default Title') 
      ? variantTitle 
      : productTitle;
    
    itemElement.innerHTML = `
      <div class="cart-item__image">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
      </div>
      <div class="cart-item__details">
        <h4 class="cart-item__title">${displayTitle}</h4>
        <div class="cart-item__price-row">
          <div class="cart-item__quantity">
            <button class="quantity-btn quantity-btn--minus" data-item-key="${item.key}" aria-label="Decrease quantity">-</button>
            <span class="quantity-display">${item.quantity}</span>
            <button class="quantity-btn quantity-btn--plus" data-item-key="${item.key}" aria-label="Increase quantity">+</button>
          </div>
          <h5 class="cart-item__price">${this.formatMoney(item.final_line_price || item.final_price * item.quantity)}</h5>
        </div>
      </div>
    `;
    
    // Remove entering class after animation
    setTimeout(() => {
      itemElement.classList.remove('cart-item--entering');
    }, 400);
    
    return itemElement;
  }

  reorderCartItems(newItems) {
    // Create ordered list of items
    const orderedItems = [];
    newItems.forEach(item => {
      const element = this.cartItems.querySelector(`[data-item-key="${item.key}"]`);
      if (element) {
        orderedItems.push(element);
      }
    });
    
    // Remove all cart items from DOM
    this.cartItems.querySelectorAll('.cart-item').forEach(item => item.remove());
    
    // Re-insert items in correct order
    orderedItems.forEach(item => {
      this.cartItems.appendChild(item);
    });
  }

  // Animation Methods
  animateButtonClick(button) {
    button.classList.add('quantity-btn--clicked');
    setTimeout(() => {
      button.classList.remove('quantity-btn--clicked');
    }, 150);
  }

  animateQuantityChange(quantityDisplay) {
    quantityDisplay.classList.add('quantity-display--pulse');
    setTimeout(() => {
      quantityDisplay.classList.remove('quantity-display--pulse');
    }, 300);
  }

  animatePriceUpdate(priceElement) {
    priceElement.classList.add('cart-item__price--updated');
    setTimeout(() => {
      priceElement.classList.remove('cart-item__price--updated');
    }, 400);
  }


  animateCartBadge() {
    if (this.cartCount) {
      this.cartCount.classList.add('nav__cart-count--updated');
      setTimeout(() => {
        this.cartCount.classList.remove('nav__cart-count--updated');
      }, 500);
    }
  }

  /**
   * Get current total quantity in cart
   * @returns {number} Total quantity
   */
  getCurrentCartTotal() {
    // Get current total from CartJS
    if (typeof CartJS !== 'undefined' && CartJS.cart && CartJS.cart.items) {
      return CartJS.cart.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    // Fallback: count from cart badge
    if (this.cartCount) {
      const badgeCount = parseInt(this.cartCount.textContent) || 0;
      if (badgeCount > 0) return badgeCount;
    }
    
    // Final fallback: count from DOM
    let total = 0;
    const displays = Utils.DOM.safeQuerySelectorAll('.cart-item .quantity-display');
    displays.forEach(display => {
      total += parseInt(display.textContent) || 0;
    });
    return total;
  }

  animateButtonError(button) {
    if (button) {
      button.classList.add('quantity-btn--error');
      setTimeout(() => {
        button.classList.remove('quantity-btn--error');
      }, 300);
    }
  }


  /**
   * Format money using configuration and utilities
   * @param {number} cents - Price in cents
   * @returns {string} Formatted price string
   */
  formatMoney(cents) {
    return Utils.Format.money(
      cents, 
      Config.get('formatting.currency', 'USD'),
      Config.get('formatting.locale', 'en-US')
    );
  }

  /**
   * Show notification using utility system
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   */
  showNotification(message, type = 'info') {
    Utils.Notifications.show(
      message, 
      type, 
      Config.get('notifications.duration', 3000)
    );
  }

  /**
   * Clean up event listeners and resources
   */
  cleanup() {
    this.eventCleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        if (Config.debug.enabled) {
          console.warn('Error during cart cleanup:', error);
        }
      }
    });
    
    this.eventCleanupFunctions = [];
    this.initialized = false;
    
    if (Config.debug.enabled) {
      console.log('CartManager cleaned up');
    }
  }
}

/**
 * Initialize cart manager when DOM is ready
 */
function initializeCart() {
  try {
    window.cartManager = new CartManager();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (window.cartManager && window.cartManager.cleanup) {
        window.cartManager.cleanup();
      }
    });
    
    if (Config.debug.enabled) {
      console.log('Cart initialization complete');
    }
  } catch (error) {
    const themeError = ErrorHandler.createError(
      'cart',
      'Failed to initialize cart',
      'CART_INITIALIZATION_ERROR',
      {},
      error
    );
    ErrorHandler.handle(themeError);
  }
}

// Initialize cart immediately if DOM is already loaded, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCart);
} else {
  initializeCart();
}

// Maintain backward compatibility
window.Cart = CartManager;

/**
 * Global addToCart function for backward compatibility
 * @param {string|number} variantId - Product variant ID
 * @param {number} quantity - Quantity to add
 * @param {Object} properties - Additional properties
 * @returns {Promise} Promise that resolves when item is added
 */
window.addToCart = function(variantId, quantity = 1, properties = {}) {
  if (window.cartManager && window.cartManager.addToCart) {
    return window.cartManager.addToCart(variantId, quantity, properties);
  } else {
    const error = ErrorHandler.createError(
      'cart',
      'Cart manager not initialized',
      'CART_NOT_INITIALIZED',
      { variantId, quantity, properties }
    );
    ErrorHandler.handle(error, { showNotification: true });
    return Promise.reject(error);
  }
};