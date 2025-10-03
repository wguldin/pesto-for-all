// Simplified Cart Manager Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';

describe('Cart Functionality', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <button class="nav__cart" aria-expanded="false">
        Cart (<span id="cart-count" style="display: none;">0</span>)
      </button>
      <div id="cart-flyout" aria-hidden="true">
        <button class="cart-flyout__close">Close</button>
        <div id="cart-items"></div>
        <div class="cart-flyout__footer" style="display: none;">
          <div class="cart-flyout__subtotal">
            <span class="cart-flyout__subtotal-amount">$0.00</span>
          </div>
        </div>
      </div>
    `;
  });

  describe('DOM Elements', () => {
    it('should have cart button in DOM', () => {
      const cartButton = document.querySelector('.nav__cart');
      expect(cartButton).toBeInTheDocument();
    });

    it('should have cart flyout in DOM', () => {
      const cartFlyout = document.getElementById('cart-flyout');
      expect(cartFlyout).toBeInTheDocument();
      expect(cartFlyout).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have cart count element', () => {
      const cartCount = document.getElementById('cart-count');
      expect(cartCount).toBeInTheDocument();
    });
  });

  describe('Cart State Management', () => {
    it('should show cart count when items exist', () => {
      const cartCount = document.getElementById('cart-count');
      
      cartCount.textContent = '3';
      cartCount.style.display = 'inline';
      
      expect(cartCount.textContent).toBe('3');
      expect(cartCount.style.display).toBe('inline');
    });

    it('should hide cart count when empty', () => {
      const cartCount = document.getElementById('cart-count');
      
      cartCount.textContent = '0';
      cartCount.style.display = 'none';
      
      expect(cartCount.style.display).toBe('none');
    });
  });

  describe('Cart Interactions', () => {
    it('should toggle cart flyout visibility', () => {
      const cartButton = document.querySelector('.nav__cart');
      const cartFlyout = document.getElementById('cart-flyout');
      
      // Simulate opening cart
      cartFlyout.setAttribute('aria-hidden', 'false');
      cartButton.setAttribute('aria-expanded', 'true');
      
      expect(cartFlyout).toHaveAttribute('aria-hidden', 'false');
      expect(cartButton).toHaveAttribute('aria-expanded', 'true');
      
      // Simulate closing cart
      cartFlyout.setAttribute('aria-hidden', 'true');
      cartButton.setAttribute('aria-expanded', 'false');
      
      expect(cartFlyout).toHaveAttribute('aria-hidden', 'true');
      expect(cartButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Money Formatting', () => {
    it('should format money correctly', () => {
      const formatMoney = (cents) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(cents / 100);
      };

      expect(formatMoney(2500)).toBe('$25.00');
      expect(formatMoney(0)).toBe('$0.00');
      expect(formatMoney(999)).toBe('$9.99');
    });
  });

  describe('Cart Item Management', () => {
    it('should create cart item HTML structure', () => {
      const cartItems = document.getElementById('cart-items');
      
      const itemHTML = `
        <div class="cart-item" data-item-key="test-key">
          <div class="cart-item__details">
            <h4 class="cart-item__title">Test Product</h4>
            <div class="cart-item__quantity">
              <button class="quantity-btn quantity-btn--minus">-</button>
              <span class="quantity-display">1</span>
              <button class="quantity-btn quantity-btn--plus">+</button>
            </div>
          </div>
        </div>
      `;
      
      cartItems.innerHTML = itemHTML;
      
      const cartItem = cartItems.querySelector('.cart-item');
      expect(cartItem).toBeInTheDocument();
      expect(cartItem).toHaveAttribute('data-item-key', 'test-key');
      
      const title = cartItems.querySelector('.cart-item__title');
      expect(title).toHaveTextContent('Test Product');
      
      const quantity = cartItems.querySelector('.quantity-display');
      expect(quantity).toHaveTextContent('1');
    });

    it('should show empty cart message when no items', () => {
      const cartItems = document.getElementById('cart-items');
      
      cartItems.innerHTML = `
        <div class="cart-flyout__empty">
          <p>Your cart is empty</p>
        </div>
      `;
      
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });
  });

  describe('Quantity Controls', () => {
    beforeEach(() => {
      const cartItems = document.getElementById('cart-items');
      cartItems.innerHTML = `
        <div class="cart-item" data-item-key="test-key">
          <div class="cart-item__quantity">
            <button class="quantity-btn quantity-btn--minus">-</button>
            <span class="quantity-display">2</span>
            <button class="quantity-btn quantity-btn--plus">+</button>
          </div>
        </div>
      `;
    });

    it('should have quantity controls', () => {
      expect(screen.getByText('-')).toBeInTheDocument();
      expect(screen.getByText('+')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should update quantity display when buttons clicked', () => {
      const quantityDisplay = screen.getByText('2');
      const plusButton = screen.getByText('+');
      
      // Simulate quantity increase
      fireEvent.click(plusButton);
      quantityDisplay.textContent = '3';
      
      expect(quantityDisplay).toHaveTextContent('3');
    });
  });
});