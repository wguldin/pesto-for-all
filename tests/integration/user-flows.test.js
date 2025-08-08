// Integration Tests - Full User Flows
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

describe('User Flows Integration', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Setup complete page structure
    document.body.innerHTML = `
      <!-- Navigation -->
      <nav class="nav">
        <button class="nav__hamburger" aria-expanded="false">
          <span class="nav__hamburger-bar"></span>
          <span class="nav__hamburger-bar"></span>
          <span class="nav__hamburger-bar"></span>
        </button>
        <button class="nav__cart" aria-expanded="false">
          Cart (<span id="cart-count" style="display: none;">0</span>)
        </button>
      </nav>

      <!-- Mobile Menu -->
      <div id="mobile-menu" class="mobile-menu" aria-hidden="true">
        <button class="mobile-menu__close">×</button>
        <nav class="mobile-menu__links">
          <a href="/">Home</a>
          <a href="/products">Products</a>
        </nav>
      </div>

      <!-- Product Page -->
      <form class="product-page__form" data-product-form="123">
        <input type="hidden" name="id" value="456" id="variant-id">
        
        <!-- Variant Selection -->
        <div class="product-page__option-pills" data-option-index="0">
          <button type="button" class="product-page__option-pill product-page__option-pill--active" 
                  data-option-value="Small" data-variant-image="/small.jpg">Small</button>
          <button type="button" class="product-page__option-pill" 
                  data-option-value="Large" data-variant-image="/large.jpg">Large</button>
        </div>
        <input type="hidden" name="options[Size]" value="Small" data-option-index="0">
        
        <!-- Gallery -->
        <div class="product-gallery">
          <img id="product-main-image" src="/small.jpg" alt="Product">
          <div class="product-gallery__thumbs">
            <button class="product-gallery__thumb product-gallery__thumb--active" 
                    data-image-url="/small.jpg">
              <img src="/small-thumb.jpg" alt="Small">
            </button>
            <button class="product-gallery__thumb" data-image-url="/large.jpg">
              <img src="/large-thumb.jpg" alt="Large">
            </button>
          </div>
        </div>
        
        <!-- Quantity & Add to Cart -->
        <div class="product-page__add-to-cart-row">
          <div class="quantity-selector">
            <button type="button" class="quantity-btn quantity-btn--minus" data-action="decrease">-</button>
            <input type="number" name="quantity" value="1" min="1" class="quantity-input">
            <button type="button" class="quantity-btn quantity-btn--plus" data-action="increase">+</button>
          </div>
          <button type="submit" class="button button--primary product-page__add-to-cart" 
                  data-price="2000" data-variant-id="456">
            <span>Add to Cart</span>
            <span>&nbsp;•&nbsp;</span>
            <span class="cart-price">$20.00</span>
          </button>
        </div>
      </form>

      <!-- Cart Flyout -->
      <div id="cart-flyout" class="cart-flyout" aria-hidden="true">
        <div class="cart-flyout__header">
          <h3 class="cart-flyout__title">Your Cart</h3>
          <button class="cart-flyout__close">×</button>
        </div>
        <div class="cart-flyout__content">
          <div id="cart-items"></div>
          <div class="cart-flyout__footer">
            <div class="cart-flyout__subtotal">
              Total: <span class="cart-flyout__subtotal-amount">$0.00</span>
            </div>
            <a href="/checkout" class="cart-flyout__checkout button">Checkout</a>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div id="waitlist-modal" class="modal">
        <div class="modal__overlay">
          <div class="modal__container">
            <button data-modal-close>×</button>
            <div class="modal__form-content">
              <form>
                <input type="email" name="email" placeholder="Enter email" required>
                <button type="submit">Join Waitlist</button>
              </form>
            </div>
            <div class="modal__success-content" style="display: none;">
              <p>Success! You've been added to the waitlist.</p>
            </div>
          </div>
        </div>
      </div>
      <button data-modal-open="waitlist-modal">Join Waitlist</button>

      <!-- Variant Data -->
      <script type="application/json" id="product-variants-json">
      {
        "variants": [
          {
            "id": 456,
            "title": "Small",
            "available": true,
            "price": 2000,
            "option1": "Small"
          },
          {
            "id": 789,
            "title": "Large", 
            "available": true,
            "price": 3000,
            "option1": "Large"
          }
        ]
      }
      </script>
    `;

    // Initialize all modules
    global.window.addToCart = vi.fn().mockResolvedValue(true);
    require('../../assets/modal.js');
    require('../../assets/products.js');
    require('../../assets/cart.js');
  });

  describe('Complete Purchase Flow', () => {
    it('should allow user to select variant, adjust quantity, and add to cart', async () => {
      // 1. Select Large variant
      const largeVariant = screen.getByText('Large');
      await user.click(largeVariant);
      
      // Verify variant selection updated
      expect(largeVariant).toHaveClass('product-page__option-pill--active');
      expect(screen.getByDisplayValue('Large')).toBeInTheDocument();
      
      // 2. Increase quantity
      const plusButton = screen.getByText('+');
      await user.click(plusButton);
      
      const quantityInput = screen.getByDisplayValue('2');
      expect(quantityInput).toBeInTheDocument();
      
      // 3. Verify price updated
      await waitFor(() => {
        expect(screen.getByText('$60.00')).toBeInTheDocument(); // $30 * 2
      });
      
      // 4. Add to cart
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      await user.click(addToCartButton);
      
      // 5. Verify addToCart called with correct params
      await waitFor(() => {
        expect(global.window.addToCart).toHaveBeenCalledWith('789', 2);
      });
    });

    it('should update main image when gallery thumbnails are clicked', async () => {
      const thumbnails = screen.getAllByRole('button', { name: /small|large/i });
      const mainImage = document.getElementById('product-main-image');
      
      // Click large thumbnail
      await user.click(thumbnails[1]);
      
      expect(mainImage.src).toBe('http://localhost:3000/large.jpg');
      expect(thumbnails[1]).toHaveClass('product-gallery__thumb--active');
    });

    it('should synchronize variant selection with gallery', async () => {
      const largeVariant = screen.getByText('Large');
      const mainImage = document.getElementById('product-main-image');
      
      // Select Large variant
      await user.click(largeVariant);
      
      // Main image should update to Large
      await waitFor(() => {
        expect(mainImage.src).toBe('http://localhost:3000/large.jpg');
      });
    });
  });

  describe('Mobile Menu Flow', () => {
    it('should open and close mobile menu correctly', async () => {
      const hamburger = screen.getByRole('button', { name: /hamburger/i });
      const mobileMenu = document.getElementById('mobile-menu');
      
      // Open menu
      await user.click(hamburger);
      
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
      expect(hamburger).toHaveAttribute('aria-expanded', 'true');
      
      // Close menu
      const closeButton = mobileMenu.querySelector('.mobile-menu__close');
      await user.click(closeButton);
      
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should close mobile menu when clicking a link', async () => {
      const hamburger = screen.getByRole('button', { name: /hamburger/i });
      const mobileMenu = document.getElementById('mobile-menu');
      
      // Open menu
      await user.click(hamburger);
      
      // Click a menu link
      const homeLink = screen.getByRole('link', { name: /home/i });
      await user.click(homeLink);
      
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Cart Interaction Flow', () => {
    it('should open cart and manage quantities', async () => {
      // First add item to cart to have something to work with
      await global.window.cartManager?.updateCartContent({
        item_count: 1,
        items: [{
          key: 'test-key',
          title: 'Test Product',
          quantity: 1,
          final_price: 2000,
          image: '/test.jpg'
        }]
      });

      const cartButton = screen.getByRole('button', { name: /cart/i });
      const cartFlyout = document.getElementById('cart-flyout');
      
      // Open cart
      await user.click(cartButton);
      
      expect(cartFlyout).toHaveAttribute('aria-hidden', 'false');
      
      // Find quantity controls (they should be in the cart now)
      await waitFor(() => {
        const quantityButtons = screen.getAllByText('+');
        expect(quantityButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Modal Interaction Flow', () => {
    it('should open modal, fill form, and show success state', async () => {
      const openButton = screen.getByText('Join Waitlist');
      const modal = document.getElementById('waitlist-modal');
      
      // Open modal
      await user.click(openButton);
      
      expect(modal).toHaveClass('is-open');
      
      // Fill form
      const emailInput = screen.getByPlaceholderText('Enter email');
      await user.type(emailInput, 'test@example.com');
      
      // Submit form
      const submitButton = screen.getByText('Join Waitlist');
      await user.click(submitButton);
      
      // Success state should show
      await waitFor(() => {
        expect(screen.getByText(/success.*waitlist/i)).toBeInTheDocument();
      });
    });

    it('should close modal with escape key', async () => {
      const openButton = screen.getByText('Join Waitlist');
      const modal = document.getElementById('waitlist-modal');
      
      // Open modal
      await user.click(openButton);
      expect(modal).toHaveClass('is-open');
      
      // Press escape
      await user.keyboard('{Escape}');
      
      expect(modal).not.toHaveClass('is-open');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle rapid clicking gracefully', async () => {
      const plusButton = screen.getByText('+');
      
      // Rapidly click plus button
      await user.click(plusButton);
      await user.click(plusButton);
      await user.click(plusButton);
      
      const quantityInput = screen.getByRole('spinbutton');
      expect(parseInt(quantityInput.value)).toBe(4);
    });

    it('should prevent adding items when cart is full', async () => {
      // Mock cart to be at limit
      if (global.window.cartManager) {
        global.window.cartManager.getCurrentCartTotal = vi.fn().mockReturnValue(50);
      }
      
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      await user.click(addToCartButton);
      
      // Should not call addToCart
      expect(global.window.addToCart).not.toHaveBeenCalled();
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/cart is full/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors during add to cart', async () => {
      global.window.addToCart = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      await user.click(addToCartButton);
      
      // Button should be re-enabled after error
      await waitFor(() => {
        expect(addToCartButton.disabled).toBe(false);
        expect(addToCartButton.textContent).not.toBe('Adding...');
      });
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper focus management', async () => {
      const openButton = screen.getByText('Join Waitlist');
      
      // Open modal
      await user.click(openButton);
      
      // First focusable element should be focused
      const closeButton = screen.getByRole('button', { name: '×' });
      expect(document.activeElement).toBe(closeButton);
      
      // Tab to next element
      await user.tab();
      
      const emailInput = screen.getByPlaceholderText('Enter email');
      expect(document.activeElement).toBe(emailInput);
    });

    it('should have proper ARIA attributes', () => {
      const cartButton = screen.getByRole('button', { name: /cart/i });
      const cartFlyout = document.getElementById('cart-flyout');
      const mobileMenu = document.getElementById('mobile-menu');
      
      expect(cartButton).toHaveAttribute('aria-expanded', 'false');
      expect(cartFlyout).toHaveAttribute('aria-hidden', 'true');
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
    });
  });
});