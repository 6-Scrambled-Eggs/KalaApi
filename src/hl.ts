import { useEffect, useState } from "react";

/** Shared "highlighted province" between the home map and the province lists (hover a row, its polygon lights; and the reverse). */
type Fn = (id: string | null) => void;
const subs = new Set<Fn>();
let current: string | null = null;
export function setHighlight(id: string | null) { if (id === current) return; current = id; subs.forEach((f) => f(id)); }
export function onHighlight(f: Fn) { subs.add(f); return () => { subs.delete(f); }; }
export function useHighlight() {
  const [id, setId] = useState<string | null>(current);
  useEffect(() => onHighlight(setId), []);
  return id;
}
/** Props for a list row that drives the highlight. */
export const hlProps = (id: string) => ({ onMouseEnter: () => setHighlight(id), onMouseLeave: () => setHighlight(null), onFocus: () => setHighlight(id), onBlur: () => setHighlight(null) });
