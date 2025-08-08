class CartManager {
  constructor() {
    this.cartFlyout = document.getElementById('cart-flyout');
    this.cartButton = document.querySelector('.nav__cart');
    this.cartCloseButton = document.querySelector('.cart-flyout__close');
    this.cartCount = document.getElementById('cart-count');
    this.cartItems = document.getElementById('cart-items');
    this.cartOverlay = null;
    this.initialized = false;
    this.maxRetries = 100; // Maximum retries (5 seconds)
    this.retryCount = 0;
    
    // Wait for jQuery and CartJS to be available
    this.waitForDependencies();
  }

  waitForDependencies() {
    return new Promise((resolve, reject) => {
      const checkDependencies = () => {
        if (typeof jQuery !== 'undefined' && typeof CartJS !== 'undefined') {
          this.init();
          resolve();
        } else if (this.retryCount >= this.maxRetries) {
          console.error('CartManager: Dependencies (jQuery/CartJS) not loaded after 5 seconds');
          reject(new Error('Dependencies not loaded'));
        } else {
          this.retryCount++;
          setTimeout(checkDependencies, 50);
        }
      };
      checkDependencies();
    });
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    try {
      this.createOverlay();
      this.bindEvents();
      this.initializeCartJS();
    } catch (error) {
      console.error('Error initializing CartManager:', error);
    }
  }

  initializeCartJS() {
    try {
      // Initialize Cart.js with proper cart data
      const initialCartData = window.cartData || {
        item_count: 0,
        total_price: 0,
        items: [],
        attributes: {},
        note: null,
        currency: 'USD'
      };
      
      CartJS.init(initialCartData, {
        debug: false
      });
      
      // Set up Cart.js event listeners
      jQuery(document).on('cart.requestComplete', (event, cart) => {
        this.updateCart(cart);
      });
      
      jQuery(document).on('cart.ready', (event, cart) => {
        this.updateCart(cart);
      });
      
      // Update the cart UI with initial data
      this.updateCart(initialCartData);
    } catch (error) {
      console.error('Error initializing CartJS:', error);
    }
  }

  createOverlay() {
    this.cartOverlay = document.createElement('div');
    this.cartOverlay.className = 'cart-overlay';
    this.cartOverlay.addEventListener('click', () => this.closeCart());
    document.body.appendChild(this.cartOverlay);
  }

  bindEvents() {
    // Cart open/close
    this.cartButton?.addEventListener('click', () => this.openCart());
    this.cartCloseButton?.addEventListener('click', () => this.closeCart());
    
    // Quantity buttons using event delegation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quantity-btn--plus')) {
        this.animateButtonClick(e.target);
        this.updateQuantity(e.target.dataset.itemKey, 1);
      } else if (e.target.classList.contains('quantity-btn--minus')) {
        this.animateButtonClick(e.target);
        this.updateQuantity(e.target.dataset.itemKey, -1);
      }
    });

    // Close cart on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isCartOpen()) {
        this.closeCart();
      }
    });
  }

  openCart() {
    this.cartFlyout.setAttribute('aria-hidden', 'false');
    this.cartButton.setAttribute('aria-expanded', 'true');
    this.cartOverlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }

  closeCart() {
    this.cartFlyout.setAttribute('aria-hidden', 'true');
    this.cartButton.setAttribute('aria-expanded', 'false');
    this.cartOverlay.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  isCartOpen() {
    return this.cartFlyout.getAttribute('aria-hidden') === 'false';
  }

  async addToCart(variantId, quantity = 1, properties = {}) {
    try {
      // Check cart quantity limits before adding
      const currentCartTotal = this.getCurrentCartTotal();
      const newCartTotal = currentCartTotal + quantity;
      
      if (newCartTotal > 50) {
        const maxAllowed = 50 - currentCartTotal;
        if (maxAllowed <= 0) {
          this.showNotification('Cart is full (50 item limit)', 'error');
        } else {
          this.showNotification(`Can only add ${maxAllowed} more item${maxAllowed !== 1 ? 's' : ''} (50 item limit)`, 'error');
        }
        throw new Error('Cart quantity limit exceeded');
      }

      // Use Cart.js addItem method
      CartJS.addItem(variantId, quantity, properties, {
        success: () => {
          this.openCart();
          // Removed success notification - cart opening and badge update provide sufficient feedback
        },
        error: (jqXHR, textStatus) => {
          let errorMessage = 'Failed to add item to cart';
          try {
            const errorData = JSON.parse(jqXHR.responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // Use default error message
          }
          this.showNotification(errorMessage, 'error');
        }
      });
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (!error.message.includes('quantity limit')) {
        this.showNotification(error.message || 'Failed to add item to cart', 'error');
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
  }

  updateCartSubtotal(totalPrice) {
    const subtotalElement = document.querySelector('.cart-flyout__subtotal-amount');
    if (subtotalElement) {
      subtotalElement.textContent = this.formatMoney(totalPrice);
    }
  }


  updateCartItemsIntelligently(newItems) {
    const existingItems = Array.from(this.cartItems.querySelectorAll('.cart-item'));
    const existingKeys = existingItems.map(item => item.dataset.itemKey);
    const newKeys = newItems.map(item => item.key);

    // Remove items that are no longer in the cart
    existingItems.forEach(item => {
      if (!newKeys.includes(item.dataset.itemKey)) {
        item.remove();
      }
    });

    // Add or update items
    newItems.forEach((item, index) => {
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

    // Update price with animation (in case of price changes)
    const priceElement = itemElement.querySelector('.cart-item__price');
    if (priceElement) {
      const oldPrice = priceElement.textContent;
      const newPrice = this.formatMoney(itemData.final_price);
      
      if (oldPrice !== newPrice) {
        priceElement.textContent = newPrice;
        this.animatePriceUpdate(priceElement);
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
          <h5 class="cart-item__price">${this.formatMoney(item.final_price)}</h5>
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

  getCurrentCartTotal() {
    // Get current total from DOM or CartJS
    if (CartJS.cart && CartJS.cart.items) {
      return CartJS.cart.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    // Fallback: count from DOM
    let total = 0;
    document.querySelectorAll('.cart-item .quantity-display').forEach(display => {
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


  formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `cart-notification cart-notification--${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 1.5rem',
      borderRadius: '0.5rem',
      color: 'white',
      fontWeight: '600',
      zIndex: '10000',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      backgroundColor: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'
    });

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize cart immediately if DOM is already loaded, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCart);
} else {
  initializeCart();
}

function initializeCart() {
  window.cartManager = new CartManager();
}

// Maintain backward compatibility
window.Cart = CartManager;

// Expose addToCart method globally for backward compatibility
window.addToCart = function(variantId, quantity = 1, properties = {}) {
  if (window.cartManager) {
    return window.cartManager.addToCart(variantId, quantity, properties);
  } else {
    console.warn('CartManager not yet initialized');
  }
};