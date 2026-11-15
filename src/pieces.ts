/** Colour classes for the fire-day calendars (week and month views).
 *  Half-open ranges so that every value, including decimal back-cast values, falls in exactly one class. */
export const COLS = ["#fffbe6", "#fee391", "#fec44f", "#fe9929", "#d95f0e", "#993404", "#4d1a02"];
export type Piece = { value?: number; gt?: number; gte?: number; lt?: number; label: string; color: string };

export function buildPieces(vals: number[], f: (n: number) => string = String): Piece[] {
  const nz = vals.filter((v) => v > 0).sort((a, b) => a - b);
  const q = (p: number) => Math.round(nz[Math.min(nz.length - 1, Math.floor(nz.length * p))] ?? 1);
  const cuts = Array.from(new Set([1, q(0.2), q(0.4), q(0.6), q(0.8), q(0.95)].filter((c) => c >= 1))).sort((a, b) => a - b);
  const pieces: Piece[] = [{ value: 0, label: "0", color: COLS[0] }];
  cuts.forEach((c, i) => {
    const next = i + 1 < cuts.length ? cuts[i + 1] : null;
    const color = COLS[Math.min(i + 1, COLS.length - 1)];
    const lower = i === 0 ? { gt: 0 } : { gte: c };  // values between 0 and 1 belong to the first class
    if (next == null) pieces.push({ ...lower, label: `${f(c)}+`, color });
    else pieces.push({ ...lower, lt: next, label: next - 1 > c ? `${f(c)}–${f(next - 1)}` : f(c), color });
  });
  return pieces;
}

/** How many classes match a value (must be exactly 1 for every non-null value). */
export function matchCount(v: number, pieces: Piece[]): number {
  return pieces.filter((p) =>
    (p.value === undefined || v === p.value) && (p.gt === undefined || v > p.gt) && (p.gte === undefined || v >= p.gte) && (p.lt === undefined || v < p.lt)).length;
}
