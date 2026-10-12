// trips.js — Trips view: list (R16), add/edit form (R14, R17), per-day detail (R15, R26).
// Three screens inside the Trips section: list → form (add/edit) or detail (day-by-day).
// Recommendation picks reuse the Today rules and are stored per trip + date (R9).

import { searchLocation, GeocodeError } from './geocode.js';
import { getForecast, getDay, WeatherError } from './weather.js';
import { computeRecommendation, rerollOutfit } from './recommendation.js';
import { getTrips, saveTrip, deleteTrip, tripStatus, getDayState, setDayState, getSettings } from './storage.js';
import { drawOutfit, formatDate, toUnit } from './render.js';

const $ = (id) => document.getElementById(id);
const todayLocal = () => new Intl.DateTimeFormat('en-CA').format(new Date());

const view = {
  trip: null,        // trip being viewed
  days: [],          // every YYYY-MM-DD in the trip
  forecast: null,    // getForecast result for the trip's location
  index: 0,          // selected day
  editing: null,     // trip being edited, or null when adding
};
let ctx = { getUnits: () => 'F', toggleUnits: () => {} };

// Every date from start to end inclusive, as YYYY-MM-DD (UTC math avoids daylight-saving drift).
function dateRange(start, end) {
  const out = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

const dayCount = (trip) => dateRange(trip.startDate, trip.endDate).length;
const plural = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
const errorText = (e) => (e instanceof GeocodeError || e instanceof WeatherError ? e.message : 'Something went wrong. Please try again.');

function showScreen(name) {
  $('trips-list-screen').hidden = name !== 'list';
  $('trip-form').hidden = name !== 'form';
  $('trip-detail').hidden = name !== 'detail';
}

function showTripStatus(kind, message = '', onRetry = null) {
  $('trip-status').hidden = !kind;
  $('trip-status').classList.toggle('error', kind === 'error');
  $('trip-status-text').textContent = message;
  $('trip-retry').hidden = !onRetry;
  $('trip-retry').onclick = onRetry;
}

// ---------- List ----------

function renderList() {
  const trips = getTrips();
  const today = todayLocal();
  $('trips-empty').hidden = trips.length > 0;
  $('trips-list').replaceChildren(
    ...trips.map((trip) => {
      const status = tripStatus(trip, today);
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'trip-row';
      const name = document.createElement('span');
      name.className = 'trip-name';
      name.textContent = trip.name;
      const meta = document.createElement('span');
      meta.className = 'trip-meta';
      meta.textContent = `${plural(dayCount(trip))} · ${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;
      const badge = document.createElement('span');
      badge.className = `badge ${status}`;
      badge.textContent = status === 'complete' ? 'Complete' : 'Upcoming';
      button.append(name, meta, badge);
      button.addEventListener('click', () => openDetail(trip));
      li.append(button);
      return li;
    }),
  );
}

export function openList() {
  renderList();
  showScreen('list');
}

// ---------- Add / edit form ----------

export function openForm(trip = null) {
  view.editing = trip;
  $('trip-form-title').textContent = trip ? 'Edit trip' : 'Add trip';
  $('trip-location').value = trip ? trip.name : '';
  $('trip-start').value = trip ? trip.startDate : '';
  $('trip-end').value = trip ? trip.endDate : '';
  $('trip-form-msg').textContent = '';
  showScreen('form');
  $('trip-location').focus();
}

async function submitForm(event) {
  event.preventDefault();
  const text = $('trip-location').value.trim();
  const startDate = $('trip-start').value;
  const endDate = $('trip-end').value;
  const msg = $('trip-form-msg');

  if (!text) { msg.textContent = 'Enter a US location for the trip.'; return; }
  if (!startDate || !endDate) { msg.textContent = 'Choose a start date and an end date.'; return; }
  if (endDate < startDate) { msg.textContent = 'The end date must be on or after the start date.'; return; }

  const editing = view.editing;
  const unchanged = editing && text === editing.name && startDate === editing.startDate && endDate === editing.endDate;
  if (unchanged) { openDetail(editing); return; }

  $('trip-save').disabled = true;
  msg.textContent = 'Saving…';
  try {
    // Re-geocode only when the location text changed.
    const place = editing && text === editing.name ? editing : await searchLocation(text);
    const saved = saveTrip({ id: editing?.id, name: place.name, lat: place.lat, lon: place.lon, startDate, endDate });
    msg.textContent = '';
    if (editing) openDetail(saved); else openList();
  } catch (error) {
    msg.textContent = errorText(error);
  } finally {
    $('trip-save').disabled = false;
  }
}

// ---------- Detail ----------

async function loadForecast() {
  const { trip } = view;
  $('trip-body').hidden = true;
  showTripStatus('loading', `Loading the forecast for ${trip.name}…`);
  try {
    view.forecast = await getForecast(trip.lat, trip.lon);
  } catch (error) {
    showTripStatus('error', errorText(error), loadForecast);
    return;
  }
  showTripStatus(null);
  $('trip-body').hidden = false;
  drawDay();
}

export function openDetail(trip) {
  view.trip = trip;
  view.days = dateRange(trip.startDate, trip.endDate);
  view.forecast = null;
  const todayIndex = view.days.indexOf(todayLocal());
  view.index = todayIndex >= 0 ? todayIndex : 0;
  $('trip-title').textContent = trip.name;
  $('trip-meta').textContent = `${plural(view.days.length)} · ${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;
  showScreen('detail');
  loadForecast();
}

// The recommendation state for the selected day, created on first view and then reused (R9).
function dayState(day, date) {
  const stored = getDayState(view.trip.id, date);
  if (!day) return stored; // past or out-of-window: only a saved pick can be shown
  const state = computeRecommendation(day, stored);
  if (JSON.stringify(state) !== JSON.stringify(stored)) setDayState(view.trip.id, date, state);
  return state;
}

function drawStrip(units) {
  const strip = $('trip-strip');
  const hadFocus = strip.contains(document.activeElement);
  strip.replaceChildren(
    ...view.days.map((date, i) => {
      const day = getDay(view.forecast, date);
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'day-card';
      if (i === view.index) button.setAttribute('aria-current', 'true');
      const temps = day ? `${toUnit(day.high, units)}° / ${toUnit(day.low, units)}°` : '—';
      button.innerHTML = '<strong></strong><span></span><span></span>';
      const [label, dateText, tempText] = button.children;
      label.textContent = `Day ${i + 1}`;
      dateText.textContent = formatDate(date);
      tempText.textContent = temps;
      button.addEventListener('click', () => { view.index = i; drawDay(); });
      li.append(button);
      return li;
    }),
  );
  const current = strip.querySelector('[aria-current]');
  if (current) {
    if (hadFocus) current.focus();
    current.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
}

export function drawDay() {
  if (!view.forecast) return;
  const units = ctx.getUnits();
  const unit = `°${units}`;
  const date = view.days[view.index];
  const day = getDay(view.forecast, date);
  const isPast = date < view.forecast.days[0].date;
  const state = dayState(day, date);

  const toggle = $('trip-units');
  toggle.textContent = unit;
  toggle.setAttribute('aria-pressed', String(units === 'C'));
  toggle.setAttribute('aria-label', `Temperature units: ${units === 'F' ? 'Fahrenheit. Switch to Celsius.' : 'Celsius. Switch to Fahrenheit.'}`);

  $('day-prev').disabled = view.index === 0;
  $('day-next').disabled = view.index === view.days.length - 1;
  $('trip-day-label').textContent = `Day ${view.index + 1} of ${view.days.length} · ${formatDate(date)}`;
  drawStrip(units);

  const message = $('trip-message');
  $('trip-temp').textContent = day ? `${toUnit(day.high, units)}${unit}` : '';
  $('trip-temp-note').textContent = day ? `Forecast high · High ${toUnit(day.high, units)}${unit} / Low ${toUnit(day.low, units)}${unit}` : '';

  let announcement;
  if (state) {
    announcement = drawOutfit('trip-', { state, day, settings: getSettings() });
  }
  $('trip-outfit-row').hidden = !state;
  $('trip-recommendation').hidden = !state;
  $('trip-reminders').hidden = !state;

  // Days with no live forecast (R15, R26): say why instead of showing blank UI.
  if (!day) {
    message.hidden = false;
    message.textContent = isPast
      ? `This day has passed, so its forecast is no longer available.${state ? ' Showing the outfit you saw before.' : ''}`
      : 'Forecast not available yet. Check back closer to your trip.';
    announcement = `${formatDate(date)}: ${message.textContent}`;
  } else {
    message.hidden = true;
  }
  $('announce').textContent = `${view.trip.name}, Day ${view.index + 1}, ${announcement}`;
}

function reroll(direction) {
  const date = view.days[view.index];
  const state = getDayState(view.trip.id, date);
  if (!state) return;
  setDayState(view.trip.id, date, rerollOutfit(state, direction));
  drawDay();
}

/** Redraw after a shared setting (units, gender, colors) changes elsewhere. */
export function redrawTrips() {
  if (!$('trip-detail').hidden) drawDay();
}

// ---------- Wiring ----------

/** @param {{getUnits:()=>string, toggleUnits:()=>void}} context shared units state owned by main.js */
export function initTrips(context) {
  ctx = context;
  $('add-trip').addEventListener('click', () => openForm());
  $('trip-form').addEventListener('submit', submitForm);
  $('trip-cancel').addEventListener('click', () => (view.editing ? openDetail(view.editing) : openList()));
  $('trip-back').addEventListener('click', openList);
  $('trip-edit').addEventListener('click', () => openForm(view.trip));
  $('trip-delete').addEventListener('click', () => {
    if (window.confirm(`Delete the trip "${view.trip.name}"? This cannot be undone.`)) {
      deleteTrip(view.trip.id);
      openList();
    }
  });
  $('trip-units').addEventListener('click', () => ctx.toggleUnits());
  $('day-prev').addEventListener('click', () => { view.index -= 1; drawDay(); });
  $('day-next').addEventListener('click', () => { view.index += 1; drawDay(); });
  $('trip-outfit-prev').addEventListener('click', () => reroll(-1));
  $('trip-outfit-next').addEventListener('click', () => reroll(1));
  openList();
}
