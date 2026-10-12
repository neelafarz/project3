// main.js — wiring, event handlers, view switching.

import { searchLocation, reverseGeocode, getDevicePosition, GeocodeError } from './geocode.js';
import { getForecast, getDay, WeatherError } from './weather.js';
import { computeRecommendation, rerollOutfit } from './recommendation.js';
import { getHome, setHome, getDayState, setDayState, getSettings, runCleanup } from './storage.js';
import { renderToday, renderDateOptions, showStatus } from './render.js';
import { initTrips, redrawTrips, openForm } from './trips.js';
import { initInfo } from './info.js';

const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.nav-link');

// Show one view, hide the others, and mark the matching nav link as current.
function showView(name) {
  views.forEach((view) => { view.hidden = view.dataset.view !== name; });
  navLinks.forEach((link) => {
    const isCurrent = link.dataset.target === name;
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  history.replaceState(null, '', `#${name}`);
}

document.querySelectorAll('[data-target]').forEach((el) => {
  el.addEventListener('click', () => showView(el.dataset.target));
});

// ---------- Today view ----------

const today = {
  location: null,  // { name, lat, lon }
  forecast: null,  // result of getForecast
  date: null,      // selected YYYY-MM-DD
  units: 'F',      // not persisted: every visit starts in °F (R5)
};

const $ = (id) => document.getElementById(id);

// One recommendation state per Home date; stored picks are reused, never reshuffled (R9).
function currentState() {
  const stored = getDayState('home', today.date);
  const state = computeRecommendation(getDay(today.forecast, today.date), stored);
  if (JSON.stringify(state) !== JSON.stringify(stored)) setDayState('home', today.date, state);
  return state;
}

function draw(state = currentState()) {
  renderToday({ ...today, state, settings: getSettings() });
}

function messageFor(error) {
  return error instanceof GeocodeError || error instanceof WeatherError
    ? error.message
    : 'Something went wrong. Please try again.';
}

// Fetch the forecast for a location and show it. `retry` is offered when the fetch fails (R27).
async function loadLocation(location) {
  today.location = location;
  $('today-body').hidden = true;
  showStatus('loading', `Loading the forecast for ${location.name}…`);
  try {
    today.forecast = await getForecast(location.lat, location.lon);
  } catch (error) {
    showStatus('error', messageFor(error), () => loadLocation(location));
    return;
  }
  showStatus(null);
  today.date = today.forecast.days[0].date;
  renderDateOptions(today.forecast, today.date);
  draw();
}

// Resolve a location (typed or from the device), save it as Home, then load it.
async function resolveAndLoad(resolve, onFail) {
  showStatus('loading', 'Finding your location…');
  try {
    const location = await resolve();
    setHome(location);
    $('location-input').value = '';
    await loadLocation(location);
  } catch (error) {
    showStatus('error', messageFor(error), onFail);
    $('location-input').focus(); // manual entry stays available as the fallback (R28)
  }
}

$('location-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const text = $('location-input').value;
  resolveAndLoad(() => searchLocation(text), null);
});

$('device-location').addEventListener('click', () => {
  const locate = async () => {
    const { lat, lon } = await getDevicePosition();
    return reverseGeocode(lat, lon);
  };
  resolveAndLoad(locate, () => resolveAndLoad(locate, null));
});

$('date-select').addEventListener('change', (event) => {
  today.date = event.target.value;
  draw();
});

// One units choice shared by Today and Trips; converts client-side, no re-fetch (R5).
function toggleUnits() {
  today.units = today.units === 'F' ? 'C' : 'F';
  if (today.forecast) draw();
  redrawTrips();
}
$('units-toggle').addEventListener('click', toggleUnits);

// Reroll arrows change only the outfit and save the new pick (R8, R9).
function reroll(direction) {
  const next = rerollOutfit(currentState(), direction);
  setDayState('home', today.date, next);
  draw(next);
}
$('outfit-prev').addEventListener('click', () => reroll(-1));
$('outfit-next').addEventListener('click', () => reroll(1));

// ---------- Trips ----------

initTrips({ getUnits: () => today.units, toggleUnits });
$('today-add-trip').addEventListener('click', () => openForm()); // "Add trip" on Today opens the form directly

// ---------- Info / Settings ----------

// Gender and colors apply app-wide, so redraw whatever is showing on Today and Trips (R21, R31, R32).
initInfo({ onChange: () => { if (today.forecast) draw(); redrawTrips(); } });

// ---------- Startup ----------

const initial = location.hash.slice(1);
showView(['today', 'trips', 'info'].includes(initial) ? initial : 'today');

runCleanup(new Intl.DateTimeFormat('en-CA').format(new Date()));
const home = getHome();
if (home) loadLocation(home);
else showStatus('info', 'Enter a US location, or use your device location, to see what to wear.');
