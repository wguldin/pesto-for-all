// Product Forms Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';

describe('ProductForms', () => {
  let productForms;

  beforeEach(() => {
    // Setup product page DOM
    document.body.innerHTML = `
      <form class="product-page__form" data-product-form="123">
        <input type="hidden" name="id" value="456" id="variant-id">
        <div class="quantity-selector">
          <button type="button" class="quantity-btn quantity-btn--minus" data-action="decrease">-</button>
          <input type="number" name="quantity" value="1" min="1" class="quantity-input">
          <button type="button" class="quantity-btn quantity-btn--plus" data-action="increase">+</button>
        </div>
        <div class="product-page__add-to-cart-row">
          <button type="submit" class="button button--primary product-page__add-to-cart" 
                  data-price="2000">
            <span>Add to Cart</span>
            <span>&nbsp;•&nbsp;</span>
            <span class="cart-price">$20.00</span>
          </button>
        </div>
      </form>
      
      <div class="product-gallery">
        <button class="product-gallery__thumb product-gallery__thumb--active" 
                data-image-url="/image1.jpg">
          <img src="/thumb1.jpg" alt="Product">
        </button>
        <button class="product-gallery__thumb" data-image-url="/image2.jpg">
          <img src="/thumb2.jpg" alt="Product">
        </button>
      </div>
      
      <img id="product-main-image" src="/image1.jpg" alt="Main product">
      
      <script type="application/json" id="product-variants-json">
      {
        "variants": [
          {
            "id": 456,
            "title": "Test Variant",
            "available": true,
            "price": 2000,
            "option1": "Small",
            "option2": null,
            "option3": null
          }
        ]
      }
      </script>
    `;

    // Mock global addToCart
    global.window.addToCart = vi.fn().mockResolvedValue(true);

    // Load ProductForms
    require('../../assets/products.js');
    productForms = new ProductForms();
  });

  describe('Initialization', () => {
    it('should bind event listeners correctly', () => {
      expect(productForms).toBeDefined();
      // Event listeners are bound, but we can't directly test them
      // We'll test their functionality instead
    });
  });

  describe('Form Submission', () => {
    it('should handle product form submission', async () => {
      const form = screen.getByRole('form');
      const submitEvent = new Event('submit', { bubbles: true });
      
      fireEvent(form, submitEvent);

      await waitFor(() => {
        expect(global.window.addToCart).toHaveBeenCalledWith('456', 1);
      });
    });

    it('should prevent submission without variant ID', () => {
      const form = screen.getByRole('form');
      const variantInput = document.getElementById('variant-id');
      variantInput.value = '';

      const submitEvent = new Event('submit', { bubbles: true });
      fireEvent(form, submitEvent);

      expect(global.window.addToCart).not.toHaveBeenCalled();
    });

    it('should disable button during submission', async () => {
      const form = screen.getByRole('form');
      const submitButton = screen.getByRole('button', { name: /add to cart/i });
      
      const submitEvent = new Event('submit', { bubbles: true });
      fireEvent(form, submitEvent);

      expect(submitButton.disabled).toBe(true);
      expect(submitButton.textContent).toBe('Adding...');
    });

    it('should respect quantity limits', () => {
      // Mock getCurrentCartTotal to return 50 items
      productForms.getCurrentCartTotal = vi.fn().mockReturnValue(50);
      
      const form = screen.getByRole('form');
      const submitEvent = new Event('submit', { bubbles: true });
      fireEvent(form, submitEvent);

      expect(global.window.addToCart).not.toHaveBeenCalled();
    });
  });

  describe('Quantity Management', () => {
    it('should increase quantity when plus button clicked', () => {
      const quantityInput = screen.getByDisplayValue('1');
      const plusButton = screen.getByText('+');
      
      fireEvent.click(plusButton);
      
      expect(quantityInput.value).toBe('2');
    });

    it('should decrease quantity when minus button clicked', () => {
      const quantityInput = screen.getByDisplayValue('1');
      quantityInput.value = '2';
      
      const minusButton = screen.getByText('-');
      fireEvent.click(minusButton);
      
      expect(quantityInput.value).toBe('1');
    });

    it('should not decrease quantity below 1', () => {
      const quantityInput = screen.getByDisplayValue('1');
      const minusButton = screen.getByText('-');
      
      fireEvent.click(minusButton);
      
      expect(quantityInput.value).toBe('1');
    });

    it('should update price when quantity changes via buttons', () => {
      const plusButton = screen.getByText('+');
      const priceSpan = screen.getByText('$20.00');
      
      fireEvent.click(plusButton);
      
      expect(priceSpan.textContent).toBe('$40.00');
    });

    it('should update price when quantity input changes directly', () => {
      const quantityInput = screen.getByDisplayValue('1');
      const priceSpan = screen.getByText('$20.00');
      
      fireEvent.input(quantityInput, { target: { value: '3' } });
      
      expect(priceSpan.textContent).toBe('$60.00');
    });

    it('should enforce minimum quantity of 1 for direct input', () => {
      const quantityInput = screen.getByDisplayValue('1');
      
      fireEvent.input(quantityInput, { target: { value: '0' } });
      
      expect(quantityInput.value).toBe('1');
    });
  });

  describe('Gallery Management', () => {
    it('should update main image when thumbnail clicked', () => {
      const thumb2 = screen.getByRole('button', { name: /product/i });
      const thumbs = screen.getAllByRole('button', { name: /product/i });
      const mainImage = document.getElementById('product-main-image');
      
      // Click the second thumbnail
      fireEvent.click(thumbs[1]);
      
      expect(mainImage.src).toBe('http://localhost:3000/image2.jpg');
      expect(thumbs[1]).toHaveClass('product-gallery__thumb--active');
      expect(thumbs[0]).not.toHaveClass('product-gallery__thumb--active');
    });
  });

  describe('Utility Functions', () => {
    it('should get current cart total from CartJS', () => {
      global.CartJS.cart = {
        items: [
          { quantity: 2 },
          { quantity: 3 }
        ]
      };

      const total = productForms.getCurrentCartTotal();
      expect(total).toBe(5);
    });

    it('should fall back to cart badge when CartJS unavailable', () => {
      delete global.CartJS;
      const cartBadge = document.createElement('span');
      cartBadge.id = 'cart-count';
      cartBadge.textContent = '7';
      document.body.appendChild(cartBadge);

      const total = productForms.getCurrentCartTotal();
      expect(total).toBe(7);
    });

    it('should return 0 when no cart data available', () => {
      delete global.CartJS;
      
      const total = productForms.getCurrentCartTotal();
      expect(total).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle form submission errors gracefully', () => {
      global.window.addToCart = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const form = screen.getByRole('form');
      const submitEvent = new Event('submit', { bubbles: true });
      
      expect(() => fireEvent(form, submitEvent)).not.toThrow();
    });

    it('should show notifications for errors', async () => {
      productForms.showNotification('Test error', 'error');

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });
  });

  describe('Price Formatting', () => {
    it('should format prices correctly in USD', () => {
      const quantityInput = screen.getByDisplayValue('1');
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      addToCartButton.dataset.price = '2500'; // $25.00

      fireEvent.input(quantityInput, { target: { value: '2' } });

      const priceSpan = addToCartButton.querySelector('.cart-price');
      expect(priceSpan.textContent).toBe('$50.00');
    });
  });
});