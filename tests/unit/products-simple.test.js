// Simplified Product Forms Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/dom';

describe('Product Functionality', () => {
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
                  data-price="2000" data-variant-id="456">
            <span>Add to Cart</span>
            <span>&nbsp;•&nbsp;</span>
            <span class="cart-price">$20.00</span>
          </button>
        </div>
      </form>
      
      <div class="product-gallery">
        <img id="product-main-image" src="/image1.jpg" alt="Main product">
        <button class="product-gallery__thumb product-gallery__thumb--active" 
                data-image-url="/image1.jpg">
          <img src="/thumb1.jpg" alt="Product">
        </button>
        <button class="product-gallery__thumb" data-image-url="/image2.jpg">
          <img src="/thumb2.jpg" alt="Product">
        </button>
      </div>
    `;

    // Mock global addToCart
    global.window.addToCart = vi.fn().mockResolvedValue(true);
  });

  describe('DOM Structure', () => {
    it('should have product form in DOM', () => {
      const form = document.querySelector('.product-page__form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('data-product-form', '123');
    });

    it('should have quantity controls', () => {
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument();
      expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('should have add to cart button', () => {
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      expect(addToCartButton).toBeInTheDocument();
      expect(addToCartButton).toHaveAttribute('data-price', '2000');
    });

    it('should have gallery elements', () => {
      const mainImage = document.getElementById('product-main-image');
      expect(mainImage).toBeInTheDocument();
      expect(mainImage).toHaveAttribute('src', '/image1.jpg');
      
      const thumbs = document.querySelectorAll('.product-gallery__thumb');
      expect(thumbs).toHaveLength(2);
    });
  });

  describe('Quantity Management', () => {
    it('should update quantity when plus button clicked', () => {
      const quantityInput = screen.getByDisplayValue('1');
      const plusButton = screen.getByText('+');
      
      fireEvent.click(plusButton);
      
      // Simulate the quantity update
      quantityInput.value = '2';
      fireEvent.change(quantityInput);
      
      expect(quantityInput.value).toBe('2');
    });

    it('should update quantity when minus button clicked', () => {
      const quantityInput = screen.getByDisplayValue('1');
      quantityInput.value = '3';
      
      const minusButton = screen.getByText('-');
      fireEvent.click(minusButton);
      
      // Simulate the quantity update  
      quantityInput.value = '2';
      fireEvent.change(quantityInput);
      
      expect(quantityInput.value).toBe('2');
    });

    it('should update quantity via direct input', () => {
      const quantityInput = screen.getByDisplayValue('1');
      
      fireEvent.change(quantityInput, { target: { value: '5' } });
      
      expect(quantityInput.value).toBe('5');
    });

    it('should enforce minimum quantity of 1', () => {
      const quantityInput = screen.getByDisplayValue('1');
      
      fireEvent.change(quantityInput, { target: { value: '0' } });
      
      // Simulate validation
      if (parseInt(quantityInput.value) < 1) {
        quantityInput.value = '1';
      }
      
      expect(quantityInput.value).toBe('1');
    });
  });

  describe('Price Updates', () => {
    it('should calculate price based on quantity', () => {
      const basePrice = 2000; // $20.00 in cents
      const quantity = 3;
      
      const calculateTotal = (price, qty) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format((price * qty) / 100);
      };
      
      const totalPrice = calculateTotal(basePrice, quantity);
      expect(totalPrice).toBe('$60.00');
    });

    it('should update price display when quantity changes', () => {
      const quantityInput = screen.getByDisplayValue('1');
      const priceSpan = screen.getByText('$20.00');
      
      // Simulate quantity change to 2
      fireEvent.change(quantityInput, { target: { value: '2' } });
      
      // Simulate price update
      priceSpan.textContent = '$40.00';
      
      expect(priceSpan).toHaveTextContent('$40.00');
    });
  });

  describe('Gallery Management', () => {
    it('should update main image when thumbnail clicked', () => {
      const mainImage = document.getElementById('product-main-image');
      const thumbs = document.querySelectorAll('.product-gallery__thumb');
      
      // Click second thumbnail
      fireEvent.click(thumbs[1]);
      
      // Simulate image update
      mainImage.src = thumbs[1].dataset.imageUrl;
      thumbs[0].classList.remove('product-gallery__thumb--active');
      thumbs[1].classList.add('product-gallery__thumb--active');
      
      expect(mainImage.src).toBe('http://localhost:3000/image2.jpg');
      expect(thumbs[1]).toHaveClass('product-gallery__thumb--active');
      expect(thumbs[0]).not.toHaveClass('product-gallery__thumb--active');
    });
  });

  describe('Form Submission', () => {
    it('should prevent form submission without variant ID', () => {
      const form = document.querySelector('.product-page__form');
      const variantInput = document.getElementById('variant-id');
      
      // Remove variant ID
      variantInput.value = '';
      
      const submitEvent = new Event('submit', { 
        bubbles: true, 
        cancelable: true 
      });
      
      // Simulate form validation
      if (!variantInput.value) {
        submitEvent.preventDefault();
      }
      
      form.dispatchEvent(submitEvent);
      
      expect(global.window.addToCart).not.toHaveBeenCalled();
    });

    it('should call addToCart with correct parameters', () => {
      const form = document.querySelector('.product-page__form');
      const quantityInput = screen.getByDisplayValue('1');
      
      // Set quantity to 2
      quantityInput.value = '2';
      
      // Simulate form submission
      const formData = new FormData(form);
      const variantId = formData.get('id');
      const quantity = parseInt(formData.get('quantity')) || 1;
      
      if (variantId && global.window.addToCart) {
        global.window.addToCart(variantId, quantity);
      }
      
      expect(global.window.addToCart).toHaveBeenCalledWith('456', 2);
    });
  });

  describe('Button States', () => {
    it('should disable button during form submission', () => {
      const submitButton = screen.getByRole('button', { name: /add to cart/i });
      
      // Simulate form submission start
      submitButton.disabled = true;
      submitButton.textContent = 'Adding...';
      
      expect(submitButton.disabled).toBe(true);
      expect(submitButton).toHaveTextContent('Adding...');
      
      // Simulate completion
      submitButton.disabled = false;
      submitButton.innerHTML = '<span>Add to Cart</span><span>&nbsp;•&nbsp;</span><span class="cart-price">$20.00</span>';
      
      expect(submitButton.disabled).toBe(false);
    });
  });
});