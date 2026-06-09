const API = Cypress.env('API_URL') || 'http://localhost:5001';

describe('Admin — Products', () => {
  let token;
  let createdProductId;

  before(() => {
    cy.request('POST', `${API}/api/auth/login`, {
      identifier: Cypress.env('ADMIN_EMAIL') || 'admin@nuttymilk.com',
      password: Cypress.env('ADMIN_PASSWORD') || 'admin123',
    }).then(res => { token = res.body.token; });
  });

  it('GET /api/products returns array', () => {
    cy.request(`${API}/api/products`).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  it('can create a product via API', () => {
    cy.request({
      method: 'POST',
      url: `${API}/api/products`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        name: 'Cypress Product',
        names: { en: 'Cypress Product' },
        description: 'Test desc',
        descriptions: { en: 'Test desc' },
        stock: 10,
        prices: [{ currency: 'USD', price: 9.99, langs: ['en'] }],
      },
    }).then(res => {
      expect(res.status).to.eq(200);
      createdProductId = res.body.id;
    });
  });

  it('can edit a product via API', () => {
    cy.request(`${API}/api/products`).then(res => {
      const p = res.body.find(p => p.name === 'Cypress Product') || res.body[0];
      if (!p) return cy.log('No product to edit');
      cy.request({
        method: 'PUT',
        url: `${API}/api/products/${p.id}`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          name: 'Cypress Product Updated',
          names: { en: 'Cypress Product Updated' },
          description: 'Updated desc',
          descriptions: { en: 'Updated desc' },
          stock: 20,
          prices: [{ currency: 'USD', price: 14.99, langs: ['en'] }],
        },
      }).then(r => expect(r.status).to.eq(200));
    });
  });

  it('can delete the created product via API', () => {
    cy.request(`${API}/api/products`).then(res => {
      const p = res.body.find(p => p.name === 'Cypress Product Updated');
      if (!p) return cy.log('No cypress product to delete');
      cy.request({
        method: 'DELETE',
        url: `${API}/api/products/${p.id}`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => expect(r.status).to.eq(200));
    });
  });

  it('admin products page loads and shows list', () => {
    cy.loginAdmin();
    cy.visit('/admin/products');
    cy.get('table', { timeout: 8000 }).should('be.visible');
    cy.get('tbody tr').should('have.length.greaterThan', 0);
  });

  it('can open add product form', () => {
    cy.loginAdmin();
    cy.visit('/admin/products');
    cy.contains('button', /add product/i).click();
    cy.get('input[placeholder*="product"], input[placeholder*="name"], textarea', { timeout: 5000 }).should('be.visible');
  });

  it('product detail page loads', () => {
    cy.request(`${API}/api/products`).then(res => {
      if (res.body.length === 0) return;
      cy.visit(`/products/${res.body[0].id}`);
      cy.get('.page', { timeout: 8000 }).should('be.visible');
    });
  });
});
