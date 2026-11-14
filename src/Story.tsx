import { useEffect, useMemo, useState } from "react";
import Chart from "./Chart";
import { Area, WPY, loadArea, matrix } from "./data";

const YEARS = [2015, 2019, 2023, 2026];
const COL: Record<number, string> = { 2015: "#7b241c", 2019: "#e67e22", 2023: "#2e86c1", 2026: "#000000" };

/** FR-15: cumulative fire-days for the four reference years, with narrated cards. */
export default function Story({ id }: { id: string }) {
  const [area, setArea] = useState<Area | null>(null);
  useEffect(() => { loadArea(id).then(setArea); }, [id]);
  const d = useMemo(() => {
    if (!area) return null;
    const M = matrix(area.h);
    const cum = (y: number) => { let s = 0; return (M[y - area.start_year] || []).map((v) => (v == null ? null : (s += v))); };
    const upto = (y: number, w: number) => (M[y - area.start_year] || []).slice(0, w).reduce<number>((a, v) => a + (v ?? 0), 0);
    const w = area.last_week;
    const rows = YEARS.map((y) => ({ y, ytd: upto(y, w), total: upto(y, WPY) }));
    const option = {
      grid: { left: 60, right: 16, top: 30, bottom: 36 }, legend: { top: 0 }, tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: Array.from({ length: WPY }, (_, i) => String(i + 1)), name: "week", nameLocation: "middle", nameGap: 24 },
      yAxis: { type: "value", name: "cumulative fire-days" },
      series: YEARS.map((y) => ({ name: String(y), type: "line", showSymbol: false, data: cum(y).map((v) => (v == null ? "-" : Math.round(v))), lineStyle: { color: COL[y], width: y === 2026 ? 3 : 2 } })),
    } as any;
    return { rows, w, option };
  }, [area]);
  if (!area || !d) return <p>Loading…</p>;
  const r15 = d.rows[0], r26 = d.rows[3];
  const ratio = r15.ytd > 0 ? r26.ytd / r15.ytd : null;
  return (
    <section>
      <h1>Story mode: {area.name}</h1>
      <p className="lead">2015, 2019, 2023 and 2026, measured in harmonized fire-days.</p>
      <Chart option={d.option} height={360} label="Cumulative fire-days for 2015, 2019, 2023 and 2026" />
      <div className="cards">
        <div className="tile"><div className="k">1. The yardstick</div><div className="s">2015 is the reference fire year: {Math.round(r15.total).toLocaleString()} fire-days over the full year, {Math.round(r15.ytd).toLocaleString()} by week {d.w}.</div></div>
        <div className="tile"><div className="k">2. The other years</div><div className="s">2019: {Math.round(d.rows[1].total).toLocaleString()}. 2023: {Math.round(d.rows[2].total).toLocaleString()}. Full-year totals.</div></div>
        <div className="tile"><div className="k">3. Is {r26.y} worse than 2015?</div><div className="s">By week {d.w}, {r26.y} stands at {Math.round(r26.ytd).toLocaleString()} fire-days, {ratio == null ? "n/a" : `${(ratio * 100).toFixed(0)}% of 2015`} for the same weeks. This is measured in fire-days only. Fire radiative power is not part of this view yet, so we make no wider claim.</div></div>
      </div>
    </section>
  );
}
