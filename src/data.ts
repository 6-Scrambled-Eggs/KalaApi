export const WPY = 52;

export type Period = { onset: number; peak: number; end: number };
export type AreaIndex = {
  id: string; name: string; level: "nation" | "province" | "kabupaten"; parent: string | null;
  low_data: boolean; mean_annual_fire_days: number; ytd_pct: number; ytd_ratio: number | null; typical_period: Period;
  ytd_pct_recent: number; ytd_ratio_recent: number | null;
};
type Series = (number | null)[];
export type Area = AreaIndex & {
  start_year: number; last_year: number; last_week: number; back_cast_end_slot: number;
  periods: Record<string, [number, number, number]>;
  h: Series; lo: Series; hi: Series; chk: Series; m: Series; v: Series; cnt: Series; pct: Series; pct12: Series;
  frp: Series; h_peat?: Series; h_min?: Series;
};
export type Meta = {
  generated: string; data_end: string; start_year: number; end_year: number; last_complete_year: number;
  last_complete_week: number; viirs_first_slot: number; peat_split: boolean; baseline: string;
  sensitivity_baseline: string; n_boot: number; notes: string[];
  strata: { stratum: string; peat: string; k: number; k_lo: number; k_hi: number }[];
};
export type Validation = {
  V1_holdout: Holdout; V6_reverse: Holdout; V3_peat_available: boolean;
  V5_known_events: Record<string, { max_pct: number; weeks_ge_90: number; weeks_ge_97_5: number }>;
  V2_small_areas: { low_data_areas: number; total_areas: number };
  V7_burned_area: { status: string; reason: string };
};
type Holdout = {
  label: string; national_err_pct: Record<string, number>; share_within_20pct: number; median_weekly_r: number;
};

const base = import.meta.env.BASE_URL;
const cache = new Map<string, Promise<unknown>>();
function load<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(path, fetch(`${base}data/${path}`).then((r) => {
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return r.json();
    }));
  }
  return cache.get(path) as Promise<T>;
}
export const loadIndex = () => load<AreaIndex[]>("areas.json");
export const loadArea = (id: string): Promise<Area> =>
  Promise.all([load<Area>(`areas/${id}.json`), loadIndex()]).then(([a, idx]) => {
    const ix = idx.find((x) => x.id === id);
    return { ...a, ytd_pct: ix?.ytd_pct ?? NaN, ytd_ratio: ix?.ytd_ratio ?? null, ytd_pct_recent: ix?.ytd_pct_recent ?? NaN, ytd_ratio_recent: ix?.ytd_ratio_recent ?? null };
  });
export type Oni = { source: string; jas: Record<string, number> };
export const loadOni = () => load<Oni>("oni.json");
export const loadMeta = () => load<Meta>("meta.json");
export type HaCheck = { years: number[]; fire_days: number[]; burned_ha: number[]; spearman_rho: number; p: number; n: number };
export const loadHaCheck = () => load<HaCheck>("validation_ha.json");
export const loadValidation = () => load<Validation>("validation.json");
export const loadProvinces = () => load<GeoJSON.FeatureCollection>("provinces.geojson");

/** years x 52 matrix from a flat series */
export function matrix(s: Series): (number | null)[][] {
  const out: (number | null)[][] = [];
  for (let i = 0; i < s.length; i += WPY) out.push(s.slice(i, i + WPY));
  return out;
}

export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Seasonal profile: per week median and 10-90% over baseline years (default 2001-2025). */
export function seasonal(area: Area, y0 = 2001, y1 = 2025) {
  const M = matrix(area.h);
  const med: number[] = [], p10: number[] = [], p90: number[] = [];
  for (let w = 0; w < WPY; w++) {
    const col: number[] = [];
    for (let y = y0; y <= y1; y++) {
      const v = M[y - area.start_year]?.[w];
      if (v != null) col.push(v);
    }
    col.sort((a, b) => a - b);
    med.push(quantile(col, 0.5)); p10.push(quantile(col, 0.1)); p90.push(quantile(col, 0.9));
  }
  return { med, p10, p90 };
}

/** Approximate date label of a week slot (7-day blocks of the year). */
export const dateLocale = { v: "en-GB" };
export function weekLabel(w: number): string {
  const d = new Date(Date.UTC(2001, 0, 1 + 7 * (w - 1)));
  return d.toLocaleDateString(dateLocale.v, { day: "numeric", month: "short", timeZone: "UTC" });
}

export function annualTotals(s: Series, startYear: number): { year: number; total: number | null }[] {
  return matrix(s).map((row, i) => {
    const vals = row.filter((x): x is number => x != null);
    const complete = vals.length === WPY;
    return { year: startYear + i, total: complete ? vals.reduce((a, b) => a + b, 0) : null };
  });
}

export type EnsoArea = { rho: number; p: number; label: "clear" | "weak" | "none" | "reverse"; med_el: number | null; med_neu: number | null; med_la: number | null; ratio_el_neu: number | null };
export type Enso = { years: { el: number[]; la: number[]; neu: number[] }; n_perm: number; areas: Record<string, EnsoArea> };
export const loadEnso = () => load<Enso>("enso.json");

/** Readiness window: spread of the season onset week over complete years 2001..last_year-1.
 *  Onset = first week when 10% of the year's fire-days have happened (hotspot onset, not drought onset). */
export function readiness(area: Area) {
  const ons: number[] = [];
  for (let y = area.start_year; y < area.last_year; y++) {
    const p = area.periods[String(y)];
    if (p) ons.push(p[0]);
  }
  ons.sort((a, b) => a - b);
  if (ons.length < 5) return null;
  return { earliest: ons[0], p10: Math.round(quantile(ons, 0.1)), median: Math.round(quantile(ons, 0.5)), p90: Math.round(quantile(ons, 0.9)), latest: ons[ons.length - 1], n: ons.length };
}

/** Past year whose cumulative curve up to the current week is closest to the current year (RMS gap). A similarity, not a forecast. */
export function analogYears(area: Area, topN = 2) {
  const M = matrix(area.h);
  const w = area.last_week;
  const cum = (y: number) => { let s = 0; const out: number[] = []; for (let i = 0; i < w; i++) { const v = M[y - area.start_year]?.[i]; if (v == null) return null; out.push((s += v)); } return out; };
  const now = cum(area.last_year);
  if (!now) return [];
  const res: { year: number; rms: number; ratio: number }[] = [];
  for (let y = area.start_year; y < area.last_year; y++) {
    const c = cum(y);
    if (!c) continue;
    const rms = Math.sqrt(c.reduce((a, v, i) => a + (v - now[i]) ** 2, 0) / w);
    res.push({ year: y, rms, ratio: c[w - 1] > 0 ? now[w - 1] / c[w - 1] : NaN });
  }
  return res.sort((a, b) => a.rms - b.rms).slice(0, topN);
}

/** Fire-days up to week w in year y. */
export function upto(area: Area, y: number, w: number): number {
  return (matrix(area.h)[y - area.start_year] || []).slice(0, w).reduce<number>((a, v) => a + (v ?? 0), 0);
}
