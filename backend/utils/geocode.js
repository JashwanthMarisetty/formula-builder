const cache = new Map();

const roundCoord = (n) => Math.round(Number(n) * 1e5) / 1e5; // ~1m precision
const keyFor = (lat, lng) => `${roundCoord(lat)},${roundCoord(lng)}`;

const getFetch = async () => {
  if (typeof fetch !== 'undefined') return fetch;
  try {
    const mod = await import('node-fetch');
    return mod.default;
  } catch {
    throw new Error('No fetch available. Provide Node >= 18 or install node-fetch');
  }
};

async function reverseGeocode(lat, lng) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    const k = keyFor(lat, lng);
    if (cache.has(k)) return cache.get(k);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const _fetch = await getFetch();
    const res = await _fetch(url);
    if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`);
    const data = await res.json();
    if (!(data.results && data.results[0])) return null;

    const result = data.results[0];
    const address = result.formatted_address;

    // Extract city from address_components
    let city = null;
    let country = null;
    let state = null;
    const comps = result.address_components || [];
    for (const c of comps) {
      if (c.types.includes('locality')) city = c.long_name;
      if (c.types.includes('administrative_area_level_2') && !city) city = c.long_name;
      if (c.types.includes('sublocality') && !city) city = c.long_name;
      if (c.types.includes('administrative_area_level_1')) state = c.long_name;
      if (c.types.includes('country')) country = c.long_name;
    }

    const payload = { address, city, state, country };
    cache.set(k, payload);
    return payload;
  } catch (e) {
    console.error('reverseGeocode error:', e.message);
    return null;
  }
}

module.exports = { reverseGeocode };