const API = Cypress.env('API_URL') || 'http://localhost:5001';

describe('Admin — Languages', () => {
  beforeEach(() => {
    cy.loginAdmin();
    cy.visit('/admin/content');
    cy.contains('button', 'Languages & Currencies').click();
  });

  it('shows language list', () => {
    cy.contains(/manage languages/i, { timeout: 6000 }).should('be.visible');
    cy.contains('en').should('be.visible');
  });

  it('can add a new language', () => {
    cy.contains('button', /add language/i).click();
    cy.get('input[placeholder="en"]').last().type('fr');
    cy.get('input[placeholder="English"]').last().type('Français');
    cy.contains('button', /save all/i).click();
    cy.contains(/saved/i, { timeout: 5000 }).should('be.visible');
  });

  it('can toggle language active state', () => {
    cy.get('input[type="checkbox"]').first().as('firstCheck');
    cy.get('@firstCheck').invoke('is', ':checked').then(checked => {
      cy.get('@firstCheck').click();
      cy.contains('button', /save all/i).click();
      cy.contains(/saved/i, { timeout: 5000 }).should('be.visible');
      // restore
      cy.get('@firstCheck').click();
      cy.contains('button', /save all/i).click();
    });
  });

  it('GET /api/languages returns array', () => {
    cy.request(`${API}/api/languages`).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array').with.length.greaterThan(0);
    });
  });
});

describe('Admin — Currencies', () => {
  beforeEach(() => {
    cy.loginAdmin();
    cy.visit('/admin/content');
    cy.contains('button', 'Languages & Currencies').click();
  });

  it('shows currencies section', () => {
    cy.contains(/currencies/i, { timeout: 6000 }).should('be.visible');
  });

  it('can add a currency', () => {
    cy.contains('button', /add currency/i).click();
    cy.get('input[placeholder="United States"]').last().type('Canada');
    cy.get('input[placeholder="USD"]').last().type('CAD');
    cy.get('input[placeholder="$"]').last().type('$');
    cy.contains('button', /save all/i).last().click();
    cy.contains(/saved/i, { timeout: 5000 }).should('be.visible');
  });

  it('GET /api/currencies returns array', () => {
    cy.request(`${API}/api/currencies`).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array').with.length.greaterThan(0);
    });
  });
});
