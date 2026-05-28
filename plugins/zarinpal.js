/**
 * ZarinPal Payment Plugin
 * Upload this file via Admin → Payment Settings → Payment Plugins
 * Set currency_code = IRR
 * Config JSON: { "merchant_id": "your-36-char-merchant-id", "sandbox": true }
 *
 * Plugin contract:
 *   charge(order, config)  → { redirect_url } or throws error
 *   verify(params, config) → { success, ref_id, message }
 */

const https = require('https');

function zarinpalRequest(path, body, sandbox) {
  return new Promise((resolve, reject) => {
    const host = sandbox ? 'sandbox.zarinpal.com' : 'api.zarinpal.com';
    const data = JSON.stringify(body);
    const req = https.request({ host, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { reject(new Error('Invalid response')); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function charge(order, config) {
  const { merchant_id, sandbox = true, callback_url } = config;
  if (!merchant_id) throw new Error('ZarinPal: merchant_id missing in config');

  const body = {
    merchant_id,
    amount: Math.round(order.total), // in Rials
    description: `Order #${order.id}`,
    callback_url: callback_url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/verify?order_id=${order.id}`,
    metadata: { order_id: order.id, email: order.email },
  };

  const result = await zarinpalRequest('/pg/v4/payment/request.json', body, sandbox);
  if (result.data?.code === 100) {
    const base = sandbox ? 'https://sandbox.zarinpal.com' : 'https://www.zarinpal.com';
    return { redirect_url: `${base}/pg/StartPay/${result.data.authority}`, authority: result.data.authority };
  }
  throw new Error(`ZarinPal error: ${result.errors?.message || JSON.stringify(result)}`);
}

async function verify(params, config) {
  const { merchant_id, sandbox = true } = config;
  const { Authority, Status, order_id } = params;

  if (Status !== 'OK') return { success: false, message: 'Payment cancelled by user' };

  const result = await zarinpalRequest('/pg/v4/payment/verify.json', { merchant_id, amount: params.amount, authority: Authority }, sandbox);
  if (result.data?.code === 100 || result.data?.code === 101) {
    return { success: true, ref_id: result.data.ref_id, message: 'Payment verified' };
  }
  return { success: false, message: `Verification failed: code ${result.data?.code}` };
}

module.exports = { charge, verify };
