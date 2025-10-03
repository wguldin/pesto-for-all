// Helper to load and initialize theme modules for testing
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadThemeModule(moduleName) {
  const modulePath = join(__dirname, `../../assets/${moduleName}.js`);
  const moduleContent = readFileSync(modulePath, 'utf8');
  
  // Create a safe execution context
  const moduleGlobals = {
    window: global.window,
    document: global.document,
    console: global.console,
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    CartJS: global.CartJS,
    jQuery: global.jQuery,
    $: global.$,
    Shopify: global.Shopify
  };
  
  // Execute the module code
  const func = new Function(...Object.keys(moduleGlobals), moduleContent);
  func(...Object.values(moduleGlobals));
  
  return true;
}

export function initializeTestDOM() {
  // Set up basic DOM structure that our modules expect
  document.body.innerHTML = `
    <button class="nav__cart" aria-expanded="false">
      <span id="cart-count" style="display: none;">0</span>
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
}