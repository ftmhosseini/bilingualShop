const { Resend } = require('resend');
const { getPool } = require('./db');

async function getEmailProvider() {
  const db = await getPool();
  const [rows] = await db.execute(
    "SELECT api_key, config FROM messaging_providers WHERE channel='email' AND is_active=1 LIMIT 1"
  );
  if (!rows[0] || !rows[0].api_key) return null;
  const config = typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : (rows[0].config || {});
  return { apiKey: rows[0].api_key, from: config.from_email || 'NuttyMilk <noreply@nuttymilk.com>' };
}

async function sendVerificationEmail(to, code) {
  const provider = await getEmailProvider();
  if (!provider) throw new Error('No active email provider configured');
  const resend = new Resend(provider.apiKey);
  await resend.emails.send({
    from: provider.from,
    to,
    subject: 'Your verification code',
    html: `<h2>Your verification code</h2><p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p><p>Expires in 10 minutes.</p>`,
  });
}

module.exports = { sendVerificationEmail };
