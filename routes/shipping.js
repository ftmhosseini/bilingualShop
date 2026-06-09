const router = require('express').Router();
const { getPool } = require('../db');
const path = require('path');
const fs = require('fs');

// Iranian domestic carriers — fallback if no plugin installed
// Distance zones from Tehran (km approx). Used to calculate shipping cost.
const IRAN_PROVINCE_ZONES = {
  'Tehran': 0, 'Alborz': 1, 'Qom': 1, 'Semnan': 2, 'Markazi': 2, 'Qazvin': 2,
  'Isfahan': 2, 'Yazd': 3, 'Hamadan': 2, 'Zanjan': 2, 'Gilan': 2, 'Mazandaran': 2,
  'Golestan': 3, 'East Azerbaijan': 3, 'West Azerbaijan': 3, 'Ardabil': 3,
  'Kermanshah': 3, 'Lorestan': 3, 'Ilam': 4, 'Khuzestan': 3,
  'Chaharmahal and Bakhtiari': 3, 'Kohgiluyeh and Boyer-Ahmad': 4,
  'Fars': 4, 'Bushehr': 4, 'Kerman': 4, 'Hormozgan': 5,
  'Sistan and Baluchestan': 5, 'North Khorasan': 4, 'Khorasan Razavi': 4, 'South Khorasan': 5,
  'Kurdestan': 3,
};

// Base prices (IRR) per zone (0=same province, 5=farthest)
const ZONE_BASE = [40000, 60000, 90000, 130000, 180000, 230000];

function iranRates(province) {
  const zone = IRAN_PROVINCE_ZONES[province] ?? 3; // default mid-range if unknown
  const base = ZONE_BASE[zone];
  return [
    { id: 'post_ir',  provider: 'Post Iran',    service: 'Registered', price: base,            currency: 'IRR', days: zone + 3 },
    { id: 'tipax',    provider: 'Tipax',         service: 'Standard',   price: base * 1.6,      currency: 'IRR', days: Math.max(1, zone + 1) },
    { id: 'chapar',   provider: 'Chapar',        service: 'Express',    price: base * 2.2,      currency: 'IRR', days: zone === 0 ? 1 : 2 },
    { id: 'pishro',   provider: 'Pishro Post',   service: 'Same-Day',   price: base * 3,        currency: 'IRR', days: 1 },
  ].map(r => ({ ...r, price: Math.round(r.price / 1000) * 1000 })); // round to nearest 1000
}

async function runShippingPlugin(filename, payload, config) {
  const pluginPath = path.join(__dirname, '../plugins', filename);
  if (!fs.existsSync(pluginPath)) throw new Error('Plugin file not found');
  if (path.extname(filename).toLowerCase() === '.php') {
    const { makePhpPlugin } = require('../plugins/php-runner');
    return makePhpPlugin(pluginPath).getRates(payload, config);
  }
  return require(pluginPath).getRates(payload, config);
}

// POST /api/shipping/rates
router.post('/rates', async (req, res) => {
  const { toAddress, parcel } = req.body;
  const countryCode = (toAddress.country_code || 'CA').toUpperCase();

  // --- Iranian domestic shipping ---
  if (countryCode === 'IR') {
    const db = await getPool();
    const [plugins] = await db.execute(
      "SELECT * FROM plugins WHERE type='shipping' AND (currency_code='IRR' OR currency_code='IR') AND active=1 LIMIT 1"
    );

    if (plugins.length) {
      try {
        const plugin = plugins[0];
        const config = { ...(typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config), _filename: plugin.filename };
        const rates = await runShippingPlugin(plugin.filename, { toAddress, parcel }, config);
        return res.json(rates);
      } catch (e) {
        console.error('Iranian shipping plugin error:', e.message);
        // fall through to fallback
      }
    }

    // Fallback: distance-based Iranian rates
    return res.json(iranRates(toAddress.province || toAddress.state || ''));
  }

  // --- International shipping via Shippo ---
  if (!process.env.SHIPPO_API_KEY || process.env.SHIPPO_API_KEY === 'your_shippo_api_key_here') {
    // No Shippo key — check for a shipping plugin for this country, else return empty
    const db = await getPool();
    const [plugins] = await db.execute(
      'SELECT * FROM plugins WHERE type=? AND active=1 LIMIT 1',
      ['shipping']
    );
    if (plugins.length) {
      try {
        const plugin = plugins[0];
        const config = { ...(typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config), _filename: plugin.filename };
        const rates = await runShippingPlugin(plugin.filename, { toAddress, parcel }, config);
        return res.json(rates);
      } catch (e) {
        console.error('Shipping plugin error:', e.message);
      }
    }
    return res.json([]); // frontend falls back to manual rates from settings
  }

  try {
    const { Shippo } = require('shippo');
    const shippo = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY });

    const shipment = await shippo.shipments.create({
      addressFrom: {
        name: process.env.STORE_NAME || 'NuttyMilk',
        street1: process.env.STORE_ADDRESS_STREET,
        city: process.env.STORE_ADDRESS_CITY,
        state: process.env.STORE_ADDRESS_STATE,
        zip: process.env.STORE_ADDRESS_ZIP,
        country: process.env.STORE_ADDRESS_COUNTRY || 'CA',
      },
      addressTo: {
        name: toAddress.name || 'Customer',
        street1: toAddress.street || '123 Main St',
        city: toAddress.city,
        state: toAddress.state || '',
        zip: toAddress.zip || toAddress.postal || '00000',
        country: countryCode,
      },
      parcels: [{
        length: String(parcel?.length || '20'),
        width: String(parcel?.width || '15'),
        height: String(parcel?.height || '10'),
        distanceUnit: 'cm',
        weight: String(parcel?.weight || '1'),
        massUnit: 'kg',
      }],
      async: false,
    });

    const rates = (shipment.rates || []).map(r => ({
      id: r.objectId,
      provider: r.provider,
      service: r.servicelevel?.name,
      price: parseFloat(r.amount),
      currency: r.currency,
      days: r.estimatedDays,
    }));

    res.json(rates);
  } catch (err) {
    console.error('Shippo error:', err.message);
    res.status(500).json({ error: 'Could not fetch shipping rates', detail: err.message });
  }
});

module.exports = router;
