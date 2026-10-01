// Helpers for drawing Pokemon to scale.

import artBounds from './artBounds.json';

// Visible extent of each artwork inside its square PNG, measured by
// client/scripts/art_bounds.py. Lets a figure's feet sit on the baseline and
// its head meet its true height. Unknown artwork uses the full image box.
const fullBox = { top: 0, bottom: 1, left: 0, right: 1 };

const slugOf = (pokemon) => pokemon.slug ?? pokemon.photo.split('/').pop().replace(/\.png$/, '');

export function boundsFor(pokemon) {
  const b = artBounds[slugOf(pokemon)];
  return b ? { top: b[0], bottom: b[1], left: b[2], right: b[3] } : fullBox;
}

// A ruler for drawing something `heightIn` tall: labelled ticks every
// `step` inches (1, 2, 5, 10, 20 or 50 ft, whichever keeps about seven
// labels), half-step ticks between, and a step of headroom above.
// `minScaleInches` adds headroom so wide figures also fit across.
const RULER_STEPS = [12, 24, 60, 120, 240, 600];

export function rulerScale(heightIn, minScaleInches = 0) {
  const target = Math.max(heightIn, minScaleInches);
  const step = RULER_STEPS.find(s => target / s <= 7) ?? RULER_STEPS.at(-1);
  const scaleInches = Math.max((Math.ceil(heightIn / step) + 1) * step, Math.ceil(minScaleInches / step) * step);
  const ticks = [];
  for (let at = 0; at <= scaleInches; at += step / 2) {
    const major = at % step === 0;
    ticks.push({ at, major, label: major && at > 0 ? `${at / 12} ft` : null });
  }
  return { scaleInches, ticks };
}

// 67 -> "5 ft 7 in"
export function formatHeight(heightIn) {
  const feet = Math.floor(heightIn / 12);
  const inches = heightIn % 12;
  return inches ? `${feet} ft ${inches} in` : `${feet} ft`;
}

// 199.5 -> "199.5 lb"
export function formatWeight(weightLb) {
  return `${weightLb} lb`;
}

// The smallest ruler height (in inches) at which `pokemon`, drawn to scale,
// is no wider than `aspect` times the chart's height.
export function scaleToFitWidth(pokemon, aspect) {
  const b = boundsFor(pokemon);
  return (pokemon.height_in * (b.right - b.left)) / (b.bottom - b.top) / aspect;
}

export function typesOf(pokemon) {
  return pokemon.type_2 ? [pokemon.type, pokemon.type_2] : [pokemon.type];
}

// Sizing for an <img> so the visible figure spans `fraction` of its chart's
// height, with its lowest pixel on the baseline. Values are fractions of the
// chart height.
export function figureBox(pokemon, fraction) {
  const b = boundsFor(pokemon);
  const imgHeight = fraction / (b.bottom - b.top);
  return {
    imgHeight,
    sink: imgHeight * (1 - b.bottom),
    cropLeft: imgHeight * b.left,
    visibleWidth: imgHeight * (b.right - b.left),
  };
}
