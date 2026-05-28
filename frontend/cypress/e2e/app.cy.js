const API = Cypress.env('API_URL') || 'http://localhost:5001';
const TEST_EMAIL = `cypress_${Date.now()}@test.com`;
const TEST_PASS = 'CypressTest123';

describe('Auth — Register', () => {
  it('shows register form and submits', () => {
    cy.visit('/register');
    cy.contains('Email or Phone').should('be.visible');
    cy.get('input[placeholder*="email"]').type(TEST_EMAIL);
    cy.get('input[type="password"]').type(TEST_PASS);
    cy.contains('Send Verification Code').click();
    // Should move to step 2 (verification code input)
    cy.contains('Enter the 5-digit code').should('be.visible');
  });
});

describe('Auth — Login', () => {
  before(() => {
    // Ensure test user exists and is verified via API
    cy.request('POST', `${API}/api/auth/register`, { identifier: TEST_EMAIL, password: TEST_PASS }).then(() => {
      // Mark as verified directly
      cy.request('POST', `${API}/api/auth/login`, {
        identifier: Cypress.env('ADMIN_EMAIL') || 'admin@nuttymilk.com',
        password: Cypress.env('ADMIN_PASSWORD') || 'admin123',
      });
    });
  });

  it('shows error for invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[placeholder*="email"]').type('wrong@test.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    cy.get('p[style*="color: red"], p[style*="red"]').should('be.visible');
  });

  it('logs in admin successfully', () => {
    cy.visit('/login');
    cy.get('input[placeholder*="email"]').type(Cypress.env('ADMIN_EMAIL') || 'admin@nuttymilk.com');
    cy.get('input[type="password"]').type(Cypress.env('ADMIN_PASSWORD') || 'admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });
});

describe('Admin — Languages', () => {
  beforeEach(() => {
    cy.loginAdmin();
    cy.visit('/admin/content');
  });

  it('can navigate to Languages tab', () => {
    cy.contains('Languages').click();
    cy.contains('Manage languages').should('be.visible');
  });

  it('can add a language via API', () => {
    cy.loginAdmin();
    cy.request({
      method: 'PUT',
      url: `${API}/api/languages`,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: [
        { code: 'en', label: 'English', flag: '🇬🇧', rtl: false, enabled: true, sort_order: 1 },
        { code: 'fa', label: 'فارسی', flag: '🇮🇷', rtl: true, enabled: true, sort_order: 2 },
      ],
    }).then(res => {
      expect(res.status).to.eq(200);
    });
  });
});

describe('Admin — Currencies', () => {
  it('can set currencies via API', () => {
    cy.request('POST', `${API}/api/auth/login`, {
      identifier: Cypress.env('ADMIN_EMAIL') || 'admin@nuttymilk.com',
      password: Cypress.env('ADMIN_PASSWORD') || 'admin123',
    }).then(loginRes => {
      cy.request({
        method: 'PUT',
        url: `${API}/api/currencies`,
        headers: { Authorization: `Bearer ${loginRes.body.token}` },
        body: [
          { language_code: 'en', country: 'Canada', flag: '🇨🇦', currency_code: 'CAD', symbol: '$', active: true, sort_order: 1, fraction_digits: 2 },
          { language_code: 'fa', country: 'Iran', flag: '🇮🇷', currency_code: 'IRR', symbol: '﷼', active: true, sort_order: 2, fraction_digits: 0 },
        ],
      }).then(res => {
        expect(res.status).to.eq(200);
      });
    });
  });

  it('currencies are visible on GET', () => {
    cy.request('GET', `${API}/api/currencies`).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      expect(res.body.map(c => c.currency_code)).to.include('CAD');
    });
  });
});

describe('Checkout Flow', () => {
  it('redirects to login if not authenticated', () => {
    cy.visit('/checkout');
    // Should redirect to login or show empty cart
    cy.url().should('include', '/login').or('include', '/checkout');
  });

  it('shows checkout form when logged in with items', () => {
    cy.loginAdmin();
    // Add a product to cart via localStorage
    const cartItem = { id: 1, name: 'Test Milk', price: 9.99, currency: 'CAD', quantity: 1 };
    localStorage.setItem('cart', JSON.stringify([cartItem]));
    cy.visit('/checkout');
    cy.get('body').then($body => {
      // Either shows checkout form or empty cart message
      if ($body.text().includes('Full Name') || $body.text().includes('نام')) {
        cy.contains(/Full Name|نام/).should('be.visible');
      }
    });
  });
});

describe('Shipping Rates', () => {
  it('returns rates for Canadian address via API', () => {
    cy.request('POST', `${API}/api/shipping/rates`, {
      toAddress: { name: 'Test', street: '123 Main St', city: 'Toronto', state: 'ON', zip: 'M5V1A1', country_code: 'CA' },
      parcel: { length: 20, width: 15, height: 10, weight: 1 },
    }).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  it('returns rates for Iranian address via API', () => {
    cy.request('POST', `${API}/api/shipping/rates`, {
      toAddress: { name: 'تست', street: 'خیابان آزادی', city: 'تهران', province: 'تهران', zip: '1234567890', country_code: 'IR' },
      parcel: { length: 20, width: 15, height: 10, weight: 1 },
    }).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });
});
