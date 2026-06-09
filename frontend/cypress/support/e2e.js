const API = Cypress.env('API_URL') || 'http://localhost:5001';
const ADMIN_EMAIL = Cypress.env('ADMIN_EMAIL') || 'admin@nuttymilk.com';
const ADMIN_PASSWORD = Cypress.env('ADMIN_PASSWORD') || 'admin123';

// Login via API and store token
Cypress.Commands.add('loginAdmin', () => {
  cy.request('POST', `${API}/api/auth/login`, {
    identifier: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }).then(res => {
    window.localStorage.setItem('token', res.body.token);
    window.localStorage.setItem('user', JSON.stringify(res.body.user));
  });
});

Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', `${API}/api/auth/login`, { identifier: email, password }).then(res => {
    window.localStorage.setItem('token', res.body.token);
    window.localStorage.setItem('user', JSON.stringify(res.body.user));
  });
});

// Go to admin content tab by index
Cypress.Commands.add('goToContentTab', (tabLabel) => {
  cy.visit('/admin/content');
  cy.contains('button', tabLabel).click();
});
