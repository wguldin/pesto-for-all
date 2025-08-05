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
    const productId = select.dataset.productId;
    const selectedOption = select.options[select.selectedIndex];
    const isAvailable = selectedOption.dataset.available === 'true';
    
    const addToCartButton = select.closest('.product-card, .product-page__details').querySelector('.product-card__add-to-cart, .product-page__add-to-cart');
    
    if (isAvailable) {
      addToCartButton.textContent = 'Add to Cart';
      addToCartButton.disabled = false;
      addToCartButton.style.opacity = '1';
    } else {
      addToCartButton.textContent = 'Sold Out';
      addToCartButton.disabled = true;
      addToCartButton.style.opacity = '0.5';
    }

    // Update variant ID for product page forms
    if (select.closest('.product-page__form')) {
      this.updateVariantId(select);
    }
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
    }
  }

  updateVariantId(select) {
    // This would need to be implemented based on your product variant structure
    // For now, we'll use the first available variant
    const variantIdInput = select.closest('.product-page__form').querySelector('#variant-id');
    if (variantIdInput) {
      // You might need to implement logic to find the correct variant ID based on selected options
      // This is a simplified version
      const selectedVariant = select.value;
      // You would typically have a mapping of option combinations to variant IDs
      // For now, we'll keep the current variant ID
    }
  }
}

// Initialize product forms when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProductForms();
});

// Export for use in other scripts
window.ProductForms = ProductForms; 