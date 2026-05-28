// Custom commands

const API = Cypress.env('API_URL') || 'http://localhost:5001';

Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', `${API}/api/auth/login`, { identifier: email, password }).then(res => {
    localStorage.setItem('token', res.body.token);
  });
});

Cypress.Commands.add('loginAdmin', () => {
  cy.login(
    Cypress.env('ADMIN_EMAIL') || 'admin@nuttymilk.com',
    Cypress.env('ADMIN_PASSWORD') || 'admin123'
  );
});
