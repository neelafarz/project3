// render.js — DOM rendering for each view. No data fetching or storage here; main.js passes everything in.

import { renderCharacter } from './character.js?v=5';
import { renderWeatherIcon, renderReminderIcon } from './icons.js?v=5';
import { describeRecommendation } from './recommendation.js?v=5';

const $ = (id) => document.getElementById(id);

export const toUnit = (f, units) => Math.round(units === 'C' ? ((f - 32) * 5) / 9 : f);

/** "Mon, Oct 12" from a YYYY-MM-DD string (parsed as a plain calendar date, no time zone shift). */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Status box under the location form (R25 loading, R26–R28 errors). kind: 'loading' | 'error' | 'info' | null */
export function showStatus(kind, message = '', onRetry = null) {
  const box = $('today-status');
  box.hidden = !kind;
  box.classList.toggle('error', kind === 'error');
  $('today-status-text').textContent = message;
  const retry = $('today-retry');
  retry.hidden = !onRetry;
  retry.onclick = onRetry;
}

/** Fill the date picker with today + the provider's forecast days only (R4). */
export function renderDateOptions(forecast, selected) {
  const select = $('date-select');
  select.replaceChildren(
    ...forecast.days.map((day, i) => {
      const option = new Option(`${i === 0 ? 'Today, ' : ''}${formatDate(day.date)}`, day.date);
      option.selected = day.date === selected;
      return option;
    }),
  );
}


/**
 * Fill the outfit card, written recommendation and reminders for one recommendation state.
 * `prefix` selects the element set ('' = Today, 'trip-' = trip day). `day` may be null (past trip
 * day with only a saved pick), in which case no weather icon is drawn. Returns the spoken summary.
 */
export function drawOutfit(prefix, { state, day, settings }) {
  const el = (name) => $(prefix + name);
  const { text, reminders } = describeRecommendation(state);

  // These SVG strings come from our own generators (character.js / icons.js), never from user input.
  el('character').innerHTML = renderCharacter({
    gender: settings.gender, band: state.temperatureBand, variation: state.outfitVariation,
    rain: state.rainModifier, skin: settings.skin, hair: settings.hair,
  });
  el('weather-icon').innerHTML = day
    ? renderWeatherIcon({ condition: day.condition, label: `${day.summary}, rain chance ${day.pop}%` })
    : '';
  el('recommendation').textContent = text;
  el('reminders').replaceChildren(
    ...reminders.map((r) => {
      const li = document.createElement('li');
      li.innerHTML = renderReminderIcon({ type: r.type === 'rain' ? 'umbrella' : 'hydration' });
      li.append(r.text);
      return li;
    }),
  );
  return [text, ...reminders.map((r) => r.text)].join(' ');
}

/** Draw the whole Today screen from one recommendation state (R6). */
export function renderToday({ location, forecast, date, state, units, settings }) {
  const day = forecast.days.find((d) => d.date === date);
  const isToday = date === forecast.days[0].date;
  const useNow = isToday && forecast.currentTemp !== null;
  const unit = `°${units}`;

  $('today-body').hidden = false;
  $('date-select').value = date;
  $('temp').textContent = `${toUnit(useNow ? forecast.currentTemp : day.high, units)}${unit}`;
  $('temp-note').textContent = `${useNow ? 'Now (forecast)' : 'Forecast high'} · High ${toUnit(day.high, units)}${unit} / Low ${toUnit(day.low, units)}${unit}`;
  $('place').textContent = location.name;

  const toggle = $('units-toggle');
  toggle.textContent = unit;
  toggle.setAttribute('aria-pressed', String(units === 'C'));
  toggle.setAttribute('aria-label', `Temperature units: ${units === 'F' ? 'Fahrenheit. Switch to Celsius.' : 'Celsius. Switch to Fahrenheit.'}`);

  const described = drawOutfit('', { state, day, settings });

  // Announce the change for screen readers (R24).
  $('announce').textContent = `${location.name}, ${formatDate(date)}: ${toUnit(day.high, units)}${unit} high. ${described}`;
}
