const { client: redis, connectRedis } = require("../config/redis");

// Simple in-memory cache (process-local)
const cache = new Map();

// Cache key helpers
const roundCoord = (n) => Math.round(Number(n) * 1e5) / 1e5; // ~1m precision
const keyFor = (lat, lng) => `${roundCoord(lat)},${roundCoord(lng)}`;
const REDIS_PREFIX = "geo:";
const TTL_SECONDS = parseInt(
  process.env.GEOCODE_CACHE_TTL_SECONDS || "2592000",
  10
); // 30 days default

// Fallback for fetch
const getFetch = async () => {
  if (typeof fetch !== "undefined") return fetch;
  const mod = await import("node-fetch");
  return mod.default;
};

// --- Redis Get/Set helpers ---
async function getFromRedis(key) {
  try {
    await connectRedis();
    const raw = await redis.get(REDIS_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setInRedis(key, value) {
  try {
    await connectRedis();
    await redis.set(REDIS_PREFIX + key, JSON.stringify(value), {
      EX: TTL_SECONDS,
    });
  } catch {}
}

// --- Main reverse geocode logic ---
async function reverseGeocode(lat, lng) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    const k = keyFor(lat, lng);

    // 1️⃣ Check in-memory cache
    if (cache.has(k)) return cache.get(k);

    // 2️⃣ Check Redis cache
    const cached = await getFromRedis(k);
    if (cached) {
      cache.set(k, cached);
      return cached;
    }

    // 3️⃣ Fetch from Google API
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const _fetch = await getFetch();
    const res = await _fetch(url);
    if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`);

    const data = await res.json();
    if (!(data.results && data.results[0])) return null;

    const result = data.results[0];
    const address = result.formatted_address;

    // Extract city/state/country
    let city = null,
      state = null,
      country = null;
    for (const c of result.address_components || []) {
      if (c.types.includes("locality")) city = c.long_name;
      if (c.types.includes("administrative_area_level_2") && !city)
        city = c.long_name;
      if (c.types.includes("sublocality") && !city) city = c.long_name;
      if (c.types.includes("administrative_area_level_1")) state = c.long_name;
      if (c.types.includes("country")) country = c.long_name;
    }

    const payload = { address, city, state, country };

    // Cache result (both memory + Redis)
    cache.set(k, payload);
    setInRedis(k, payload).catch(() => {});

    return payload;
  } catch {
    return null;
  }
}

module.exports = { reverseGeocode };
