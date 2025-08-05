class CartManager {
  constructor() {
    this.cartFlyout = document.getElementById('cart-flyout');
    this.cartButton = document.querySelector('.nav__cart');
    this.cartCloseButton = document.querySelector('.cart-flyout__close');
    this.cartCount = document.getElementById('cart-count');
    this.cartItems = document.getElementById('cart-items');
    this.cartOverlay = null;
    this.initialized = false;
    
    // Wait for jQuery and CartJS to be available
    this.waitForDependencies();
  }

  waitForDependencies() {
    const checkDependencies = () => {
      if (typeof jQuery !== 'undefined' && typeof CartJS !== 'undefined') {
        this.init();
      } else {
        setTimeout(checkDependencies, 50);
      }
    };
    checkDependencies();
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    
    console.log('Initializing CartManager with CartJS...');
    
    this.createOverlay();
    this.bindEvents();
    this.initializeCartJS();
  }

  initializeCartJS() {
    // Initialize Cart.js with proper cart data
    const initialCartData = window.cartData || {
      item_count: 0,
      total_price: 0,
      items: [],
      attributes: {},
      note: null,
      currency: 'USD'
    };

    console.log('Initializing Cart.js with data:', initialCartData);
    
    CartJS.init(initialCartData, {
      debug: true
    });
    
    // Set up Cart.js event listeners
    jQuery(document).on('cart.requestComplete', (event, cart) => {
      console.log('Cart updated:', cart);
      this.updateCart(cart);
    });
    
    jQuery(document).on('cart.ready', (event, cart) => {
      console.log('Cart ready:', cart);
      this.updateCart(cart);
    });
    
    // Update the cart UI with initial data
    this.updateCart(initialCartData);
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
      } else if (e.target.classList.contains('cart-item__remove')) {
        this.removeItemWithAnimation(e.target.dataset.itemKey);
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
      // Use Cart.js addItem method
      CartJS.addItem(variantId, quantity, properties, {
        success: () => {
          this.openCart();
          this.showNotification('Item added to cart!', 'success');
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
      this.showNotification(error.message || 'Failed to add item to cart', 'error');
      throw error;
    }
  }

  updateQuantity(itemKey, change) {
    const item = this.findCartItem(itemKey);
    
    if (!item) {
      console.error('Cart item not found:', itemKey);
      return;
    }

    const quantityDisplay = item.querySelector('.quantity-display');
    if (!quantityDisplay) {
      console.error('Quantity display not found in item:', item);
      return;
    }

    const currentQuantity = parseInt(quantityDisplay.textContent);
    const newQuantity = Math.max(0, currentQuantity + change);

    if (newQuantity === 0) {
      this.removeItem(itemKey);
      return;
    }

    // Find the line number for this item key
    const lineNumber = this.getLineNumberForKey(itemKey);
    if (lineNumber) {
      CartJS.updateItem(lineNumber, newQuantity, {}, {
        error: () => {
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

    if (cart.item_count === 0) {
      this.cartItems.innerHTML = `
        <div class="cart-flyout__empty">
          <p>Your cart is empty</p>
          <a href="/collections/all" class="button button--secondary">Start Shopping</a>
        </div>
      `;
      return;
    }

    // Ensure footer exists
    this.ensureCartFooter(cart.total_price);

    // Use intelligent updating to preserve DOM elements and prevent image reloading
    this.updateCartItemsIntelligently(cart.items);

    // Update subtotal
    this.updateCartSubtotal(cart.total_price);
  }

  ensureCartFooter(totalPrice) {
    let footer = this.cartItems.querySelector('.cart-flyout__footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'cart-flyout__footer';
      footer.innerHTML = `
        <div class="cart-flyout__subtotal">
          <span>Subtotal:</span>
          <span>${this.formatMoney(totalPrice)}</span>
        </div>
        <a href="/cart" class="button button--primary cart-flyout__checkout">View Cart & Checkout</a>
      `;
      this.cartItems.appendChild(footer);
    }
  }

  updateCartSubtotal(totalPrice) {
    const subtotalElement = this.cartItems.querySelector('.cart-flyout__subtotal span:last-child');
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
    // Add updating animation
    this.animateItemUpdate(itemElement);

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

    // Update variant title if needed
    const variantElement = itemElement.querySelector('.cart-item__variant');
    if (variantElement) {
      variantElement.textContent = itemData.variant_title || '';
    }

    // Note: We intentionally don't update the image to prevent reloading
  }

  createCartItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item cart-item--entering';
    itemElement.dataset.itemKey = item.key;
    
    itemElement.innerHTML = `
      <div class="cart-item__image">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
      </div>
      <div class="cart-item__details">
        <h3 class="cart-item__title">${item.product_title}</h3>
        <p class="cart-item__variant">${item.variant_title || ''}</p>
        <div class="cart-item__price">${this.formatMoney(item.final_price)}</div>
      </div>
      <div class="cart-item__quantity">
        <button class="quantity-btn quantity-btn--minus" data-item-key="${item.key}" aria-label="Decrease quantity">-</button>
        <span class="quantity-display">${item.quantity}</span>
        <button class="quantity-btn quantity-btn--plus" data-item-key="${item.key}" aria-label="Increase quantity">+</button>
      </div>
      <button class="cart-item__remove" data-item-key="${item.key}" aria-label="Remove item">&times;</button>
    `;
    
    // Remove entering class after animation
    setTimeout(() => {
      itemElement.classList.remove('cart-item--entering');
    }, 400);
    
    return itemElement;
  }

  reorderCartItems(newItems) {
    // Get the footer to preserve it
    const footer = this.cartItems.querySelector('.cart-flyout__footer');
    
    // Create ordered list of items
    const orderedItems = [];
    newItems.forEach(item => {
      const element = this.cartItems.querySelector(`[data-item-key="${item.key}"]`);
      if (element) {
        orderedItems.push(element);
      }
    });
    
    // Remove all cart items from DOM (but keep footer)
    this.cartItems.querySelectorAll('.cart-item').forEach(item => item.remove());
    
    // Re-insert items in correct order before the footer
    orderedItems.forEach(item => {
      if (footer) {
        this.cartItems.insertBefore(item, footer);
      } else {
        this.cartItems.appendChild(item);
      }
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

  animateItemUpdate(itemElement) {
    itemElement.classList.add('cart-item--updating');
    setTimeout(() => {
      itemElement.classList.remove('cart-item--updating');
    }, 300);
  }

  animateCartBadge() {
    if (this.cartCount) {
      this.cartCount.classList.add('nav__cart-count--updated');
      setTimeout(() => {
        this.cartCount.classList.remove('nav__cart-count--updated');
      }, 500);
    }
  }

  removeItemWithAnimation(itemKey) {
    const item = this.findCartItem(itemKey);
    if (!item) return;

    // Add removing animation
    item.classList.add('cart-item--removing');
    
    // Remove from cart after animation
    setTimeout(() => {
      this.removeItem(itemKey);
    }, 300);
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
  console.log('Starting CartManager initialization...');
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