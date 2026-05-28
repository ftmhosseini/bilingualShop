const Kavenegar = require('kavenegar');
const { getPool } = require('./db');

async function getSmsProvider(phone) {
  const db = await getPool();
  const [rows] = await db.execute(
    "SELECT provider, api_key, config FROM messaging_providers WHERE channel='sms' AND is_active=1"
  );
  if (!rows.length) return null;

  // If phone starts with +98 (Iran), prefer kavenegar; otherwise prefer twilio
  const isIran = phone.startsWith('+98') || phone.startsWith('98') || phone.startsWith('09');
  const preferred = isIran ? 'kavenegar' : 'twilio';
  const match = rows.find(r => r.provider === preferred) || rows[0];
  const config = typeof match.config === 'string' ? JSON.parse(match.config) : (match.config || {});
  return { provider: match.provider, apiKey: match.api_key, config };
}

function sendViaKavenegar(apiKey, config, phone, code) {
  const api = Kavenegar.KavenegarApi({ apikey: apiKey });
  return new Promise((resolve, reject) => {
    api.Send({
      message: `NuttyMilk verification code: ${code}`,
      sender: config.sender || '10008663',
      receptor: phone,
    }, (res, status) => {
      if (status === 200) resolve(res);
      else reject(new Error(`Kavenegar error: ${status}`));
    });
  });
}

async function sendViaTwilio(apiKey, config, phone, code) {
  // apiKey format: "accountSid:authToken"
  const [accountSid, authToken] = apiKey.split(':');
  const from = config.from_number || config.sender;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({ To: phone, From: from, Body: `NuttyMilk verification code: ${code}` });
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!resp.ok) throw new Error(`Twilio error: ${resp.status}`);
}

async function sendVerificationSMS(phone, code) {
  const sms = await getSmsProvider(phone);
  if (!sms) throw new Error('No active SMS provider configured');

  if (sms.provider === 'kavenegar') return sendViaKavenegar(sms.apiKey, sms.config, phone, code);
  if (sms.provider === 'twilio') return sendViaTwilio(sms.apiKey, sms.config, phone, code);
  throw new Error(`Unknown SMS provider: ${sms.provider}`);
}

module.exports = { sendVerificationSMS };
