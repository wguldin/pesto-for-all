// Modal Unit Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';

// Import the Modal class (you might need to adjust the import path)
// For now, we'll assume it's available globally after including the script

describe('Modal', () => {
  let modal;

  beforeEach(() => {
    // Setup DOM structure that Modal expects
    document.body.innerHTML = `
      <div id="test-modal" class="modal">
        <div class="modal__overlay">
          <div class="modal__container">
            <button data-modal-close>Close</button>
            <div class="modal__form-content">
              <form>
                <input type="email" name="email" required>
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
    `;

    // Load the Modal script
    require('../../assets/modal.js');
    
    // Create modal instance
    modal = new Modal('test-modal');
  });

  describe('Initialization', () => {
    it('should initialize with correct DOM elements', () => {
      expect(modal.modal).toBeDefined();
      expect(modal.overlay).toBeDefined();
      expect(modal.container).toBeDefined();
      expect(modal.form).toBeDefined();
    });

    it('should handle missing modal gracefully', () => {
      expect(() => new Modal('non-existent')).not.toThrow();
    });
  });

  describe('Modal Opening/Closing', () => {
    it('should open modal when open button is clicked', () => {
      const openButton = screen.getByText('Open Modal');
      fireEvent.click(openButton);
      
      expect(modal.modal).toHaveClass('is-open');
    });

    it('should close modal when close button is clicked', () => {
      modal.open();
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      expect(modal.modal).not.toHaveClass('is-open');
    });

    it('should close modal on Escape key', () => {
      modal.open();
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(modal.modal).not.toHaveClass('is-open');
    });

    it('should close modal when clicking overlay', () => {
      modal.open();
      
      fireEvent.click(modal.overlay);
      
      expect(modal.modal).not.toHaveClass('is-open');
    });

    it('should NOT close modal when clicking container', () => {
      modal.open();
      
      fireEvent.click(modal.container);
      
      expect(modal.modal).toHaveClass('is-open');
    });
  });

  describe('Form Handling', () => {
    it('should show success state on valid form submission', async () => {
      modal.open();
      
      const emailInput = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(modal.successContent.style.display).toBe('block');
        expect(modal.formContent.style.display).toBe('none');
      });
    });
  });

  describe('Accessibility', () => {
    it('should focus first focusable element when opened', () => {
      modal.open();
      
      const closeButton = screen.getByText('Close');
      expect(document.activeElement).toBe(closeButton);
    });

    it('should reset form state when modal is closed', () => {
      const emailInput = screen.getByRole('textbox');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      modal.close();
      
      expect(emailInput.value).toBe('');
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      modal.cleanup();
      
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });
});