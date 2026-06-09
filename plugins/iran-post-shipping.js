/**
 * Iran Post Shipping Plugin
 * Converted from woocommerce-iran-post-shipping by ParsMizban
 * Provides: Express Post, Certified Post, COD (courier companies), Bike Delivery
 *
 * Plugin contract: getRates(payload, config) → Array of rate objects
 *
 * payload: {
 *   toAddress: { state, city, postcode, country_code },
 *   parcel: { weight_g }   ← weight in grams
 * }
 *
 * config (set in Admin → Shipping Plugins):
 * {
 *   source_state: "THR",         // seller's province code (default: Tehran)
 *   source_city: "",             // seller's city (for bike delivery)
 *   extra_cost: 0,               // fixed extra cost in IRR
 *   extra_cost_percent: 0,       // extra cost as %
 *   free_for_price: 0,           // free shipping if order total >= this (IRR), 0 = disabled
 *   disable_express_above: 20000,  // disable express if weight > Xg
 *   disable_certified_above: 5000, // disable certified if weight > Xg
 *   disable_bike_above: 50000,     // disable bike if weight > Xg
 *   bike_fix_price: 0,           // fixed bike fee in IRR (0 = COD)
 *   min_weight_cod: 0            // COD only shown if weight >= this (g)
 * }
 */

// Province adjacency map (source → set of beside provinces)
const BESIDE = {
  EAZ:['WAZ','ADL','ZJN'], WAZ:['EAZ','KRD','ZJN'], ADL:['EAZ','GIL','ZJN'],
  ESF:['CHB','LRS','KBD','MKZ','QHM','SMN','SKH','YZD','FRS'],
  ABZ:['THR','MKZ','GZN','MZN'], ILM:['KRH','LRS','KHZ'],
  BHR:['KBD','KHZ','FRS','HRZ'], THR:['ABZ','MKZ','QHM','MZN','SMN'],
  CHB:['KBD','KHZ','LRS','ESF'], SKH:['SBN','KRN','YZD','ESF','SMN','RKH'],
  RKH:['SKH','NKH','SMN'], NKH:['RKH','GLS','SMN'],
  KHZ:['ILM','BHR','LRS','KBD','CHB'], ZJN:['GIL','ADL','EAZ','WAZ','KRD','HDN','GZN'],
  SMN:['MZN','THR','QHM','ESF','NKH','RKH','SKH'], SBN:['SKH','KRN','HRZ'],
  FRS:['ESF','YZD','BHR','HRZ','KBD','KRN'],
  GZN:['ZJN','HDN','MKZ','ABZ','MZN','GIL'], QHM:['THR','MKZ','SMN','ESF'],
  KRD:['WAZ','KRH','HDN','ZJN'], KRN:['YZD','FRS','HRZ','SBN','SKH'],
  KRH:['KRD','HDN','LRS','ILM'], KBD:['CHB','KHZ','BHR','FRS','ESF'],
  GLS:['MZN','NKH','SMN'], GIL:['MZN','ADL','ZJN','GZN'],
  LRS:['ILM','KRH','HDN','MKZ','ESF','CHB','KHZ'],
  MZN:['GLS','SMN','THR','ABZ','ESF','GZN','GIL'],
  MKZ:['ESF','QHM','THR','ABZ','LRS','GZN','HDN'],
  HRZ:['BHR','FRS','KRN','SBN'], HDN:['KRH','LRS','KRD','MKZ','GZN','ZJN'],
  YZD:['ESF','FRS','KRN','SKH'],
};

function checkStatesBeside(source, dest) {
  if (source === dest) return 'in';
  if (BESIDE[source] && BESIDE[source].includes(dest)) return 'beside';
  return 'out';
}

const INVALID_POSTCODES = new Set([
  '1234567890','1111111111','2222222222','3333333333','4444444444',
  '5555555555','6666666666','7777777777','8888888888','9999999999',
  '0000000000','0987654321','1234567891','0123456789','7894561230',
]);

function isInvalidPostcode(postcode) {
  if (!postcode) return false;
  const p = String(postcode);
  return INVALID_POSTCODES.has(p) || p.length !== 10;
}

function applyExtras(base, extraCostPercent, extraCost) {
  let total = base;
  total += Math.ceil(total * extraCostPercent / 100);
  total += extraCost;
  return total;
}

function roundUp1000(n) {
  return Math.ceil(n / 1000) * 1000;
}

function getRates(payload, config) {
  const {
    source_state = 'THR',
    source_city = '',
    extra_cost = 0,
    extra_cost_percent = 0,
    free_for_price = 0,
    disable_express_above = 20000,
    disable_certified_above = 5000,
    disable_bike_above = 50000,
    bike_fix_price = 0,
    min_weight_cod = 0,
  } = config;

  const { toAddress = {}, parcel = {} } = payload;
  const destState = toAddress.state || '';
  const destCity = (toAddress.city || '').trim();
  const postcode = toAddress.postcode || toAddress.postal || '';
  const weightG = Number(parcel.weight_g || parcel.weight || 0) || 100; // default 100g
  const orderTotal = Number(payload.order_total || 0); // IRR

  const zone = checkStatesBeside(source_state, destState);
  const isFree = free_for_price > 0 && orderTotal >= free_for_price;
  const postcodeInvalid = isInvalidPostcode(postcode);
  const INSURANCE = 8000;
  const TAX = 9; // 9%

  const rates = [];

  // ── Express Post ──────────────────────────────────────────────
  if (weightG <= disable_express_above) {
    const EXPRESS = {
      500:  { in: 218000, beside: 281200, out: 370000 },
      1000: { in: 263000, beside: 392200, out: 451400 },
      per:  { in:  50000, beside:  50000, out:  50000 },
    };
    if (!isFree) {
      let base;
      if (weightG <= 500) {
        base = EXPRESS[500][zone];
      } else if (weightG <= 1000) {
        base = EXPRESS[1000][zone];
      } else {
        base = EXPRESS[1000][zone] + EXPRESS.per[zone] * Math.ceil((weightG - 1000) / 1000);
      }
      if (postcodeInvalid) base += Math.ceil(base * 25 / 100);
      base += INSURANCE;
      base += Math.ceil(base * TAX / 100);
      base = roundUp1000(base);
      base = applyExtras(base, extra_cost_percent, extra_cost);
      rates.push({ id: 'iran_express', provider: 'Iran Post', service: 'Express Post', price: base, currency: 'IRR', days: zone === 'in' ? 2 : zone === 'beside' ? 3 : 5 });
    } else {
      rates.push({ id: 'iran_express', provider: 'Iran Post', service: 'Express Post', price: 0, currency: 'IRR', days: zone === 'in' ? 2 : zone === 'beside' ? 3 : 5 });
    }
  }

  // ── Certified Post ────────────────────────────────────────────
  if (weightG <= disable_certified_above) {
    const CERT = {
      1000: { in: 507000, beside: 650000, out: 828800 },
      per:  { in: 900000, beside: 100000, out: 115440 },
    };
    if (!isFree) {
      let base;
      if (weightG <= 1000) {
        base = CERT[1000][zone];
      } else {
        base = CERT[1000][zone] + CERT.per[zone] * Math.ceil((weightG - 1000) / 1000);
      }
      if (postcodeInvalid) base += Math.ceil(base * 25 / 100);
      base += INSURANCE;
      base += Math.ceil(base * TAX / 100);
      base = roundUp1000(base);
      base = applyExtras(base, extra_cost_percent, extra_cost);
      rates.push({ id: 'iran_certified', provider: 'Iran Post', service: 'Certified Post', price: base, currency: 'IRR', days: zone === 'in' ? 3 : zone === 'beside' ? 5 : 7 });
    } else {
      rates.push({ id: 'iran_certified', provider: 'Iran Post', service: 'Certified Post', price: 0, currency: 'IRR', days: zone === 'in' ? 3 : zone === 'beside' ? 5 : 7 });
    }
  }

  // ── COD (courier companies: Tipax, Chapar, etc.) ──────────────
  if (min_weight_cod > 0 && weightG >= min_weight_cod) {
    let base = 0;
    base += Math.ceil(orderTotal * extra_cost_percent / 100);
    base += Number(extra_cost);
    rates.push({ id: 'iran_cod', provider: 'Courier (COD)', service: 'Cash on Delivery', price: base, currency: 'IRR', days: null });
  }

  // ── Bike Delivery (same city/province only) ───────────────────
  if (destState === source_state && weightG <= disable_bike_above) {
    const srcCity = source_city.trim();
    const cityMatch = !srcCity || !destCity || srcCity === destCity;
    if (cityMatch) {
      let base = 0;
      if (!isFree) {
        base = bike_fix_price > 0 ? Number(bike_fix_price) : 0;
      }
      const label = srcCity ? `Bike Delivery (${srcCity} only)` : `Bike Delivery (${source_state} province)`;
      rates.push({ id: 'iran_bike', provider: 'Bike Courier', service: label, price: base, currency: 'IRR', days: 1 });
    }
  }

  return rates;
}

module.exports = { getRates };
