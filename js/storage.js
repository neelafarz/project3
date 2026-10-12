// storage.js — localStorage persistence (R3, R9, R13, R18, R21, R29, R31, R32).
// Four keys, each holding JSON. Reads and writes are wrapped so a blocked or full
// localStorage (private mode, quota) falls back to in-memory data and the app keeps working.
// Units (°F/°C) are intentionally NOT stored: every visit starts in °F (R5).

const KEYS = {
  home: 'wtw.home',         // { name, lat, lon }
  trips: 'wtw.trips',       // [{ id, name, lat, lon, startDate, endDate }]
  days: 'wtw.days',         // { "<home|tripId>|YYYY-MM-DD": recommendation state }
  settings: 'wtw.settings', // { gender, skin, hair, autoDeletePastTrips }
};

export const DEFAULT_SETTINGS = {
  gender: 'female',
  skin: '#e8b48c',
  hair: '#4a2f22',
  autoDeletePastTrips: false,
};

const memory = {}; // fallback when localStorage is unavailable

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  } catch { /* blocked storage or corrupt JSON: fall through */ }
  return key in memory ? memory[key] : fallback;
}

function write(key, value) {
  memory[key] = value;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* memory copy still serves this session */ }
}

function remove(key) {
  delete memory[key];
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// ---------- Home location (R3: only the most recent is kept) ----------

export const getHome = () => read(KEYS.home, null);

export function setHome(location) {
  const previous = getHome();
  write(KEYS.home, { name: location.name, lat: location.lat, lon: location.lon });
  // A new Home location makes the old Home recommendation picks irrelevant.
  if (!previous || previous.lat !== location.lat || previous.lon !== location.lon) clearDayStates('home');
}

// ---------- Trips (R14–R18) ----------

export const getTrips = () => read(KEYS.trips, []);

/** Add a trip (no id) or update one (with id). Returns the saved trip. */
export function saveTrip(trip) {
  const trips = getTrips();
  const saved = { ...trip, id: trip.id || `trip-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}` };
  const index = trips.findIndex((t) => t.id === saved.id);
  if (index >= 0) {
    trips[index] = saved;
    clearDayStates(saved.id); // edited location or dates: per-day picks are recomputed (R17)
  } else {
    trips.push(saved);
  }
  write(KEYS.trips, trips);
  return saved;
}

export function deleteTrip(id) {
  write(KEYS.trips, getTrips().filter((t) => t.id !== id));
  clearDayStates(id);
}

/** A trip is "complete" once its end date is before today (R16). Dates are YYYY-MM-DD strings. */
export const tripStatus = (trip, today) => (trip.endDate < today ? 'complete' : 'upcoming');

// ---------- Per-day recommendation state (R6, R9, R13) ----------

const dayKey = (owner, date) => `${owner}|${date}`;

/** owner is 'home' or a trip id. */
export const getDayState = (owner, date) => read(KEYS.days, {})[dayKey(owner, date)] || null;

export function setDayState(owner, date, state) {
  const days = read(KEYS.days, {});
  days[dayKey(owner, date)] = state;
  write(KEYS.days, days);
}

function clearDayStates(owner) {
  const days = read(KEYS.days, {});
  const prefix = `${owner}|`;
  for (const key of Object.keys(days)) if (key.startsWith(prefix)) delete days[key];
  write(KEYS.days, days);
}

// ---------- Settings (R18, R21, R31, R32) ----------

export const getSettings = () => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) });

export function updateSettings(changes) {
  const next = { ...getSettings(), ...changes };
  write(KEYS.settings, next);
  return next;
}

// ---------- Startup cleanup ----------

/**
 * Run once per load. Removes completed trips when auto-delete is on (R18) and drops
 * stored day picks for dates before today so storage does not grow without bound.
 * @param {string} today YYYY-MM-DD
 */
export function runCleanup(today) {
  if (getSettings().autoDeletePastTrips) {
    for (const trip of getTrips()) if (tripStatus(trip, today) === 'complete') deleteTrip(trip.id);
  }
  const days = read(KEYS.days, {});
  let changed = false;
  for (const key of Object.keys(days)) {
    // Keep picks for dates still on a saved trip even when the day itself has passed, until the trip is complete.
    const [owner, date] = key.split('|');
    const trip = getTrips().find((t) => t.id === owner);
    const keep = owner === 'home' ? date >= today : trip && trip.endDate >= today;
    if (!keep) { delete days[key]; changed = true; }
  }
  if (changed) write(KEYS.days, days);
}

/** Remove every stored key (used by tests; could back a future "clear my data" control). */
export function clearAll() {
  Object.values(KEYS).forEach(remove);
}
