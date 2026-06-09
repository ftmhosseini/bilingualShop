const API = Cypress.env('API_URL') || 'http://localhost:5001';
const ADMIN_EMAIL = Cypress.env('ADMIN_EMAIL') || 'admin@nuttymilk.com';
const ADMIN_PASSWORD = Cypress.env('ADMIN_PASSWORD') || 'admin123';
const TEST_EMAIL = `cy_${Date.now()}@test.com`;
const TEST_PASS = 'Test1234!';

describe('Register', () => {
  it('shows registration form', () => {
    cy.visit('/register');
    cy.get('input[type="password"]').should('be.visible');
    cy.contains('button', /register|send verification/i).should('be.visible');
  });

  it('progresses to verification step after submit', () => {
    cy.visit('/register');
    cy.get('input').first().type(TEST_EMAIL);
    cy.get('input[type="password"]').type(TEST_PASS);
    cy.contains('button', /send verification/i).click();
    cy.contains(/verify|code/i, { timeout: 6000 }).should('be.visible');
  });
});

describe('Login', () => {
  it('shows error for wrong credentials', () => {
    cy.visit('/login');
    cy.get('input').first().type('nobody@nowhere.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    cy.get('[style*="red"], .error, [class*="error"]', { timeout: 5000 }).should('be.visible');
  });

  it('logs in admin and redirects to home', () => {
    cy.visit('/login');
    cy.get('input').first().type(ADMIN_EMAIL);
    cy.get('input[type="password"]').type(ADMIN_PASSWORD);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 8000 }).should('eq', Cypress.config('baseUrl') + '/');
  });

  it('admin can reach admin dashboard', () => {
    cy.loginAdmin();
    cy.visit('/admin');
    cy.contains(/dashboard/i, { timeout: 6000 }).should('be.visible');
  });

  it('login via API returns token', () => {
    cy.request('POST', `${API}/api/auth/login`, {
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('token');
    });
  });
});
