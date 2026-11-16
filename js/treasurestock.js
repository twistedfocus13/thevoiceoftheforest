// Her ask 11-15 ("yes" to: both shops sell from her Treasure Inventory list at her prices, a few items by rarity each day).
// The list comes from the campaign spreadsheet (live, else the saved copy). Cursed and one-of-a-kind treasure rows are
// never put up for sale. Picks are seeded by the day (and shop), so every screen shows the same stock.
import * as sheet from './sheetdata.js?v=6afa6e0b';
import { num } from './util.js?v=6afa6e0b';

let list = null; let loading = null;
export const loaded = () => !!list;
export function load() {
  if (!loading) loading = sheet.treasure().catch(() => []).then((rows) => {
    list = rows.filter((r) => !/cursed|treasure/i.test(r.rarity) && num(r.price) > 0)
      .map((r) => ({ name: r.name, price: num(r.price), kind: r.kind, tier: /^very rare/i.test(r.rarity) ? 'Very Rare' : /^rare/i.test(r.rarity) ? 'Rare' : /^uncommon/i.test(r.rarity) ? 'Uncommon' : /^mundane/i.test(r.rarity) ? 'Mundane' : 'Common', rarity: r.rarity }));
    return list;
  });
  return loading;
}
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
export const find = (name) => (list || []).find((x) => x.name.toLowerCase() === String(name).toLowerCase());

export function seeded(key) {
  let h = 2166136261; for (const ch of key) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
// plan = list of tiers, e.g. ['Common', 'Common', 'Uncommon', 'Rare']; a tier can be [tier, chance, fallback] ("Very Rare" sometimes)
export function pick(key, plan) {
  if (!list) return [];
  const rnd = seeded(key); const used = new Set(); const out = [];
  for (const p of plan) {
    const [tier, chance, fallback] = Array.isArray(p) ? p : [p, 1, p];
    const want = rnd() < chance ? tier : fallback;
    const pool = list.filter((x) => x.tier === want && !used.has(x.name));
    if (!pool.length) continue;
    const it = pool[Math.floor(rnd() * pool.length)]; used.add(it.name); out.push(it);
  }
  return out;
}
