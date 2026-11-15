import { useRef } from "react";
import type { Piece } from "./pieces";
import { useL } from "./i18n";

export const useLegendRef = () => useRef<Piece[]>([]);

/** Wrapping legend for the fire-day colour classes (HTML, so it never gets cut off). */
export function PieceLegend({ pieces }: { pieces: Piece[] }) {
  const L = useL();
  if (!pieces.length) return null;
  return (
    <ul className="pleg" aria-label={L("Colour classes: fire-days", "Kelas warna: hari-api")}>
      {pieces.map((p) => <li key={p.label}><i style={{ background: p.color }} aria-hidden="true" />{p.label}</li>)}
      <li className="u">{L("fire-days (k = thousand)", "hari-api (rb = ribu)")}</li>
    </ul>
  );
}
