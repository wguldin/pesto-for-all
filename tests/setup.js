// Test setup file
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Shopify-specific globals
global.Shopify = {
  theme: {
    id: 'test-theme'
  },
  shop: 'test-shop.myshopify.com'
};

// Mock CartJS with more complete implementation
global.CartJS = {
  cart: {
    item_count: 0,
    total_price: 0,
    items: []
  },
  init: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn()
};

// Mock jQuery with better implementation
const mockJQuery = vi.fn(() => ({
  on: vi.fn(),
  off: vi.fn()
}));
mockJQuery.fn = {
  extend: vi.fn()
};
global.jQuery = mockJQuery;
global.$ = global.jQuery;

// Make sure CartJS and jQuery are available on window too
global.window.CartJS = global.CartJS;
global.window.jQuery = global.jQuery;
global.window.$ = global.$;

// Mock window.cartData
global.window.cartData = {
  item_count: 0,
  total_price: 0,
  items: [],
  currency: 'USD'
};

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
}));

// Mock window methods
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
});

// Mock document.readyState
Object.defineProperty(document, 'readyState', {
  value: 'complete',
  writable: true
});

// Mock window.addToCart 
global.window.addToCart = vi.fn().mockResolvedValue(true);

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset CartJS mock
  global.CartJS = {
    cart: {
      item_count: 0,
      total_price: 0,
      items: []
    },
    init: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn()
  };
  global.window.CartJS = global.CartJS;
  
  // Clean up DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Clean up global variables
  delete global.window.cartManager;
  delete global.window.productForms;
  delete global.window.blockTransitions;
  delete global.window.mobileMenu;
});