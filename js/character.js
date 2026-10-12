// character.js — original fashion-illustration character drawn as layered SVG (no image files).
// Style: slim adult proportions (~7 heads tall), shaped clothing with folds and highlights (ref-03),
// flat color fills with soft shading (ref-07 clarity). All shapes are drawn in code.
// Layer order (back → front): hair back, body, bottoms, top, shoes, hair front, accessories, umbrella.
// Skin and hair colors are passed in (R31/R32), so one drawing serves every color.

const SKIN_DEFAULT = '#e8b48c';
const HAIR_DEFAULT = '#4a2f22';
const CX = 120; // horizontal center line of the figure

// ---------- Color + geometry helpers ----------

function shade(hex, amt = 0.15) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift) => Math.round(((n >> shift) & 255) * (1 - amt));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex, amt = 0.2) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift) => {
    const v = (n >> shift) & 255;
    return Math.round(v + (255 - v) * amt);
  };
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

// Body proportions per gender.
const GEO = {
  female: { sh: 36, wh: 22, hh: 34 }, // shoulder, waist, hip half-widths
  male: { sh: 45, wh: 28, hh: 31 },
};

// Torso outline (left side mirrored to right). `grow` expands it for clothing.
function torsoPath(g, { hem = 215, grow = 0, sh = g.sh } = {}) {
  const s = sh + grow, w = g.wh + grow, h = g.hh + grow;
  const L = (dx, y) => `${CX - dx} ${y}`;
  const R = (dx, y) => `${CX + dx} ${y}`;
  return `M${L(s, 104)} Q${CX} 96 ${R(s, 104)}
    C${R(s - 2, 132)} ${R(w + 3, 150)} ${R(w, 176)}
    C${R(w, 192)} ${R(h, 200)} ${R(h, hem)}
    L${L(h, hem)}
    C${L(h, 200)} ${L(w, 192)} ${L(w, 176)}
    C${L(w + 3, 150)} ${L(s - 2, 132)} ${L(s, 104)} Z`;
}

// Left leg outline from hip to ankle, cut at endY; `grow` widens for clothing, `flare` widens the hem.
function legPath(g, { endY = 428, grow = 0, flare = 0 } = {}) {
  const ys = [212, 262, 330, 380, 428];
  const outer = [-g.hh, -g.hh + 3, -27, -22, -19];
  const inner = [-1, -3, -9, -8, -5];
  const at = (arr, y) => {
    for (let i = 0; i < ys.length - 1; i++) {
      if (y <= ys[i + 1]) {
        const t = (y - ys[i]) / (ys[i + 1] - ys[i]);
        const e = 0.5 - 0.5 * Math.cos(Math.PI * t); // smooth between key points
        return arr[i] + (arr[i + 1] - arr[i]) * e;
      }
    }
    return arr[arr.length - 1];
  };
  const out = [], inn = [];
  for (let y = 212; y <= endY; y += 8) {
    const f = flare * ((y - 212) / 216);
    out.push([CX + at(outer, y) - grow - f, y]);
    inn.push([CX + at(inner, y) + grow * 0.3 + f * 0.2, y]);
  }
  out.push([CX + at(outer, endY) - grow - flare, endY]);
  inn.push([CX + at(inner, endY) + grow * 0.3 + flare * 0.2, endY]);
  const pts = (arr) => arr.map((p) => `${p[0].toFixed(1)} ${p[1]}`).join(' L');
  return `M${pts(out)} L${pts(inn.reverse())} Z`;
}

const mirror = (inner) => `<g transform="translate(${CX * 2} 0) scale(-1 1)">${inner}</g>`;
const both = (inner) => inner + mirror(inner);

// Arm line endpoints (shoulder → wrist) for the left arm; the right arm is mirrored.
const arm = (g) => ({ sx: CX - (g.sh - 5), sy: 112, wx: CX - (g.sh + 7), wy: 238 });
const armAt = (g, t) => {
  const a = arm(g);
  return [a.sx + (a.wx - a.sx) * t, a.sy + (a.wy - a.sy) * t];
};
const armLine = (g, t, w, color) => {
  const a = arm(g);
  const [x, y] = armAt(g, t);
  return both(`<line x1="${a.sx}" y1="${a.sy}" x2="${x}" y2="${y}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`);
};

// ---------- Body (skin layer) ----------

function body(gender, skin) {
  const g = GEO[gender];
  const sh = shade(skin, 0.12);
  const dk = shade(skin, 0.22);
  const a = arm(g);
  const f = gender === 'female';
  const femaleHead = `M${CX - 23} 48 C${CX - 23} 26 ${CX - 12} 19 ${CX} 19 C${CX + 12} 19 ${CX + 23} 26 ${CX + 23} 48 C${CX + 23} 66 ${CX + 14} 83 ${CX} 85 C${CX - 14} 83 ${CX - 23} 66 ${CX - 23} 48 Z`;
  // Male: broader, squarer jaw and chin.
  const maleHead = `M${CX - 25} 46 C${CX - 25} 26 ${CX - 12} 19 ${CX} 19 C${CX + 12} 19 ${CX + 25} 26 ${CX + 25} 46 C${CX + 25} 62 ${CX + 24} 72 ${CX + 18} 80 L${CX + 9} 86 Q${CX} 88 ${CX - 9} 86 L${CX - 18} 80 C${CX - 24} 72 ${CX - 25} 62 ${CX - 25} 46 Z`;
  const lip = f ? '#c4565f' : '#b5646a';
  return `
  <g class="body">
    ${both(`<path d="${legPath(g)}" fill="${skin}"/>
      <ellipse cx="${CX - 12}" cy="438" rx="13" ry="7.5" fill="${skin}"/>
      <path d="M${CX - 9} 262 C${CX - 8} 300 ${CX - 9} 330 ${CX - 9} 360" stroke="${dk}" stroke-width="2" fill="none" opacity="0.18"/>`)}
    <rect x="${CX - 9}" y="76" width="18" height="34" rx="8" fill="${sh}"/>
    ${armLine(g, 1, 15, skin)}
    ${both(`<ellipse cx="${a.wx}" cy="${a.wy + 10}" rx="7.5" ry="11" fill="${skin}"/>`)}
    <path d="${torsoPath(g, { hem: 218 })}" fill="${skin}"/>
    <path d="M${CX - 14} 100 Q${CX} 108 ${CX + 14} 100" stroke="${dk}" stroke-width="2" fill="none" opacity="0.25"/>
    <ellipse cx="${CX}" cy="90" rx="10" ry="6" fill="${dk}" opacity="0.35"/>
    <ellipse cx="${CX - 24}" cy="55" rx="4" ry="7" fill="${sh}"/>
    <ellipse cx="${CX + 24}" cy="55" rx="4" ry="7" fill="${sh}"/>
    <path d="${f ? femaleHead : maleHead}" fill="${skin}"/>
    ${f ? `<ellipse cx="${CX - 14}" cy="68" rx="7" ry="4.5" fill="#ff6f86" opacity="0.16"/>
    <ellipse cx="${CX + 14}" cy="68" rx="7" ry="4.5" fill="#ff6f86" opacity="0.16"/>` : ''}
    <!-- eyes: almond shape, iris, highlight, upper lid -->
    ${both(`<path d="M${CX - 18} 53 Q${CX - 11} 46 ${CX - 4} 53 Q${CX - 11} 58 ${CX - 18} 53 Z" fill="#fff"/>
      <circle cx="${CX - 11}" cy="52" r="4.2" fill="#6b4630"/><circle cx="${CX - 11}" cy="52" r="2.2" fill="#1f1713"/>
      <circle cx="${CX - 12.5}" cy="50.5" r="1.2" fill="#fff"/>
      <path d="M${CX - 19} 53 Q${CX - 11} 44.5 ${CX - 3} 53" stroke="#2b1d17" stroke-width="${f ? 2.2 : 1.8}" fill="none" stroke-linecap="round"/>
      ${f ? `<path d="M${CX - 19} 53 L${CX - 22} 50.5" stroke="#2b1d17" stroke-width="1.6" stroke-linecap="round"/>` : ''}`)}
    <path d="M${CX} 55 Q${CX - 4} 66 ${CX} 67 Q${CX + 3} 67.5 ${CX + 4} 65" stroke="${dk}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.7"/>
    <path d="M${CX - 8} 74 Q${CX - 3} 71 ${CX} 72.5 Q${CX + 3} 71 ${CX + 8} 74 Q${CX} 77 ${CX - 8} 74 Z" fill="${lip}"/>
    <path d="M${CX - 8} 74 Q${CX} 80.5 ${CX + 8} 74 Q${CX} 77 ${CX - 8} 74 Z" fill="${shade(lip, 0.1)}"/>
  </g>`;
}

// ---------- Hair (two layers so the head sits between them) ----------

function brows(gender, hair) {
  const c = shade(hair, 0.35);
  return both(`<path d="M${CX - 20} 44 Q${CX - 12} 39.5 ${CX - 4} 43" stroke="${c}" stroke-width="${gender === 'female' ? 2.4 : 3.2}" fill="none" stroke-linecap="round"/>`);
}

function hairBack(gender, hair) {
  if (gender === 'male') return '';
  const sh = shade(hair, 0.18);
  return `<g class="hair-back">
    <path d="M94 54 C84 6 156 6 146 54 C154 100 158 150 152 196 C142 208 128 202 126 188 L126 104 L114 104 L114 188 C112 202 98 208 88 196 C82 150 86 100 94 54 Z" fill="${sh}"/>
  </g>`;
}

function hairFront(gender, hair) {
  const sh = shade(hair, 0.2);
  const hi = lighten(hair, 0.28);
  if (gender === 'male') {
    // Side-parted cut: rounded cap with one fringe sweeping from the part down across the forehead.
    return `<g class="hair-front">
      <path d="M94 46 C88 20 108 6 126 7 C146 8 154 26 148 42 L146 44 L144 36 C136 28 120 28 108 32 C102 34 99 38 97 44 Z" fill="${hair}"/>
      <path d="M130 10 C118 14 104 22 97 40 M138 14 C124 18 111 25 103 35 M144 24 C132 23 120 25 111 30" stroke="${sh}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M106 16 C114 10 126 8 136 11" stroke="${hi}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.65"/>
      ${brows('male', hair)}
    </g>`;
  }
  return `<g class="hair-front">
    <path d="M94 56 C90 18 108 8 124 8 C142 8 152 22 146 56 C143 44 138 36 130 31 C122 42 106 50 94 56 Z" fill="${hair}"/>
    <path d="M97 54 C88 92 90 138 100 172 C108 162 106 120 104 80 Z" fill="${hair}"/>
    <path d="M143 54 C152 92 150 138 140 172 C132 162 134 120 136 80 Z" fill="${hair}"/>
    <path d="M110 18 C120 12 132 14 138 22 M99 100 C98 124 100 146 103 160 M141 100 C142 124 140 146 137 160" stroke="${hi}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.65"/>
    <path d="M122 14 C118 30 110 42 100 52" stroke="${sh}" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${brows('female', hair)}
  </g>`;
}

// ---------- Outfit pieces ----------

// Top: sleeve 'none' | 'short' | 'long'; kind adds shape/detail. Returns SVG parts; neckline skin is filled in by the caller.
function top(g, { c, sleeve = 'short', kind = 'tee', hem = 212 }) {
  const dk = shade(c, 0.2);
  const hi = lighten(c, 0.22);
  const puffy = kind === 'puffer' || kind === 'coat';
  const grow = puffy ? 5 : 2;
  const sw = puffy ? 24 : kind === 'hoodie' ? 22 : 19;
  const sleeveT = sleeve === 'long' ? 0.98 : 0.36;
  const strap = kind === 'tank';
  const shape = torsoPath(g, { hem, grow, sh: strap ? 20 : g.sh });
  const sleeves = sleeve === 'none' ? '' : armLine(g, sleeveT, sw, c);
  const cuffs = sleeve === 'long'
    ? both(`<circle cx="${armAt(g, 0.97)[0]}" cy="${armAt(g, 0.97)[1]}" r="${sw / 2 - 1}" fill="${dk}"/>`)
    : '';
  // Soft fold lines and a highlight keep the fabric from looking flat.
  const folds = `<path d="M${CX - g.wh} 178 Q${CX - 10} 186 ${CX - g.wh + 6} 198 M${CX + g.wh} 176 Q${CX + 12} 184 ${CX + g.wh - 4} 198" stroke="${dk}" stroke-width="2" fill="none" opacity="0.35" stroke-linecap="round"/>
    <path d="M${CX - g.sh + 8} 114 Q${CX - 16} 128 ${CX - 20} 150" stroke="${hi}" stroke-width="5" fill="none" opacity="0.35" stroke-linecap="round"/>`;
  let neck = `<path d="M${CX - 15} 98 Q${CX} 120 ${CX + 15} 98 Z" fill="__SKIN__"/>`; // scoop neckline
  let detail = '';
  if (kind === 'hoodie') {
    neck = `<path d="M${CX - 15} 98 Q${CX} 116 ${CX + 15} 98 Z" fill="__SKIN__"/>`;
    detail = `<path d="M${CX - 24} 100 Q${CX} 132 ${CX + 24} 100 Q${CX} 108 ${CX - 24} 100 Z" fill="${dk}"/>
      <path d="M${CX - 5} 118 V148 M${CX + 5} 118 V148" stroke="#f4f4f4" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M${CX - 22} 186 Q${CX} 196 ${CX + 22} 186 L${CX + 18} 208 H${CX - 18} Z" fill="${dk}" opacity="0.5"/>`;
  } else if (kind === 'puffer') {
    detail = `<path d="M${CX - 40} 140 Q${CX} 148 ${CX + 40} 140 M${CX - 38} 168 Q${CX} 176 ${CX + 38} 168 M${CX - 36} 194 Q${CX} 202 ${CX + 36} 194" stroke="${dk}" stroke-width="3" fill="none" opacity="0.7"/>
      <path d="M${CX} 100 V${hem}" stroke="${dk}" stroke-width="3"/>
      <path d="M${CX - 15} 98 Q${CX} 112 ${CX + 15} 98 L${CX + 16} 94 Q${CX} 108 ${CX - 16} 94 Z" fill="${dk}"/>`;
    neck = '';
  } else if (kind === 'coat') {
    detail = `<path d="M${CX} 108 V${hem}" stroke="${dk}" stroke-width="3"/>
      <path d="M${CX - 16} 98 L${CX} 150 L${CX + 16} 98 L${CX + 26} 112 L${CX + 6} 160 L${CX} 150 L${CX - 6} 160 L${CX - 26} 112 Z" fill="${dk}" opacity="0.85"/>
      <circle cx="${CX - 5}" cy="176" r="3" fill="${dk}"/><circle cx="${CX - 5}" cy="196" r="3" fill="${dk}"/>`;
    neck = '';
  } else if (kind === 'cardigan' || kind === 'jacket') {
    detail = `<path d="M${CX - 14} 100 L${CX} 214 L${CX + 14} 100 Z" fill="${kind === 'cardigan' ? '#f1ece0' : dk}" opacity="${kind === 'cardigan' ? 1 : 0.55}"/>
      <path d="M${CX - 14} 100 L${CX - 6} ${hem} M${CX + 14} 100 L${CX + 6} ${hem}" stroke="${dk}" stroke-width="3" fill="none"/>
      <circle cx="${CX - 5}" cy="170" r="2.6" fill="${dk}"/><circle cx="${CX - 5}" cy="192" r="2.6" fill="${dk}"/>`;
    neck = `<path d="M${CX - 15} 98 Q${CX} 112 ${CX + 15} 98 Z" fill="__SKIN__"/>`;
  } else if (kind === 'polo') {
    neck = `<path d="M${CX - 14} 98 L${CX} 118 L${CX + 14} 98 Z" fill="__SKIN__"/>`;
    detail = `<path d="M${CX - 16} 96 L${CX} 116 L${CX - 4} 100 Z M${CX + 16} 96 L${CX} 116 L${CX + 4} 100 Z" fill="${dk}"/>
      <circle cx="${CX}" cy="126" r="2" fill="#f4f4f4"/><circle cx="${CX}" cy="138" r="2" fill="#f4f4f4"/>`;
  } else if (kind === 'tank') {
    neck = `<path d="M${CX - 12} 98 Q${CX} 122 ${CX + 12} 98 Z" fill="__SKIN__"/>`;
  } else {
    detail = `<path d="M${CX - 15} 98 Q${CX} 120 ${CX + 15} 98" stroke="${dk}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  return { sleeves, cuffs, shape, folds, neck, detail, c };
}

// Bottom: 'long' | 'shorts' | 'skirt'
function bottom(g, { c, type = 'long', stitch = false }) {
  const dk = shade(c, 0.22);
  const hi = lighten(c, 0.2);
  const band = `<path d="M${CX - g.hh + 1} 204 H${CX + g.hh - 1} V214 H${CX - g.hh + 1} Z" fill="${dk}"/>`;
  if (type === 'skirt') {
    const hemY = 300;
    return `<g class="bottom"><path d="M${CX - g.hh + 1} 204 H${CX + g.hh - 1} L${CX + g.hh + 22} ${hemY} Q${CX} ${hemY + 10} ${CX - g.hh - 22} ${hemY} Z" fill="${c}"/>
      <path d="M${CX - 16} 214 L${CX - 24} ${hemY + 2} M${CX} 214 V${hemY + 6} M${CX + 16} 214 L${CX + 24} ${hemY + 2}" stroke="${dk}" stroke-width="2.4" opacity="0.6" fill="none"/>${band}</g>`;
  }
  const isShort = type === 'shorts';
  const endY = isShort ? 292 : 430;
  const grow = isShort ? 5 : 3;
  const flare = isShort ? 2 : 5;
  const seam = stitch
    ? `<path d="M${CX} 222 V252 M${CX - 14} 216 Q${CX - 12} 236 ${CX - 4} 240" stroke="${hi}" stroke-width="1.8" stroke-dasharray="4 3" fill="none"/>`
    : '';
  const crease = isShort ? '' : both(`<path d="M${CX - 12} 270 C${CX - 14} 320 ${CX - 14} 380 ${CX - 12} 420" stroke="${dk}" stroke-width="2" fill="none" opacity="0.25"/>`);
  return `<g class="bottom">
    ${both(`<path d="${legPath(g, { endY, grow, flare })}" fill="${c}"/>`)}
    <path d="M${CX - g.hh - 1} 206 H${CX + g.hh + 1} V232 Q${CX} 238 ${CX - g.hh - 1} 232 Z" fill="${c}"/>
    ${band}${seam}${crease}
  </g>`;
}

// Shoes: 'sneakers' | 'boots' | 'sandals'
function shoes({ c, type = 'sneakers' }) {
  const dk = shade(c, 0.28);
  if (type === 'boots') {
    return `<g class="shoes">${both(`<path d="M${CX - 26} 392 H${CX - 4} L${CX - 3} 436 Q${CX - 3} 446 ${CX - 12} 446 H${CX - 24} Q${CX - 30} 446 ${CX - 28} 438 Z" fill="${c}"/>
      <rect x="${CX - 30}" y="441" width="28" height="7" rx="3" fill="${dk}"/>
      <path d="M${CX - 26} 396 H${CX - 4}" stroke="${dk}" stroke-width="3"/>`)}</g>`;
  }
  if (type === 'sandals') {
    return `<g class="shoes">${both(`<ellipse cx="${CX - 12}" cy="445" rx="13" ry="4" fill="${c}"/>
      <path d="M${CX - 20} 436 Q${CX - 12} 430 ${CX - 4} 436 M${CX - 12} 432 V444" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`)}</g>`;
  }
  return `<g class="shoes">${both(`<path d="M${CX - 22} 424 H${CX - 5} L${CX - 4} 438 Q${CX - 4} 446 ${CX - 12} 446 H${CX - 22} Q${CX - 29} 446 ${CX - 27} 438 Z" fill="${c}"/>
    <rect x="${CX - 29}" y="442" width="26" height="6" rx="3" fill="#d6d0c0"/>
    <path d="M${CX - 20} 428 H${CX - 9} M${CX - 20} 433 H${CX - 9}" stroke="${dk}" stroke-width="1.6" stroke-linecap="round"/>`)}</g>`;
}

// Accessories draw last, over the hair.
const ACCESSORIES = {
  beanie: (c) => `<g class="acc"><path d="M93 42 C90 -2 150 -2 147 42 Z" fill="${c}"/>
    <rect x="91" y="30" width="58" height="13" rx="6" fill="${shade(c, 0.22)}"/>
    <path d="M100 30 V43 M108 30 V43 M116 30 V43 M124 30 V43 M132 30 V43 M140 30 V43" stroke="${shade(c, 0.35)}" stroke-width="1.4" opacity="0.5"/>
    <circle cx="${CX}" cy="1" r="9" fill="${shade(c, 0.1)}"/></g>`,
  scarf: (c) => `<g class="acc"><path d="M${CX - 22} 92 Q${CX} 112 ${CX + 22} 92 L${CX + 24} 108 Q${CX} 126 ${CX - 24} 108 Z" fill="${c}"/>
    <path d="M${CX + 4} 112 H${CX + 22} L${CX + 26} 168 H${CX + 6} Z" fill="${shade(c, 0.16)}"/>
    <path d="M${CX + 8} 156 H${CX + 25}" stroke="${lighten(c, 0.3)}" stroke-width="3"/></g>`,
  gloves: (c, g) => `<g class="acc">${both(`<ellipse cx="${arm(g).wx}" cy="${arm(g).wy + 10}" rx="9" ry="12" fill="${c}"/>`)}</g>`,
  sunhat: (c) => `<g class="acc"><ellipse cx="${CX}" cy="30" rx="70" ry="12" fill="${c}"/>
    <path d="M98 28 C97 -6 143 -6 142 28 Z" fill="${shade(c, 0.08)}"/><path d="M98 24 H142 V30 H98 Z" fill="#e45a5a"/></g>`,
  sunglasses: () => `<g class="acc"><rect x="${CX - 21}" y="45" width="19" height="13" rx="6" fill="#241c1f"/>
    <rect x="${CX + 2}" y="45" width="19" height="13" rx="6" fill="#241c1f"/><path d="M${CX - 2} 50 H${CX + 2}" stroke="#241c1f" stroke-width="2.5"/>
    <path d="M${CX - 19} 48 L${CX - 14} 48 M${CX + 5} 48 L${CX + 10} 48" stroke="#fff" stroke-width="1.6" opacity="0.5" stroke-linecap="round"/></g>`,
};

// ---------- Outfits: 3 variations × 5 bands × 2 genders = 30 ----------

const O = {
  veryCold: {
    female: [
      { top: { c: '#3d7bd9', sleeve: 'long', kind: 'puffer', hem: 222 }, bottom: { c: '#35456b' }, shoes: { c: '#5a3a28', type: 'boots' }, acc: [['beanie', '#e05a6d']] },
      { top: { c: '#c79a63', sleeve: 'long', kind: 'coat', hem: 262 }, bottom: { c: '#3c3c46' }, shoes: { c: '#2f2f38', type: 'boots' }, acc: [['scarf', '#d94f4f'], ['gloves', '#3c3c46']] },
      { top: { c: '#4f9d6b', sleeve: 'long', kind: 'puffer', hem: 222 }, bottom: { c: '#46465a' }, shoes: { c: '#6b4a34', type: 'boots' }, acc: [['beanie', '#f2d16b'], ['scarf', '#f2d16b']] },
    ],
    male: [
      { top: { c: '#d9833d', sleeve: 'long', kind: 'puffer', hem: 222 }, bottom: { c: '#35456b' }, shoes: { c: '#5a3a28', type: 'boots' }, acc: [['beanie', '#3c3c46']] },
      { top: { c: '#6b6f7a', sleeve: 'long', kind: 'coat', hem: 262 }, bottom: { c: '#2f2f38' }, shoes: { c: '#2f2f38', type: 'boots' }, acc: [['scarf', '#3d7bd9'], ['gloves', '#2f2f38']] },
      { top: { c: '#2f5d8a', sleeve: 'long', kind: 'puffer', hem: 222 }, bottom: { c: '#46465a' }, shoes: { c: '#6b4a34', type: 'boots' }, acc: [['beanie', '#e05a6d'], ['scarf', '#e05a6d']] },
    ],
  },
  chilly: {
    female: [
      { top: { c: '#a9afc0', sleeve: 'long', kind: 'hoodie', hem: 222 }, bottom: { c: '#4f86c6', stitch: true }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#5d8fd0', sleeve: 'long', kind: 'jacket', hem: 220 }, bottom: { c: '#d9c7a3' }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#c76b8a', sleeve: 'long', kind: 'cardigan', hem: 230 }, bottom: { c: '#3c3c46' }, shoes: { c: '#5a3a28', type: 'boots' }, acc: [] },
    ],
    male: [
      { top: { c: '#7a8aa0', sleeve: 'long', kind: 'hoodie', hem: 222 }, bottom: { c: '#3c3c46' }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#4f86c6', sleeve: 'long', kind: 'jacket', hem: 220 }, bottom: { c: '#c9b88f' }, shoes: { c: '#6b4a34', type: 'boots' }, acc: [] },
      { top: { c: '#6a8f6a', sleeve: 'long', kind: 'cardigan', hem: 230 }, bottom: { c: '#4f86c6', stitch: true }, shoes: { c: '#f1ece0' }, acc: [] },
    ],
  },
  neutral: {
    female: [
      { top: { c: '#f2f2f2', sleeve: 'short' }, bottom: { c: '#4f86c6', stitch: true }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#e8a1b4', sleeve: 'long' }, bottom: { c: '#d9c7a3' }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#8fc9a8', sleeve: 'short' }, bottom: { c: '#b86a8a', type: 'skirt' }, shoes: { c: '#f1ece0' }, acc: [] },
    ],
    male: [
      { top: { c: '#e8e2d0', sleeve: 'short' }, bottom: { c: '#4f86c6', stitch: true }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#6b8fc9', sleeve: 'long' }, bottom: { c: '#c9b88f' }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#4f9d9d', sleeve: 'short', kind: 'polo' }, bottom: { c: '#d9c7a3', type: 'shorts' }, shoes: { c: '#f1ece0' }, acc: [] },
    ],
  },
  hot: {
    female: [
      { top: { c: '#f5c542', sleeve: 'none', kind: 'tank' }, bottom: { c: '#4f86c6', type: 'shorts' }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#e0707f', sleeve: 'short' }, bottom: { c: '#f2f2f2', type: 'shorts' }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#7fb8e0', sleeve: 'short' }, bottom: { c: '#e8c14f', type: 'skirt' }, shoes: { c: '#f1ece0', type: 'sandals' }, acc: [] },
    ],
    male: [
      { top: { c: '#e8e2d0', sleeve: 'none', kind: 'tank' }, bottom: { c: '#4f86c6', type: 'shorts' }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#e07a45', sleeve: 'short' }, bottom: { c: '#46465a', type: 'shorts' }, shoes: { c: '#f1ece0' }, acc: [] },
      { top: { c: '#6bb0a0', sleeve: 'short', kind: 'polo' }, bottom: { c: '#e8e2d0', type: 'shorts' }, shoes: { c: '#6b4a34', type: 'sandals' }, acc: [] },
    ],
  },
  veryHot: {
    female: [
      { top: { c: '#ff8fa3', sleeve: 'none', kind: 'tank', hem: 192 }, bottom: { c: '#ffffff', type: 'shorts' }, shoes: { c: '#e8c14f', type: 'sandals' }, acc: [] },
      { top: { c: '#ffd86b', sleeve: 'none', kind: 'tank' }, bottom: { c: '#4fb8c9', type: 'shorts' }, shoes: { c: '#f1ece0', type: 'sandals' }, acc: [['sunhat', '#f0d9a0']] },
      { top: { c: '#ffffff', sleeve: 'none', kind: 'tank' }, bottom: { c: '#e0707f', type: 'skirt' }, shoes: { c: '#e8c14f', type: 'sandals' }, acc: [['sunglasses']] },
    ],
    male: [
      { top: { c: '#4fb8c9', sleeve: 'none', kind: 'tank' }, bottom: { c: '#f2f2f2', type: 'shorts' }, shoes: { c: '#6b4a34', type: 'sandals' }, acc: [] },
      { top: { c: '#ffb04f', sleeve: 'none', kind: 'tank' }, bottom: { c: '#4f86c6', type: 'shorts' }, shoes: { c: '#f1ece0', type: 'sandals' }, acc: [['sunhat', '#f0d9a0']] },
      { top: { c: '#e8e2d0', sleeve: 'none', kind: 'tank' }, bottom: { c: '#46465a', type: 'shorts' }, shoes: { c: '#6b4a34', type: 'sandals' }, acc: [['sunglasses']] },
    ],
  },
};

export const BANDS = Object.keys(O);

// ---------- Umbrella overlay (R7/R10): held in the right hand, tilted away from the face ----------

function umbrella(g) {
  const hx = CX + g.sh + 7, hy = arm(g).wy + 10;
  const R = 88, rise = 72, pole = 200; // canopy half-width, dome height, pole length
  const hem = hy - pole + 10;
  const tip = hem - rise;
  let d = `M${hx - R} ${hem} A${R} ${rise} 0 0 1 ${hx + R} ${hem}`;
  for (let i = 0; i < 4; i++) { // scalloped edge
    const x0 = hx + R - i * (R / 2), x1 = x0 - R / 2;
    d += ` Q${(x0 + x1) / 2} ${hem - 12} ${x1} ${hem}`;
  }
  return `<g class="umbrella" transform="rotate(22 ${hx} ${hy})">
    <path d="M${hx} ${hy} V${tip}" stroke="#3a4560" stroke-width="4" stroke-linecap="round"/>
    <path d="M${hx} ${hy} q0 12 -10 12" stroke="#3a4560" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="${d} Z" fill="#35a0f0"/>
    <path d="M${hx} ${tip} Q${hx - R * 0.55} ${hem - rise * 0.6} ${hx - R / 2} ${hem} M${hx} ${tip} Q${hx + R * 0.55} ${hem - rise * 0.6} ${hx + R / 2} ${hem} M${hx} ${tip} V${hem}" stroke="#1f78c4" stroke-width="2.5" fill="none"/>
    <path d="M${hx - R * 0.7} ${hem - rise * 0.35} Q${hx - R * 0.45} ${hem - rise * 0.85} ${hx - 8} ${tip + 6}" stroke="#7cc8fa" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>
  </g>`;
}

// Alt text describing the recommendation (R24).
function describe({ gender, band, rain }) {
  const names = { veryCold: 'very cold', chilly: 'chilly', neutral: 'mild', hot: 'hot', veryHot: 'very hot' };
  return `Illustrated ${gender} figure dressed for ${names[band]} weather${rain ? ', holding an umbrella for rain' : ''}.`;
}

/**
 * Build the character SVG string.
 * @param {{gender:'female'|'male', band:string, variation:0|1|2, rain?:boolean, skin?:string, hair?:string}} opts
 */
export function renderCharacter({ gender, band, variation, rain = false, skin = SKIN_DEFAULT, hair = HAIR_DEFAULT }) {
  const g = GEO[gender];
  const o = O[band][gender][variation];
  const t = top(g, o.top);
  const accessories = o.acc.map(([name, c]) => ACCESSORIES[name](c, g)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -40 400 510" role="img" aria-label="${describe({ gender, band, rain })}">
    ${hairBack(gender, hair)}
    ${body(gender, skin)}
    ${bottom(g, o.bottom)}
    <g class="top"><path d="${t.shape}" fill="${t.c}"/>${t.sleeves}${t.cuffs}${t.folds}${t.neck.replace('__SKIN__', skin)}${t.detail}</g>
    ${shoes(o.shoes)}
    ${hairFront(gender, hair)}
    ${accessories}
    ${rain ? umbrella(g) : ''}
  </svg>`;
}
