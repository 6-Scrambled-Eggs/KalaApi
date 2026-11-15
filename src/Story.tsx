import { useEffect, useMemo, useState } from "react";
import Chart from "./Chart";
import { Area, WPY, loadArea, matrix } from "./data";

const YEARS = [2015, 2019, 2023, 2026];
const COL: Record<number, string> = { 2015: "#7b241c", 2019: "#e67e22", 2023: "#2e86c1", 2026: "#16212b" };

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
    const F = matrix(area.frp);
    const fcum = (y: number) => { let s = 0; return (F[y - area.start_year] || []).map((v) => (v == null ? null : (s += v))); };
    const fupto = (y: number, wk: number) => (F[y - area.start_year] || []).slice(0, wk).reduce<number>((a, v) => a + (v ?? 0), 0);
    const rows = YEARS.map((y) => ({ y, ytd: upto(y, w), total: upto(y, WPY), fytd: fupto(y, w), ftotal: fupto(y, WPY) }));
    const foption = {
      grid: { left: 70, right: 16, top: 30, bottom: 36 }, legend: { top: 0 }, tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: Array.from({ length: WPY }, (_, i) => String(i + 1)), name: "week", nameLocation: "middle", nameGap: 24 },
      yAxis: { type: "value", name: "cumulative FRP (MW)" },
      series: YEARS.map((y) => ({ name: String(y), type: "line", showSymbol: false, data: fcum(y).map((v) => (v == null ? "-" : Math.round(v))), lineStyle: { color: COL[y], width: y === 2026 ? 3 : 2 }, itemStyle: { color: COL[y] } })),
    } as any;
    const option = {
      grid: { left: 60, right: 16, top: 30, bottom: 36 }, legend: { top: 0 }, tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: Array.from({ length: WPY }, (_, i) => String(i + 1)), name: "week", nameLocation: "middle", nameGap: 24 },
      yAxis: { type: "value", name: "cumulative fire-days" },
      series: YEARS.map((y) => ({ name: String(y), type: "line", showSymbol: false, data: cum(y).map((v) => (v == null ? "-" : Math.round(v))), lineStyle: { color: COL[y], width: y === 2026 ? 3 : 2 }, itemStyle: { color: COL[y] } })),
    } as any;
    return { rows, w, option, foption };
  }, [area]);
  if (!area || !d) return <p>Loading…</p>;
  const r15 = d.rows[0], r26 = d.rows[3];
  const ratio = r15.ytd > 0 ? r26.ytd / r15.ytd : null;
  const fratio = r15.fytd > 0 ? r26.fytd / r15.fytd : null;
  return (
    <section>
      <h1>Story mode: {area.name}</h1>
      <p className="lead">2015, 2019, 2023 and 2026, measured in harmonized fire-days.</p>
      <Chart option={d.option} height={360} label="Cumulative fire-days for 2015, 2019, 2023 and 2026" />
      <h2>Fire radiative power (VIIRS era)</h2>
      <Chart option={d.foption} height={320} label="Cumulative fire radiative power for 2015, 2019, 2023 and 2026" />
      <div className="cards">
        <div className="tile"><div className="k">1. The yardstick</div><div className="s">2015 is the reference fire year: {Math.round(r15.total).toLocaleString()} fire-days over the full year, {Math.round(r15.ytd).toLocaleString()} by week {d.w}.</div></div>
        <div className="tile"><div className="k">2. The other years</div><div className="s">2019: {Math.round(d.rows[1].total).toLocaleString()}. 2023: {Math.round(d.rows[2].total).toLocaleString()}. Full-year totals.</div></div>
        <div className="tile"><div className="k">3. Is {r26.y} worse than 2015?</div><div className="s">By week {d.w}, {r26.y} stands at {Math.round(r26.ytd).toLocaleString()} fire-days, {ratio == null ? "n/a" : `${(ratio * 100).toFixed(0)}% of 2015`} for the same weeks. Fire-days count how often cells burn. They do not measure how intense the fires are.</div></div>
        <div className="tile"><div className="k">4. How intense? (fire radiative power)</div><div className="s">By week {d.w}, {r26.y} stands at {Math.round(r26.fytd).toLocaleString()} MW of summed daily peak FRP, {fratio == null ? "n/a" : `${(fratio * 100).toFixed(0)}% of 2015`} for the same weeks. FRP is a heat measure from VIIRS (2012 onward). It is not burned area, and it is not harmonized with MODIS.</div></div>
      </div>
    </section>
  );
}
