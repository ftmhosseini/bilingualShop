const API = Cypress.env('API_URL') || 'http://localhost:5001';

describe('Admin — Categories', () => {
  let token;

  before(() => {
    cy.request('POST', `${API}/api/auth/login`, {
      identifier: Cypress.env('ADMIN_EMAIL') || 'admin@nuttymilk.com',
      password: Cypress.env('ADMIN_PASSWORD') || 'admin123',
    }).then(res => { token = res.body.token; });
  });

  it('GET /api/categories returns tree', () => {
    cy.request(`${API}/api/categories`).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  it('can create a top-level category via API', () => {
    cy.request({
      method: 'POST',
      url: `${API}/api/categories`,
      headers: { Authorization: `Bearer ${token}` },
      body: { name: 'Cypress Test Cat', names: { en: 'Cypress Test Cat' } },
    }).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('id');
      const catId = res.body.id;

      // Edit it
      cy.request({
        method: 'PUT',
        url: `${API}/api/categories/${catId}`,
        headers: { Authorization: `Bearer ${token}` },
        body: { name: 'Cypress Test Cat Updated', names: { en: 'Cypress Test Cat Updated', fa: 'تست' } },
      }).then(r => expect(r.status).to.eq(200));

      // Delete it
      cy.request({
        method: 'DELETE',
        url: `${API}/api/categories/${catId}`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => expect(r.status).to.eq(200));
    });
  });

  it('can add category from admin UI', () => {
    cy.loginAdmin();
    cy.visit('/admin/products');
    cy.get('details summary').click();
    cy.get('input[placeholder="English"]').first().type('UI Test Category');
    cy.contains('button', /add top-level/i).click();
    cy.contains('UI Test Category', { timeout: 6000 }).should('be.visible');

    // Delete via API cleanup
    cy.request(`${API}/api/categories`).then(res => {
      const cat = res.body.find(c => c.name === 'UI Test Category');
      if (cat) {
        cy.request({
          method: 'DELETE',
          url: `${API}/api/categories/${cat.id}`,
          headers: { Authorization: `Bearer ${window.localStorage.getItem('token')}` },
        });
      }
    });
  });

  it('can add subcategory', () => {
    cy.request(`${API}/api/categories`).then(res => {
      if (res.body.length === 0) return cy.log('No parent category, skip');
      const parentId = res.body[0].id;
      cy.request({
        method: 'POST',
        url: `${API}/api/categories`,
        headers: { Authorization: `Bearer ${token}` },
        body: { name: 'Sub Cat Test', parent_id: parentId, names: { en: 'Sub Cat Test' } },
      }).then(r => {
        expect(r.status).to.eq(200);
        cy.request({
          method: 'DELETE',
          url: `${API}/api/categories/${r.body.id}`,
          headers: { Authorization: `Bearer ${token}` },
        });
      });
    });
  });
});
