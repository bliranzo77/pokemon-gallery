// Side-by-side comparison of two Pokemon. Plain functions, no React, so the
// same rules can run behind an API later.

import { typesOf } from './measure';
import { STAGES } from './filters';
import { effectiveness } from './typeChart';

// Selection (the ?a=1&b=4 query string)

// Shown when the page opens with no valid pair: Bulbasaur vs Charmander.
const DEFAULT_IDS = [1, 4];

// Pokedex numbers for the two slots. Missing, malformed or duplicate values
// fall back to the defaults; numbers the server doesn't know show an error.
export function parseSelection(params) {
  const read = (name) => (/^\d+$/.test(params.get(name) ?? '') ? Number(params.get(name)) : null);
  const fallback = (avoid) => DEFAULT_IDS.find(id => id !== avoid);
  let a = read('a');
  let b = read('b');
  if (!a) a = fallback(b);
  if (!b || b === a) b = fallback(a);
  return { a, b };
}

export const selectionParams = (aId, bId) => ({ a: String(aId), b: String(bId) });

// Base stats

export const STAT_FIELDS = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'sp_attack', label: 'Sp. Atk' },
  { key: 'sp_defense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
];

// Bars share fixed scales so lengths compare across every pair: the highest
// single base stat in the games is 255, the highest total 720.
export const STAT_SCALE = 255;
export const TOTAL_SCALE = 720;

export const statTotal = (p) => Object.values(p.base_stats).reduce((sum, v) => sum + v, 0);

function statRow(key, label, a, b, scale) {
  const diff = a - b;
  return { key, label, a, b, scale, diff: Math.abs(diff), leader: diff > 0 ? 'a' : diff < 0 ? 'b' : null };
}

export function compareStats(a, b) {
  return {
    rows: STAT_FIELDS.map(({ key, label }) => statRow(key, label, a.base_stats[key], b.base_stats[key], STAT_SCALE)),
    total: statRow('total', 'Total', statTotal(a), statTotal(b), TOTAL_SCALE),
  };
}

// Size, in imperial and metric

const round1 = (n) => Math.round(n * 10) / 10;
export const toMeters = (inches) => round1(inches * 0.0254);
export const toKilograms = (pounds) => round1(pounds * 0.45359237);
export const formatMeters = (meters) => `${meters.toFixed(1)} m`;
export const formatKilograms = (kilograms) => `${kilograms.toFixed(1)} kg`;

// 4 -> "4 in", 12 -> "1 ft", 15 -> "1 ft 3 in"
export function formatLength(inches) {
  const feet = Math.floor(inches / 12);
  const rest = inches % 12;
  if (!feet) return `${rest} in`;
  return rest ? `${feet} ft ${rest} in` : `${feet} ft`;
}

export function compareSize(a, b) {
  const heightDiff = Math.abs(a.height_in - b.height_in);
  const weightDiff = round1(Math.abs(a.weight_lb - b.weight_lb));
  const taller = a.height_in === b.height_in ? null : a.height_in > b.height_in ? a : b;
  const heavier = a.weight_lb === b.weight_lb ? null : a.weight_lb > b.weight_lb ? a : b;
  const metricHeightDiff = round1(Math.abs(toMeters(a.height_in) - toMeters(b.height_in)));
  const metricWeightDiff = round1(Math.abs(toKilograms(a.weight_lb) - toKilograms(b.weight_lb)));
  return {
    height: taller
      ? `${taller.name} is ${formatLength(heightDiff)} (${formatMeters(metricHeightDiff)}) taller.`
      : `They are the same height.`,
    weight: heavier
      ? `${heavier.name} is ${weightDiff} lb (${formatKilograms(metricWeightDiff)}) heavier.`
      : `They weigh the same.`,
  };
}

// Type matchups

const MULTIPLIER_TEXT = { 4: '4×', 2: '2×', 1: '1×', 0.5: '½×', 0.25: '¼×', 0: '0×' };

function describe(attacker, type, defender, multiplier) {
  const subject = `${attacker.name}’s ${type} attacks`;
  const target = defender.name;
  if (multiplier === 0) return `${subject} have no effect on ${target}.`;
  if (multiplier >= 4) return `${subject} are super effective against ${target}, hitting both of its types.`;
  if (multiplier >= 2) return `${subject} are super effective against ${target}.`;
  if (multiplier <= 0.25) return `${subject} are not very effective against ${target}, resisted by both of its types.`;
  if (multiplier < 1) return `${subject} are not very effective against ${target}.`;
  return `${subject} do normal damage to ${target}.`;
}

// One line per attacking type of `attacker`, strongest first.
export function matchups(attacker, defender) {
  const defending = typesOf(defender);
  return typesOf(attacker)
    .map(type => {
      const multiplier = effectiveness(type, defending);
      return {
        type,
        multiplier,
        multiplierText: MULTIPLIER_TEXT[multiplier] ?? `${multiplier}×`,
        strength: multiplier > 1 ? 'strong' : multiplier === 1 ? 'neutral' : 'weak',
        sentence: describe(attacker, type, defender, multiplier),
      };
    })
    .sort((x, y) => y.multiplier - x.multiplier);
}

// Evolution

export const stageLabel = (p) => STAGES.find(s => s.value === p.evolution_stage)?.label;

// `family` is a's family as returned by GET /api/pokemon/:id.
export function compareEvolution(a, b, family) {
  if (a.evolution_family !== b.evolution_family) {
    return `They are from different evolution families.`;
  }
  const [lower, higher] = a.evolution_stage <= b.evolution_stage ? [a, b] : [b, a];
  const steps = higher.evolution_stage - lower.evolution_stage;
  const names = family.map(p => p.name);
  const members = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
  // The data counts baby Pokemon as Basic, so when another member shares
  // the lower stage, a one-stage gap may hide an extra evolution.
  const sharedStage = family.filter(p => p.evolution_stage === lower.evolution_stage).length > 1;
  const relation = steps === 0
    ? `Both are at the ${stageLabel(a)} stage.`
    : steps === 2
      ? `${lower.name} evolves twice to become ${higher.name}.`
      : sharedStage
        ? `${higher.name} is a later evolution than ${lower.name}.`
        : `${lower.name} evolves into ${higher.name}.`;
  return `Same family: ${members}. ${relation}`;
}
