class ProductForms {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Handle product form submissions
    document.addEventListener('submit', (e) => {
      if (e.target.classList.contains('product-form') || e.target.classList.contains('product-page__form')) {
        e.preventDefault();
        this.handleProductForm(e.target);
      }
    });

    // Handle variant selection changes
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('product-card__variant-select') || e.target.classList.contains('product-page__variant-select')) {
        this.handleVariantChange(e.target);
      }
    });

    // Handle variant pill button clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('product-page__option-pill')) {
        this.handleVariantPillClick(e.target);
      }
    });

    // Handle quantity buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quantity-btn')) {
        this.handleQuantityChange(e.target);
      }
    });

    // Handle product gallery thumbnails
    document.addEventListener('click', (e) => {
      if (e.target.closest('.product-gallery__thumb')) {
        this.handleGalleryThumbClick(e.target.closest('.product-gallery__thumb'));
      }
    });
  }

  handleProductForm(form) {
    console.log('Product form submitted:', form);
    const formData = new FormData(form);
    const variantId = formData.get('id');
    const quantity = parseInt(formData.get('quantity')) || 1;
    
    console.log('Variant ID:', variantId, 'Quantity:', quantity);
    
    if (!variantId) {
      console.error('No variant ID found');
      return;
    }

    // Check cart quantity limits before proceeding
    const currentCartTotal = this.getCurrentCartTotal();
    const newCartTotal = currentCartTotal + quantity;
    
    if (newCartTotal > 50) {
      const maxAllowed = 50 - currentCartTotal;
      if (maxAllowed <= 0) {
        this.showNotification('Cart is full (50 item limit)', 'error');
      } else {
        this.showNotification(`Can only add ${maxAllowed} more item${maxAllowed !== 1 ? 's' : ''} (50 item limit)`, 'error');
      }
      return;
    }

    // Find and update the submit button
    const submitButton = form.querySelector('button[type="submit"], .button');
    const originalText = submitButton ? submitButton.textContent : '';
    
    console.log('Submit button found:', submitButton);
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Adding...';
    }

    // Add to cart using the global addToCart function
    if (window.addToCart) {
      console.log('Adding to cart...');
      try {
        window.addToCart(variantId, quantity);
        // Reset button state after a short delay to allow for UI updates
        setTimeout(() => {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
          }
        }, 500);
      } catch (error) {
        console.error('Error adding to cart:', error);
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    } else {
      console.error('Cart addToCart function not available');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  handleVariantChange(select) {
    // For product page forms, use the new variant matching logic
    if (select.closest('.product-page__form')) {
      this.updateVariantId(select);
      return;
    }
    
    // For product cards, use the simpler availability check
    const selectedOption = select.options[select.selectedIndex];
    const isAvailable = selectedOption.dataset.available === 'true';
    
    const addToCartButton = select.closest('.product-card').querySelector('.product-card__add-to-cart');
    
    if (addToCartButton) {
      if (isAvailable) {
        addToCartButton.textContent = 'Add to Cart';
        addToCartButton.disabled = false;
        addToCartButton.style.opacity = '1';
      } else {
        addToCartButton.textContent = 'Sold Out';
        addToCartButton.disabled = true;
        addToCartButton.style.opacity = '0.5';
      }
    }
  }

  handleVariantPillClick(pill) {
    const pillContainer = pill.closest('.product-page__option-pills');
    const optionIndex = parseInt(pillContainer.dataset.optionIndex);
    const hiddenInput = document.querySelector(`input[data-option-index="${optionIndex}"]`);
    
    // Update active state
    pillContainer.querySelectorAll('.product-page__option-pill').forEach(p => {
      p.classList.remove('product-page__option-pill--active');
    });
    pill.classList.add('product-page__option-pill--active');
    
    // Update hidden input value
    if (hiddenInput) {
      hiddenInput.value = pill.dataset.optionValue;
    }
    
    // Update variant ID and availability
    this.updateVariantFromPills();
    
    // Update main image if variant has one
    if (pill.dataset.variantImage) {
      this.updateMainImage(pill.dataset.variantImage);
    }
  }

  updateVariantFromPills() {
    const form = document.querySelector('.product-page__form');
    if (!form) return;
    
    const variantIdInput = form.querySelector('#variant-id');
    const variantDataScript = document.getElementById('product-variants-json');
    
    if (!variantDataScript || !variantIdInput) return;
    
    try {
      const variantData = JSON.parse(variantDataScript.textContent);
      const hiddenInputs = form.querySelectorAll('input[data-option-index]');
      
      // Get current selected options
      const selectedOptions = {};
      hiddenInputs.forEach((input, index) => {
        selectedOptions[`option${index + 1}`] = input.value;
      });
      
      // Find matching variant
      const matchingVariant = variantData.variants.find(variant => {
        return Object.keys(selectedOptions).every(optionKey => {
          return variant[optionKey] === selectedOptions[optionKey];
        });
      });
      
      if (matchingVariant) {
        variantIdInput.value = matchingVariant.id;
        
        // Update add to cart button
        const addToCartButton = form.querySelector('.product-page__add-to-cart');
        if (addToCartButton) {
          if (matchingVariant.available) {
            addToCartButton.textContent = 'Add to Cart';
            addToCartButton.disabled = false;
            addToCartButton.style.opacity = '1';
            addToCartButton.dataset.variantId = matchingVariant.id;
          } else {
            addToCartButton.textContent = 'Sold Out';
            addToCartButton.disabled = true;
            addToCartButton.style.opacity = '0.5';
          }
        }
        
        // Update price if needed
        const priceElements = form.querySelectorAll('.product-page__price--regular, .product-page__price--sale');
        if (priceElements.length && matchingVariant.price) {
          // Update price display logic here if needed
        }
      }
    } catch (error) {
      console.error('Error parsing variant data:', error);
    }
  }

  updateMainImage(imageUrl) {
    const mainImage = document.getElementById('product-main-image');
    if (mainImage && imageUrl) {
      mainImage.src = imageUrl;
      
      // Update thumbnail active states to match
      this.updateThumbnailActiveState(imageUrl);
    }
  }

  updateThumbnailActiveState(imageUrl) {
    const thumbnails = document.querySelectorAll('.product-gallery__thumb');
    thumbnails.forEach(thumb => {
      thumb.classList.remove('product-gallery__thumb--active');
      if (thumb.dataset.imageUrl === imageUrl) {
        thumb.classList.add('product-gallery__thumb--active');
      }
    });
  }

  handleQuantityChange(button) {
    const action = button.dataset.action;
    const quantitySelector = button.closest('.quantity-selector');
    
    if (!quantitySelector) {
      console.warn('Quantity selector not found for button:', button);
      return;
    }
    
    const quantityInput = quantitySelector.querySelector('.quantity-input');
    
    if (!quantityInput) {
      console.warn('Quantity input not found in selector:', quantitySelector);
      return;
    }
    
    let currentQuantity = parseInt(quantityInput.value) || 1;
    
    if (action === 'increase') {
      currentQuantity++;
    } else if (action === 'decrease') {
      currentQuantity = Math.max(1, currentQuantity - 1);
    }
    
    quantityInput.value = currentQuantity;
  }

  handleGalleryThumbClick(thumb) {
    const imageUrl = thumb.dataset.imageUrl;
    const mainImage = document.getElementById('product-main-image');
    
    if (mainImage && imageUrl) {
      mainImage.src = imageUrl;
      
      // Update active state
      document.querySelectorAll('.product-gallery__thumb').forEach(t => t.classList.remove('product-gallery__thumb--active'));
      thumb.classList.add('product-gallery__thumb--active');
      
      // Update variant pills to match the selected image
      this.updateVariantPillsFromImage(imageUrl);
    }
  }

  updateVariantPillsFromImage(imageUrl) {
    // Find variant pill that matches this image
    const variantPills = document.querySelectorAll('.product-page__option-pill[data-variant-image]');
    
    variantPills.forEach(pill => {
      if (pill.dataset.variantImage === imageUrl && !pill.disabled) {
        pill.click();
      }
    });
  }

  updateVariantId(select) {
    const form = select.closest('.product-page__form');
    const variantIdInput = form.querySelector('#variant-id');
    const variantDataScript = document.getElementById('product-variants-json');
    
    if (!variantDataScript || !variantIdInput) return;
    
    try {
      const variantData = JSON.parse(variantDataScript.textContent);
      const allSelects = form.querySelectorAll('.product-page__variant-select');
      
      // Get current selected options
      const selectedOptions = {};
      allSelects.forEach((sel, index) => {
        selectedOptions[`option${index + 1}`] = sel.value;
      });
      
      // Find matching variant
      const matchingVariant = variantData.variants.find(variant => {
        return Object.keys(selectedOptions).every(optionKey => {
          return variant[optionKey] === selectedOptions[optionKey];
        });
      });
      
      if (matchingVariant) {
        variantIdInput.value = matchingVariant.id;
        
        // Update add to cart button
        const addToCartButton = form.querySelector('.product-page__add-to-cart');
        if (addToCartButton) {
          if (matchingVariant.available) {
            addToCartButton.textContent = 'Add to Cart';
            addToCartButton.disabled = false;
            addToCartButton.style.opacity = '1';
            addToCartButton.dataset.variantId = matchingVariant.id;
          } else {
            addToCartButton.textContent = 'Sold Out';
            addToCartButton.disabled = true;
            addToCartButton.style.opacity = '0.5';
          }
        }
        
        // Update price if needed
        const priceElements = form.querySelectorAll('.product-page__price--regular, .product-page__price--sale');
        if (priceElements.length && matchingVariant.price) {
          // Update price display logic here if needed
        }
      }
    } catch (error) {
      console.error('Error parsing variant data:', error);
    }
  }

  getCurrentCartTotal() {
    // Get current total from CartJS if available
    if (typeof CartJS !== 'undefined' && CartJS.cart && CartJS.cart.items) {
      return CartJS.cart.items.reduce((total, item) => total + item.quantity, 0);
    }
    
    // Fallback: count from cart badge
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
      return parseInt(cartBadge.textContent) || 0;
    }
    
    return 0;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `product-notification product-notification--${type}`;
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

// Initialize product forms when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProductForms();
});

// Export for use in other scripts
window.ProductForms = ProductForms; 