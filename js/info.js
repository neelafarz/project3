// info.js — Info/Settings controls: character gender, skin/hair colors, auto-delete toggle (R18, R20, R21, R31, R32)
// plus a preview card that cycles example outfits with the chosen settings.

import { renderCharacter, BANDS } from './character.js?v=5';
import { getSettings, updateSettings } from './storage.js?v=5';

const $ = (id) => document.getElementById(id);
const BAND_NAMES = { veryCold: 'Very cold', chilly: 'Chilly', neutral: 'Neutral', hot: 'Hot', veryHot: 'Very hot' };
let example = 0; // 0–14: band = floor(n / 3), variation = n % 3

function drawPreview() {
  const s = getSettings();
  const band = BANDS[Math.floor(example / 3)];
  $('preview-character').innerHTML = renderCharacter({
    gender: s.gender, band, variation: example % 3, skin: s.skin, hair: s.hair,
  });
  $('preview-label').textContent = `Example: ${BAND_NAMES[band]}, outfit ${(example % 3) + 1}`;
}

/** @param {{onChange: () => void}} options onChange runs after any setting that affects other views */
export function initInfo({ onChange }) {
  const s = getSettings();
  document.querySelectorAll('input[name=gender]').forEach((radio) => { radio.checked = radio.value === s.gender; });
  $('skin-color').value = s.skin;
  $('hair-color').value = s.hair;
  $('auto-delete').checked = s.autoDeletePastTrips;
  drawPreview();

  const apply = (changes, message) => {
    updateSettings(changes);
    drawPreview();
    onChange();
    $('announce').textContent = message;
  };

  document.querySelectorAll('input[name=gender]').forEach((radio) => {
    radio.addEventListener('change', () => apply({ gender: radio.value }, `Character changed to ${radio.value}.`));
  });
  $('skin-color').addEventListener('input', (e) => apply({ skin: e.target.value }, 'Skin color updated.'));
  $('hair-color').addEventListener('input', (e) => apply({ hair: e.target.value }, 'Hair color updated.'));
  $('auto-delete').addEventListener('change', (e) => apply(
    { autoDeletePastTrips: e.target.checked },
    e.target.checked ? 'Past trips will be deleted automatically on the next load.' : 'Past trips will be kept.',
  ));

  const step = (n) => { example = (example + n + 15) % 15; drawPreview(); };
  $('preview-prev').addEventListener('click', () => step(-1));
  $('preview-next').addEventListener('click', () => step(1));
}
