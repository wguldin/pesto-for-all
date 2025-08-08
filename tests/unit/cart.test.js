// Cart Manager Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { loadThemeModule, initializeTestDOM } from '../helpers/load-modules.js';

describe('CartManager', () => {
  let mockCartData;

  beforeEach(async () => {
    mockCartData = {
      item_count: 2,
      total_price: 5000, // $50.00 in cents
      items: [
        {
          key: 'test-key-1',
          id: 123,
          title: 'Test Product',
          variant_title: 'Small',
          quantity: 1,
          price: 2000,
          final_price: 2000,
          image: '/test-image.jpg'
        },
        {
          key: 'test-key-2', 
          id: 124,
          title: 'Another Product',
          quantity: 1,
          price: 3000,
          final_price: 3000,
          image: '/test-image-2.jpg'
        }
      ]
    };

    // Initialize DOM
    initializeTestDOM();

    // Mock window.cartData
    global.window.cartData = mockCartData;

    // Load cart module
    try {
      loadThemeModule('cart');
    } catch (error) {
      // If loading fails, continue with mocked functionality
      console.warn('Cart module loading failed, using mocks:', error.message);
    }

    // Wait for any async initialization
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  describe('Initialization', () => {
    it('should initialize with correct DOM elements', async () => {
      // Wait for dependencies to load
      await waitFor(() => {
        expect(window.cartManager).toBeDefined();
      });

      expect(window.cartManager.cartFlyout).toBeDefined();
      expect(window.cartManager.cartButton).toBeDefined();
      expect(window.cartManager.cartCount).toBeDefined();
    });

    it('should handle missing dependencies gracefully', () => {
      // Remove CartJS to test error handling
      delete global.CartJS;
      
      expect(() => new CartManager()).not.toThrow();
    });
  });

  describe('Cart Opening/Closing', () => {
    beforeEach(async () => {
      await waitFor(() => {
        expect(window.cartManager).toBeDefined();
      });
    });

    it('should open cart when cart button is clicked', () => {
      const cartButton = screen.getByRole('button', { name: /cart/i });
      fireEvent.click(cartButton);

      const cartFlyout = document.getElementById('cart-flyout');
      expect(cartFlyout).toHaveAttribute('aria-hidden', 'false');
      expect(cartButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should close cart when close button is clicked', () => {
      window.cartManager.openCart();
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      const cartFlyout = document.getElementById('cart-flyout');
      expect(cartFlyout).toHaveAttribute('aria-hidden', 'true');
    });

    it('should close cart on Escape key', () => {
      window.cartManager.openCart();
      
      fireEvent.keyDown(document, { key: 'Escape' });

      const cartFlyout = document.getElementById('cart-flyout');
      expect(cartFlyout).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Cart Content Management', () => {
    beforeEach(async () => {
      await waitFor(() => {
        expect(window.cartManager).toBeDefined();
      });
    });

    it('should update cart count correctly', () => {
      window.cartManager.updateCartCount(5);
      
      const cartCount = document.getElementById('cart-count');
      expect(cartCount.textContent).toBe('5');
      expect(cartCount.style.display).toBe('flex');
    });

    it('should hide cart count when zero', () => {
      window.cartManager.updateCartCount(0);
      
      const cartCount = document.getElementById('cart-count');
      expect(cartCount.style.display).toBe('none');
    });

    it('should create cart item elements correctly', () => {
      const cartItem = window.cartManager.createCartItemElement(mockCartData.items[0]);
      
      expect(cartItem).toHaveClass('cart-item');
      expect(cartItem.dataset.itemKey).toBe('test-key-1');
      expect(cartItem.querySelector('.cart-item__title').textContent).toBe('Small');
      expect(cartItem.querySelector('.quantity-display').textContent).toBe('1');
    });

    it('should show empty cart message when no items', () => {
      window.cartManager.updateCartContent({ item_count: 0, items: [] });
      
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  describe('Quantity Management', () => {
    beforeEach(async () => {
      await waitFor(() => {
        expect(window.cartManager).toBeDefined();
      });

      // Add cart items to DOM
      const cartItems = document.getElementById('cart-items');
      cartItems.innerHTML = `
        <div class="cart-item" data-item-key="test-key-1">
          <div class="cart-item__quantity">
            <button class="quantity-btn quantity-btn--minus" data-item-key="test-key-1">-</button>
            <span class="quantity-display">2</span>
            <button class="quantity-btn quantity-btn--plus" data-item-key="test-key-1">+</button>
          </div>
        </div>
      `;
    });

    it('should increase quantity when plus button clicked', () => {
      const plusButton = screen.getByText('+');
      fireEvent.click(plusButton);

      // CartJS.updateItem should be called
      expect(global.CartJS.updateItem).toHaveBeenCalled();
    });

    it('should decrease quantity when minus button clicked', () => {
      const minusButton = screen.getByText('-');
      fireEvent.click(minusButton);

      expect(global.CartJS.updateItem).toHaveBeenCalled();
    });

    it('should enforce cart quantity limits', () => {
      // Mock getCurrentCartTotal to return 49 items
      window.cartManager.getCurrentCartTotal = vi.fn().mockReturnValue(49);
      
      const plusButton = screen.getByText('+');
      fireEvent.click(plusButton);

      // Should show notification about limit
      expect(screen.getByText(/cart cannot exceed 50 items/i)).toBeInTheDocument();
    });
  });

  describe('Money Formatting', () => {
    beforeEach(async () => {
      await waitFor(() => {
        expect(window.cartManager).toBeDefined();
      });
    });

    it('should format money correctly', () => {
      const formatted = window.cartManager.formatMoney(2500);
      expect(formatted).toBe('$25.00');
    });

    it('should handle zero correctly', () => {
      const formatted = window.cartManager.formatMoney(0);
      expect(formatted).toBe('$0.00');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await waitFor(() => {
        expect(window.cartManager).toBeDefined();
      });
    });

    it('should handle addToCart errors gracefully', async () => {
      // Mock CartJS to throw error
      global.CartJS.addItem.mockImplementation((id, qty, props, callbacks) => {
        callbacks.error({ responseText: '{"message": "Product not available"}' });
      });

      await expect(
        window.cartManager.addToCart(123, 1)
      ).rejects.toThrow();
    });

    it('should show error notifications', async () => {
      window.cartManager.showNotification('Test error', 'error');

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });
  });
});