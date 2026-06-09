const API = Cypress.env('API_URL') || 'http://localhost:5001';

describe('Cart', () => {
  beforeEach(() => {
    cy.loginAdmin();
  });

  it('adds a product to cart from products page', () => {
    cy.visit('/products');
    cy.get('.product-card', { timeout: 8000 }).first().within(() => {
      cy.contains('button', /add to cart/i).click();
    });
    cy.contains(/successfully added|added/i, { timeout: 5000 }).should('be.visible');
  });

  it('cart page shows added item', () => {
    // seed cart via localStorage
    cy.window().then(win => {
      win.localStorage.setItem('cart', JSON.stringify([
        { id: 1, name: 'Test Milk', price: 12.99, currency: 'USD', quantity: 1 },
      ]));
    });
    cy.visit('/cart');
    cy.contains('Test Milk', { timeout: 6000 }).should('be.visible');
    cy.contains('12.99').should('be.visible');
  });

  it('can increase quantity in cart', () => {
    cy.window().then(win => {
      win.localStorage.setItem('cart', JSON.stringify([
        { id: 1, name: 'Test Milk', price: 12.99, currency: 'USD', quantity: 1 },
      ]));
    });
    cy.visit('/cart');
    cy.get('input[type="number"], select').first().then($el => {
      cy.wrap($el).clear().type('3');
    });
    cy.contains(/subtotal|total/i).should('be.visible');
  });

  it('can remove item from cart', () => {
    cy.window().then(win => {
      win.localStorage.setItem('cart', JSON.stringify([
        { id: 1, name: 'Test Milk', price: 12.99, currency: 'USD', quantity: 1 },
      ]));
    });
    cy.visit('/cart');
    cy.contains('button', /remove|✕/i).first().click();
    cy.contains(/empty|no items/i, { timeout: 5000 }).should('be.visible');
  });

  it('clear cart button empties cart', () => {
    cy.window().then(win => {
      win.localStorage.setItem('cart', JSON.stringify([
        { id: 1, name: 'Test Milk', price: 12.99, currency: 'USD', quantity: 2 },
      ]));
    });
    cy.visit('/cart');
    cy.contains('button', /clear cart/i).click();
    cy.contains(/empty/i, { timeout: 5000 }).should('be.visible');
  });

  it('checkout page is accessible when cart has items', () => {
    cy.window().then(win => {
      win.localStorage.setItem('cart', JSON.stringify([
        { id: 1, name: 'Test Milk', price: 12.99, currency: 'USD', quantity: 1 },
      ]));
    });
    cy.visit('/cart');
    cy.contains('button', /checkout/i).click();
    cy.url().should('include', '/checkout');
    cy.get('input, form', { timeout: 6000 }).should('exist');
  });
});
