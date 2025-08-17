/**
 * Product Cards Enhancement
 * Makes entire product cards clickable while preserving button functionality
 * Only the title contains the actual link, but clicking anywhere on the card triggers navigation
 */

class ProductCards {
  constructor() {
    this.init();
  }

  init() {
    this.setupCardClickHandlers();
    if (Config?.debug?.enabled) {
      console.log('Product Cards enhanced with click delegation');
    }
  }

  setupCardClickHandlers() {
    document.addEventListener('click', (e) => {
      // Don't trigger if clicking on buttons, forms, or links
      if (e.target.closest('button, .button, form, input, a')) {
        return;
      }

      // Find the closest product card
      const productCard = e.target.closest('.product-card, .compact-product-card, .block-product');
      if (!productCard) {
        return;
      }

      // Get the product URL from data attribute or find the title link
      let productUrl = productCard.dataset.productUrl;
      if (!productUrl) {
        const titleLink = productCard.querySelector('.product-card__title a, .compact-product-card__title a, .block-product__title a');
        if (titleLink) {
          productUrl = titleLink.href;
        }
      }

      if (productUrl) {
        // Navigate to product page
        window.location.href = productUrl;
      }
    });

    // Add visual feedback for card hovering
    this.addHoverEffects();
  }

  addHoverEffects() {
    // Add cursor pointer to cards but not to buttons
    const style = document.createElement('style');
    style.textContent = `
      .product-card:not(:has(button:hover)):not(:has(.button:hover)):not(:has(a:hover)):not(:has(form:hover)) {
        cursor: pointer;
      }
      .compact-product-card:not(:has(button:hover)):not(:has(.button:hover)):not(:has(a:hover)):not(:has(form:hover)) {
        cursor: pointer;
      }
      .block-product:not(:has(button:hover)):not(:has(.button:hover)):not(:has(a:hover)):not(:has(form:hover)) {
        cursor: pointer;
      }
      
      /* Fallback for browsers that don't support :has() */
      .product-card, .compact-product-card, .block-product {
        cursor: pointer;
      }
      .product-card button, .product-card .button, .product-card a, .product-card form,
      .compact-product-card button, .compact-product-card .button, .compact-product-card a, .compact-product-card form,
      .block-product button, .block-product .button, .block-product a, .block-product form {
        cursor: default;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProductCards();
  });
} else {
  new ProductCards();
}

// Export for potential external use
window.ProductCards = ProductCards;