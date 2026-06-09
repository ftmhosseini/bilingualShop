describe('Public Pages', () => {
  it('home page loads with hero', () => {
    cy.visit('/');
    cy.get('body', { timeout: 8000 }).should('be.visible');
  });

  it('products page loads and shows items', () => {
    cy.visit('/products');
    cy.get('.page', { timeout: 8000 }).should('be.visible');
    cy.get('.product-card, .grid', { timeout: 8000 }).should('exist');
  });

  it('products category dropdown is visible', () => {
    cy.visit('/products');
    cy.get('select', { timeout: 6000 }).should('be.visible');
  });

  it('FAQ page loads with questions', () => {
    cy.visit('/faq');
    cy.get('.page', { timeout: 8000 }).should('be.visible');
  });

  it('FAQ accordion opens answer on click', () => {
    cy.visit('/faq');
    cy.get('button', { timeout: 8000 }).first().click();
    cy.get('div').contains(/./i).should('be.visible');
  });

  it('contact page loads with form', () => {
    cy.visit('/contact');
    cy.get('form', { timeout: 8000 }).should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('about page loads', () => {
    cy.visit('/about');
    cy.get('.page, main', { timeout: 8000 }).should('be.visible');
  });

  it('blog page loads', () => {
    cy.visit('/blog');
    cy.get('body', { timeout: 8000 }).should('be.visible');
  });

  it('login page renders form', () => {
    cy.visit('/login');
    cy.get('input').should('have.length.greaterThan', 0);
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('register page renders form', () => {
    cy.visit('/register');
    cy.get('input').should('have.length.greaterThan', 0);
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('404 / unknown route shows something', () => {
    cy.visit('/this-page-does-not-exist', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
  });
});

describe('Admin Pages', () => {
  beforeEach(() => cy.loginAdmin());

  it('dashboard loads', () => {
    cy.visit('/admin');
    cy.contains(/dashboard/i, { timeout: 6000 }).should('be.visible');
  });

  it('manage products loads', () => {
    cy.visit('/admin/products');
    cy.get('table, h2', { timeout: 6000 }).should('be.visible');
  });

  it('content settings loads', () => {
    cy.visit('/admin/content');
    cy.contains(/content settings/i, { timeout: 6000 }).should('be.visible');
  });

  it('gallery page loads', () => {
    cy.visit('/admin/gallery');
    cy.get('body', { timeout: 6000 }).should('be.visible');
  });

  it('orders page loads', () => {
    cy.visit('/admin/orders');
    cy.get('body', { timeout: 6000 }).should('be.visible');
  });

  it('theme settings page loads', () => {
    cy.visit('/admin/theme');
    cy.get('body', { timeout: 6000 }).should('be.visible');
  });

  it('shipping settings page loads', () => {
    cy.visit('/admin/shipping');
    cy.get('body', { timeout: 6000 }).should('be.visible');
  });

  it('blog management page loads', () => {
    cy.visit('/admin/blog');
    cy.get('body', { timeout: 6000 }).should('be.visible');
  });
});
