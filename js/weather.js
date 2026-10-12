// weather.js — api.weather.gov fetch + parsing (R4, R10, R12, R15, R26, R27).
// One public call: getForecast(lat, lon). It does the two-step NWS lookup (points → forecast
// and grid data) and returns one summary per local calendar day. All temperatures are °F;
// unit conversion for display happens in the views (R5).
// Browsers cannot set User-Agent, so NWS sees the page's Referer instead.

const NWS = 'https://api.weather.gov';
const HEADERS = { Accept: 'application/geo+json' };

/** Typed errors so views can show the right message and retry (R26, R27). */
export class WeatherError extends Error {
  /** @param {'outsideCoverage'|'network'|'unavailable'} kind */
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

const MESSAGES = {
  outsideCoverage: 'The National Weather Service has no forecast for this location. Try a different US place.',
  network: 'Could not reach the weather service. Check your connection and try again.',
  unavailable: 'The weather service is not responding right now. Please try again in a moment.',
};

async function getJson(url, retried = false) {
  let response;
  try {
    response = await fetch(url, { headers: HEADERS });
  } catch {
    throw new WeatherError('network', MESSAGES.network);
  }
  // NWS occasionally returns a transient 5xx; one quick retry avoids a needless error screen.
  if (response.status >= 500 && !retried) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return getJson(url, true);
  }
  if (response.status === 404) throw new WeatherError('outsideCoverage', MESSAGES.outsideCoverage);
  if (!response.ok) throw new WeatherError('unavailable', MESSAGES.unavailable);
  return response.json();
}

const celsiusToF = (c) => Math.round((c * 9) / 5 + 32);

// YYYY-MM-DD for an instant, in the location's own time zone (so "today" matches the place, not the browser).
function localDate(instant, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

// Map NWS's free-text shortForecast to one of the icon conditions in icons.js.
export function conditionFromText(text = '') {
  const t = text.toLowerCase();
  if (/thunder/.test(t)) return 'storm';
  if (/snow|flurr|sleet|ice|freezing|wintry/.test(t)) return 'snow';
  if (/rain|shower|drizzle/.test(t)) return 'rain';
  if (/fog|haze|smoke|mist|dust/.test(t)) return 'fog';
  if (/partly|mostly cloudy/.test(t)) return /mostly cloudy/.test(t) ? 'cloudy' : 'partlyCloudy';
  if (/cloud|overcast/.test(t)) return 'cloudy';
  return 'clear'; // sunny, clear, mostly sunny/clear
}

// Highest value of a grid series (heatIndex, °C) within each local day. validTime is "ISO-start/PTnH".
function dailyMax(series, timeZone) {
  const byDate = {};
  for (const { validTime, value } of series.values) {
    if (value === null) continue;
    const date = localDate(new Date(validTime.split('/')[0]), timeZone);
    if (byDate[date] === undefined || value > byDate[date]) byDate[date] = value;
  }
  return byDate;
}

// Value of a grid series for the hour containing `now`, or null.
function valueAt(series, now) {
  for (const { validTime, value } of series.values) {
    const [start, duration] = validTime.split('/');
    const hours = Number((duration.match(/PT(\d+)H/) || [0, 1])[1]) + 24 * Number((duration.match(/P(\d+)D/) || [0, 0])[1]);
    const from = new Date(start).getTime();
    if (now >= from && now < from + hours * 3600000) return value;
  }
  return null;
}

/**
 * @typedef {{date:string, high:number, low:number, pop:number, heatIndex:number|null,
 *            condition:string, summary:string}} ForecastDay   (°F, pop in %)
 * @returns {Promise<{days: ForecastDay[], currentTemp: number|null, timeZone: string}>}
 */
export async function getForecast(lat, lon) {
  const points = (await getJson(`${NWS}/points/${lat},${lon}`)).properties;
  const timeZone = points.timeZone;
  const [forecast, grid] = await Promise.all([getJson(points.forecast), getJson(points.forecastGridData)]);

  // Group forecast periods (day and night halves) by the local date they start on.
  const byDate = {};
  for (const period of forecast.properties.periods) {
    const date = period.startTime.slice(0, 10); // already in the location's local offset
    (byDate[date] ||= []).push(period);
  }

  const heatIndexC = dailyMax(grid.properties.heatIndex, timeZone);
  const days = Object.entries(byDate).map(([date, periods]) => {
    const temps = periods.map((p) => p.temperature);
    const lead = periods.find((p) => p.isDaytime) || periods[0]; // daytime wording describes the day
    const hi = heatIndexC[date];
    return {
      date,
      high: Math.max(...temps),
      low: Math.min(...temps),
      pop: Math.max(...periods.map((p) => p.probabilityOfPrecipitation?.value ?? 0)),
      heatIndex: hi === undefined ? null : celsiusToF(hi),
      condition: conditionFromText(lead.shortForecast),
      summary: lead.shortForecast,
    };
  });

  const nowC = valueAt(grid.properties.temperature, Date.now());
  return { days, currentTemp: nowC === null ? null : celsiusToF(nowC), timeZone };
}

/** The forecast day for a YYYY-MM-DD date, or null when outside the provider's window (R15, R26). */
export const getDay = (forecast, date) => forecast.days.find((d) => d.date === date) || null;
