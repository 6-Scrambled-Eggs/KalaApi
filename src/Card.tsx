import { useEffect, useState } from "react";
import { Area, WPY, loadArea, matrix, weekLabel } from "./data";

/** FR-20: one-page A4 readiness card, print-styled. */
export default function Card({ id }: { id: string }) {
  const [a, setA] = useState<Area | null>(null);
  useEffect(() => { loadArea(id).then(setA); }, [id]);
  if (!a) return <p>Loading…</p>;
  const P = matrix(a.pct)[a.last_year - a.start_year];
  let wk = a.last_week - 1;
  while (wk > 0 && P[wk] == null) wk--;
  const pct = P[wk];
  const tp = a.typical_period;
  return (
    <section className="card a4">
      <button className="noprint" onClick={() => window.print()}>Print</button>
      <h1>{a.name}: fire readiness card</h1>
      <p className="note">Not an official product. Made for the NASA Space Apps Challenge from NASA FIRMS data.</p>
      <table><tbody>
        <tr><th>Fire season, typical</th><td>starts {weekLabel(tp.onset)} · peaks {weekLabel(tp.peak)} · ends {weekLabel(tp.end)}</td></tr>
        <tr><th>This year ({a.last_year})</th><td>week {wk + 1} is at the {pct == null ? "n/a" : Math.round(pct)}th percentile of the same week in 2001–2025. Year to date: ×{a.ytd_ratio ?? "n/a"} of the normal amount (percentile {Math.round(a.ytd_pct)}).</td></tr>
        <tr><th>Average year</th><td>{Math.round(a.mean_annual_fire_days).toLocaleString()} harmonized fire-days</td></tr>
      </tbody></table>
      <h2>Three things to know</h2>
      <ol>
        <li>Hotspots show heat, not area burned. Cloud and haze can hide fires.</li>
        <li>Years before 2012 are estimated from MODIS and carry uncertainty. Sensors differ, so raw counts are not comparable across 2012.</li>
        <li>{a.low_data ? "This area has few fires in an average year. Read the percentiles with care." : "Percentiles compare each week with the same week in 2001–2025."}</li>
      </ol>
      <p className="foot">Data as of week {a.last_week} of {a.last_year} · NASA FIRMS MODIS and VIIRS · {typeof window !== "undefined" ? window.location.href : ""}</p>
    </section>
  );
}
