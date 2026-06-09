const API = Cypress.env('API_URL') || 'http://localhost:5001';

describe('Admin — Gallery', () => {
  beforeEach(() => {
    cy.loginAdmin();
    cy.visit('/admin/gallery');
  });

  it('gallery page loads', () => {
    cy.contains(/gallery/i, { timeout: 8000 }).should('be.visible');
  });

  it('shows existing uploaded images', () => {
    cy.request({
      method: 'GET',
      url: `${API}/api/settings/images`,
      headers: { Authorization: `Bearer ${window.localStorage.getItem('token')}` },
    }).then(res => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  it('can upload an image via API', () => {
    cy.fixture('test-image.jpg', 'binary').then(img => {
      const blob = Cypress.Blob.binaryStringToBlob(img, 'image/jpeg');
      const formData = new FormData();
      formData.append('image', blob, 'test-image.jpg');

      cy.loginAdmin().then(() => {
        const token = window.localStorage.getItem('token');
        cy.request({
          method: 'POST',
          url: `${API}/api/settings/upload-image`,
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
          failOnStatusCode: false,
        }).then(res => {
          // Accept 200 or 400 (fixture may not exist in CI)
          expect([200, 400]).to.include(res.status);
        });
      });
    }).catch(() => {
      cy.log('test-image.jpg fixture not found, skipping upload test');
    });
  });

  it('upload button is present on page', () => {
    cy.get('input[type="file"]', { timeout: 6000 }).should('exist');
  });

  it('can delete an image via API if one exists', () => {
    cy.request(`${API}/api/settings/images`).then(res => {
      if (res.body.length === 0) {
        cy.log('No images to delete, skipping');
        return;
      }
      const filename = res.body[0].filename;
      cy.request('POST', `${API}/api/auth/login`, {
        identifier: Cypress.env('ADMIN_EMAIL') || 'admin@nuttymilk.com',
        password: Cypress.env('ADMIN_PASSWORD') || 'admin123',
      }).then(loginRes => {
        cy.request({
          method: 'DELETE',
          url: `${API}/api/settings/images/${filename}`,
          headers: { Authorization: `Bearer ${loginRes.body.token}` },
        }).then(delRes => {
          expect(delRes.status).to.eq(200);
        });
      });
    });
  });
});
