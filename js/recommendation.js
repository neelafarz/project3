// recommendation.js — temperature bands, reminder triggers, and persisted variation picks
// (R6–R10, R12, R13). One state object per location+date drives character, icons, text and reminders.

export const RAIN_POP_THRESHOLD = 40;     // % chance of precipitation (R10)
export const HEAT_INDEX_THRESHOLD = 85;   // °F heat index (R12)

// Band cutoffs from research.md, applied to the day's forecast high (°F).
export function temperatureBand(highF) {
  if (highF < 40) return 'veryCold';
  if (highF < 60) return 'chilly';
  if (highF <= 80) return 'neutral';
  if (highF <= 90) return 'hot';
  return 'veryHot';
}

// Written recommendation, one line per band.
const BAND_TEXT = {
  veryCold: 'Bundle up: a warm coat, hat and gloves are the move today.',
  chilly: 'Layer up: a jacket over a long-sleeve top will keep you comfortable.',
  neutral: 'Easy dressing today: a light layer or a tee will do.',
  hot: 'Keep it light: breathable short sleeves and shorts or a skirt.',
  veryHot: 'Stay cool: the lightest, loosest clothes you own.',
};

// Three wordings per reminder (R13).
export const REMINDER_TEXT = {
  rain: [
    'Rain is likely. Take an umbrella.',
    'Showers in the forecast. Don’t leave without an umbrella.',
    'Chance of getting wet today. Pack an umbrella.',
  ],
  hydration: [
    'It will feel hot. Drink extra water today.',
    'Heat is building. Keep a water bottle handy.',
    'High heat index ahead. Sip water often.',
  ],
};

const pickVariation = () => Math.floor(Math.random() * 3);

/**
 * Build the recommendation state for one forecast day.
 * `previous` is the stored state for this location+date, if any: its variations are kept
 * unless the band or a reminder's active/inactive status changed (then only that part is re-rolled).
 * @param {{high:number, pop:number, heatIndex:number|null}} day  a ForecastDay from weather.js
 * @param {object|null} previous
 */
export function computeRecommendation(day, previous = null) {
  const band = temperatureBand(day.high);
  const rainActive = day.pop >= RAIN_POP_THRESHOLD;
  const hydrationActive = day.heatIndex !== null && day.heatIndex >= HEAT_INDEX_THRESHOLD; // null = no heat-index data

  const keep = (isSame, kept) => (previous && isSame ? kept : pickVariation());
  return {
    temperatureBand: band,
    outfitVariation: keep(previous?.temperatureBand === band, previous?.outfitVariation),
    rainModifier: rainActive,
    reminders: {
      rain: {
        active: rainActive,
        wordingVariation: keep(previous?.reminders.rain.active === rainActive, previous?.reminders.rain.wordingVariation),
      },
      hydration: {
        active: hydrationActive,
        wordingVariation: keep(previous?.reminders.hydration.active === hydrationActive, previous?.reminders.hydration.wordingVariation),
      },
    },
  };
}

/** Manual reroll (R8): a different outfit variation within the same band; reminders untouched. */
export function rerollOutfit(state, direction = 1) {
  return { ...state, outfitVariation: (state.outfitVariation + direction + 3) % 3 };
}

/** Text for the screen: written recommendation plus the wording of each active reminder. */
export function describeRecommendation(state) {
  return {
    text: BAND_TEXT[state.temperatureBand],
    reminders: Object.entries(state.reminders)
      .filter(([, r]) => r.active)
      .map(([type, r]) => ({ type, text: REMINDER_TEXT[type][r.wordingVariation] })),
  };
}
