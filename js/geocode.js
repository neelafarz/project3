// geocode.js — Nominatim search (R1) and reverse geocoding (R2), US only.
// Policy (operations.osmfoundation.org/policies/nominatim): max 1 request/second, no
// search-as-you-type, identify the app. Browsers cannot set User-Agent, so the Referer
// header identifies it. Search returns only the top match; users retype to refine.

const BASE = 'https://nominatim.openstreetmap.org';
const MIN_GAP_MS = 1100; // stay under 1 request/second
let lastRequestAt = 0;

/** Typed errors so views can show the right message and retry (R25–R28). */
export class GeocodeError extends Error {
  /** @param {'notFound'|'notUS'|'network'|'permissionDenied'|'positionUnavailable'|'timeout'} kind */
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

const MESSAGES = {
  empty: 'Enter a US city and state, like "Austin, TX".',
  notFound: 'No US location matched that search. Try the full place name, like "Springfield, IL".',
  notUS: 'That location is outside the United States. This app covers US locations only.',
  network: 'Could not reach the location service. Check your connection and try again.',
};

async function request(path, params) {
  // Space out calls so rapid retries never exceed Nominatim's rate limit.
  const wait = lastRequestAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();

  const url = `${BASE}${path}?${new URLSearchParams({ format: 'jsonv2', addressdetails: '1', ...params })}`;
  let response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch {
    throw new GeocodeError('network', MESSAGES.network);
  }
  if (!response.ok) throw new GeocodeError('network', MESSAGES.network);
  return response.json();
}

// "Austin, TX" from a Nominatim address; falls back to the result's own name.
function displayName(result) {
  const a = result.address || {};
  const place = a.city || a.town || a.village || a.hamlet || a.municipality || a.suburb || a.county || result.name;
  const state = (a['ISO3166-2-lvl4'] || '').replace(/^US-/, '') || a.state;
  return [place, state].filter(Boolean).join(', ');
}

function toLocation(result) {
  return { name: displayName(result), lat: Number(Number(result.lat).toFixed(4)), lon: Number(Number(result.lon).toFixed(4)) };
}

/** Resolve free text to the top US match. Resolves { name, lat, lon } or throws GeocodeError. */
export async function searchLocation(text) {
  const query = (text || '').trim();
  if (!query) throw new GeocodeError('notFound', MESSAGES.empty);
  const results = await request('/search', { q: query, countrycodes: 'us', limit: '1' });
  if (!results.length) throw new GeocodeError('notFound', MESSAGES.notFound);
  return toLocation(results[0]);
}

/** Turn device coordinates into a place name. Throws notUS outside the United States. */
export async function reverseGeocode(lat, lon) {
  const result = await request('/reverse', { lat: String(lat), lon: String(lon), zoom: '10' });
  if (result.error) throw new GeocodeError('notFound', MESSAGES.notFound);
  if (result.address?.country_code !== 'us') throw new GeocodeError('notUS', MESSAGES.notUS);
  return toLocation({ ...result, lat, lon });
}

/** Browser Geolocation wrapped in a promise; failures become typed errors (R28). */
export function getDevicePosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeocodeError('positionUnavailable', 'This browser cannot share its location. Enter a place instead.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => {
        if (e.code === e.PERMISSION_DENIED) reject(new GeocodeError('permissionDenied', 'Location access was denied. Enter a place instead.'));
        else if (e.code === e.TIMEOUT) reject(new GeocodeError('timeout', 'Finding your location took too long. Try again or enter a place.'));
        else reject(new GeocodeError('positionUnavailable', 'Your location is unavailable right now. Enter a place instead.'));
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  });
}
