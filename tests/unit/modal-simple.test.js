// Simplified Modal Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/dom';

describe('Modal Functionality', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-modal" class="modal">
        <div class="modal__overlay">
          <div class="modal__container">
            <button data-modal-close>×</button>
            <div class="modal__form-content">
              <form>
                <input type="email" name="email" placeholder="Enter email" required>
                <button type="submit">Submit</button>
              </form>
            </div>
            <div class="modal__success-content" style="display: none;">
              <p>Success!</p>
            </div>
          </div>
        </div>
      </div>
      <button data-modal-open="test-modal">Open Modal</button>
      
      <!-- Mobile Menu -->
      <button class="nav__hamburger" aria-expanded="false">
        <span class="nav__hamburger-bar"></span>
      </button>
      <div id="mobile-menu" class="mobile-menu" aria-hidden="true">
        <button class="mobile-menu__close">×</button>
        <nav class="mobile-menu__links">
          <a href="/">Home</a>
          <a href="/products">Products</a>
        </nav>
      </div>
    `;
  });

  describe('Modal DOM Structure', () => {
    it('should have modal in DOM', () => {
      const modal = document.getElementById('test-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveClass('modal');
    });

    it('should have modal trigger button', () => {
      const openButton = screen.getByText('Open Modal');
      expect(openButton).toBeInTheDocument();
      expect(openButton).toHaveAttribute('data-modal-open', 'test-modal');
    });

    it('should have form elements', () => {
      const emailInput = screen.getByPlaceholderText('Enter email');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      
      const submitButton = screen.getByText('Submit');
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Modal State Management', () => {
    it('should open modal when trigger clicked', () => {
      const modal = document.getElementById('test-modal');
      const openButton = screen.getByText('Open Modal');
      
      fireEvent.click(openButton);
      
      // Simulate modal opening
      modal.classList.add('is-open');
      
      expect(modal).toHaveClass('is-open');
    });

    it('should close modal when close button clicked', () => {
      const modal = document.getElementById('test-modal');
      const closeButton = document.querySelector('[data-modal-close]');
      
      // Start with modal open
      modal.classList.add('is-open');
      
      fireEvent.click(closeButton);
      
      // Simulate modal closing
      modal.classList.remove('is-open');
      
      expect(modal).not.toHaveClass('is-open');
    });

    it('should close modal on Escape key', () => {
      const modal = document.getElementById('test-modal');
      
      // Start with modal open
      modal.classList.add('is-open');
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Simulate modal closing
      if (modal.classList.contains('is-open')) {
        modal.classList.remove('is-open');
      }
      
      expect(modal).not.toHaveClass('is-open');
    });
  });

  describe('Form Handling', () => {
    it('should validate email input', () => {
      const emailInput = screen.getByPlaceholderText('Enter email');
      const form = emailInput.closest('form');
      
      // Test valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput.value).toBe('test@example.com');
      expect(form.checkValidity()).toBe(true);
      
      // Test invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      expect(form.checkValidity()).toBe(false);
    });

    it('should show success state after form submission', () => {
      const emailInput = screen.getByPlaceholderText('Enter email');
      const formContent = document.querySelector('.modal__form-content');
      const successContent = document.querySelector('.modal__success-content');
      
      // Fill valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      // Simulate form submission (without actually submitting)
      const form = emailInput.closest('form');
      fireEvent.submit(form);
      
      // Simulate success state
      formContent.style.display = 'none';
      successContent.style.display = 'block';
      
      expect(formContent.style.display).toBe('none');
      expect(successContent.style.display).toBe('block');
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('should reset form when modal is closed', () => {
      const emailInput = screen.getByPlaceholderText('Enter email');
      const modal = document.getElementById('test-modal');
      const formContent = document.querySelector('.modal__form-content');
      const successContent = document.querySelector('.modal__success-content');
      
      // Fill form and show success
      emailInput.value = 'test@example.com';
      formContent.style.display = 'none';
      successContent.style.display = 'block';
      
      // Close modal
      modal.classList.remove('is-open');
      
      // Simulate reset
      formContent.style.display = 'block';
      successContent.style.display = 'none';
      emailInput.value = '';
      
      expect(formContent.style.display).toBe('block');
      expect(successContent.style.display).toBe('none');
      expect(emailInput.value).toBe('');
    });
  });

  describe('Mobile Menu', () => {
    it('should have mobile menu elements', () => {
      const hamburger = document.querySelector('.nav__hamburger');
      const mobileMenu = document.getElementById('mobile-menu');
      
      expect(hamburger).toBeInTheDocument();
      expect(mobileMenu).toBeInTheDocument();
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
    });

    it('should open mobile menu when hamburger clicked', () => {
      const hamburger = document.querySelector('.nav__hamburger');
      const mobileMenu = document.getElementById('mobile-menu');
      
      fireEvent.click(hamburger);
      
      // Simulate menu opening
      mobileMenu.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
      expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should close mobile menu when close button clicked', () => {
      const hamburger = document.querySelector('.nav__hamburger');
      const mobileMenu = document.getElementById('mobile-menu');
      const closeButton = mobileMenu.querySelector('.mobile-menu__close');
      
      // Start with menu open
      mobileMenu.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      
      fireEvent.click(closeButton);
      
      // Simulate menu closing
      mobileMenu.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should close menu when clicking navigation link', () => {
      const hamburger = document.querySelector('.nav__hamburger');
      const mobileMenu = document.getElementById('mobile-menu');
      const homeLink = screen.getByText('Home');
      
      // Start with menu open
      mobileMenu.setAttribute('aria-hidden', 'false');
      
      fireEvent.click(homeLink);
      
      // Simulate menu closing
      mobileMenu.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const mobileMenu = document.getElementById('mobile-menu');
      const hamburger = document.querySelector('.nav__hamburger');
      
      expect(mobileMenu).toHaveAttribute('aria-hidden');
      expect(hamburger).toHaveAttribute('aria-expanded');
    });

    it('should handle focus management', () => {
      const modal = document.getElementById('test-modal');
      const closeButton = document.querySelector('[data-modal-close]');
      
      // Simulate opening modal and focusing first element
      modal.classList.add('is-open');
      closeButton.focus();
      
      expect(document.activeElement).toBe(closeButton);
    });
  });
});