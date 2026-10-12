// icons.js — original weather-condition and reminder icons drawn as inline SVG (no image files).
// Style matches character.js: flat fills, soft secondary shade, rounded shapes.
// Every icon carries an accessible name (R24); pass `label` to override the default.

export const WEATHER_CONDITIONS = ['clear', 'partlyCloudy', 'cloudy', 'rain', 'storm', 'snow', 'fog'];

const DEFAULT_LABELS = {
  clear: 'Clear and sunny',
  partlyCloudy: 'Partly cloudy',
  cloudy: 'Cloudy',
  rain: 'Rain',
  storm: 'Thunderstorms',
  snow: 'Snow',
  fog: 'Fog or haze',
  umbrella: 'Rain reminder: bring an umbrella',
  hydration: 'Hydration reminder: drink extra water',
};

const SUN = '#f6b73c';
const SUN_SHADE = '#e79a1c';
const CLOUD = '#f4f7fb';
const CLOUD_SHADE = '#c4d0e0';
const CLOUD_DARK = '#8c9bb3';
const RAIN = '#35a0f0';
const SNOW = '#9ed3f7';

// ---------- Shared pieces (all drawn in a 100×100 box) ----------

function sun(cx, cy, r) {
  let rays = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(a) * (r + 5), y1 = cy + Math.sin(a) * (r + 5);
    const x2 = cx + Math.cos(a) * (r + 13), y2 = cy + Math.sin(a) * (r + 13);
    rays += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${SUN}" stroke-width="5" stroke-linecap="round"/>`;
  }
  return `${rays}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${SUN}"/>
    <path d="M${cx - r * 0.6} ${cy + r * 0.55} A${r} ${r} 0 0 0 ${cx + r * 0.7} ${cy + r * 0.4}" stroke="${SUN_SHADE}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"/>`;
}

// A puffy cloud occupying roughly x 14–86, y (top)–(top+34), offset by (dx, dy), colored by `fill`.
function cloud(dx = 0, dy = 0, fill = CLOUD, shade = CLOUD_SHADE) {
  return `<g transform="translate(${dx} ${dy})">
    <path d="M28 66 a14 14 0 0 1 2-27.8 A20 20 0 0 1 68 34 a16 16 0 0 1 4 31.9 Z" fill="${fill}"/>
    <path d="M28 66 H72 a16 16 0 0 0 5-8 H24 a14 14 0 0 0 4 8 Z" fill="${shade}" opacity="0.8"/>
  </g>`;
}

function drops(xs, y, color = RAIN) {
  return xs.map((x) => `<path d="M${x} ${y} l-4 10" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`).join('');
}

function flake(cx, cy) {
  return `<g stroke="${SNOW}" stroke-width="3.5" stroke-linecap="round">
    <path d="M${cx} ${cy - 6} V${cy + 6} M${cx - 5.2} ${cy - 3} L${cx + 5.2} ${cy + 3} M${cx - 5.2} ${cy + 3} L${cx + 5.2} ${cy - 3}"/>
  </g>`;
}

// ---------- Weather icons ----------

const WEATHER = {
  clear: () => sun(50, 50, 20),
  partlyCloudy: () => `${sun(38, 38, 15)}${cloud(6, 8)}`,
  cloudy: () => `${cloud(-6, -6, CLOUD_DARK, '#6f7d95')}${cloud(6, 6)}`,
  rain: () => `${cloud(0, -8)}${drops([36, 52, 68], 66)}${drops([44, 60], 80)}`,
  storm: () => `${cloud(0, -10, '#9aa7bd', '#7a889f')}
    <path d="M54 56 L40 78 H51 L45 96 L64 70 H53 Z" fill="${SUN}" stroke="${SUN_SHADE}" stroke-width="2" stroke-linejoin="round"/>`,
  snow: () => `${cloud(0, -8)}${flake(34, 74)}${flake(52, 84)}${flake(68, 72)}`,
  fog: () => `${cloud(0, -12)}
    <g stroke="${CLOUD_DARK}" stroke-width="5" stroke-linecap="round">
      <path d="M22 70 H78"/><path d="M30 82 H86"/><path d="M22 94 H70"/>
    </g>`,
};

// ---------- Reminder icons ----------

const REMINDERS = {
  umbrella: () => `<path d="M12 52 A38 36 0 0 1 88 52 Q78 44 69 52 Q59.5 44 50 52 Q40.5 44 31 52 Q22 44 12 52 Z" fill="${RAIN}"/>
    <path d="M50 16 V52 M50 16 Q32 30 31 52 M50 16 Q68 30 69 52" stroke="#1f78c4" stroke-width="2.5" fill="none"/>
    <path d="M50 52 V80 a8 8 0 0 1 -16 0" stroke="#3a4560" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  hydration: () => `<path d="M50 10 C50 10 24 44 24 62 a26 26 0 0 0 52 0 C76 44 50 10 50 10 Z" fill="${RAIN}"/>
    <path d="M36 62 a14 14 0 0 0 10 13" stroke="#cfeafd" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M50 10 C50 10 24 44 24 62 a26 26 0 0 0 5 15 C28 60 40 38 50 10 Z" fill="#7cc8fa" opacity="0.45"/>`,
};

// ---------- Public API ----------

function wrap(inner, label, size) {
  const dim = size ? ` width="${size}" height="${size}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${dim} role="img" aria-label="${label}">${inner}</svg>`;
}

/** @param {{condition: string, label?: string, size?: number}} opts */
export function renderWeatherIcon({ condition, label, size }) {
  const draw = WEATHER[condition];
  if (!draw) throw new Error(`Unknown weather condition: ${condition}`);
  return wrap(draw(), label || DEFAULT_LABELS[condition], size);
}

/** @param {{type: 'umbrella'|'hydration', label?: string, size?: number}} opts */
export function renderReminderIcon({ type, label, size }) {
  const draw = REMINDERS[type];
  if (!draw) throw new Error(`Unknown reminder type: ${type}`);
  return wrap(draw(), label || DEFAULT_LABELS[type], size);
}
