const API = Cypress.env('API_URL') || 'http://localhost:5001';

describe('Admin — Hero Slides', () => {
  beforeEach(() => {
    cy.loginAdmin();
    cy.visit('/admin/content');
    cy.contains('button', 'Hero Slides').click();
  });

  it('hero slides tab loads', () => {
    cy.contains(/add slide|slide/i, { timeout: 8000 }).should('be.visible');
  });

  it('can add a hero slide', () => {
    cy.contains('button', /add slide/i).click();
    cy.get('.card').last().within(() => {
      cy.get('input').first().clear().type('Test Slide Title');
      cy.get('input').eq(1).clear().type('Test subtitle');
    });
    cy.contains('button', /save all slides/i).click();
    cy.contains(/saved/i, { timeout: 6000 }).should('be.visible');
  });

  it('can edit slide title', () => {
    cy.get('.card input').first().then($input => {
      const original = $input.val();
      cy.wrap($input).clear().type('Updated Title');
      cy.contains('button', /save all slides/i).click();
      cy.contains(/saved/i, { timeout: 6000 }).should('be.visible');
      // restore
      cy.wrap($input).clear().type(original || 'Nutty Milk');
      cy.contains('button', /save all slides/i).click();
    });
  });

  it('hero slides saved to DB via API', () => {
    cy.request(`${API}/api/settings`).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('hero_slides');
      const slides = JSON.parse(res.body.hero_slides);
      expect(slides).to.be.an('array');
    });
  });

  it('can remove a slide', () => {
    // Add one first so we always have something to remove
    cy.contains('button', /add slide/i).click();
    cy.get('.card').last().within(() => {
      cy.get('input').first().type('Slide to delete');
    });
    cy.get('.card').last().contains('button', /remove/i).click();
    cy.contains('Slide to delete').should('not.exist');
  });
});
