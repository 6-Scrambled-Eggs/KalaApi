import { useEffect, useMemo, useRef } from "react";
import Chart from "./Chart";
import { Area, Oni, WPY, dateLocale, matrix, nf, weekLabel } from "./data";
import { fmt, useT } from "./i18n";
import { buildPieces } from "./pieces";
import { PieceLegend as Legend, useLegendRef } from "./PieceLegend";
import { shortNum } from "./num";

/** Chart colours mirror the tokens in styles.css (--ink, --mute). */
const INK = "#16212b", MUTE = "#4a5864", FONT = '"Archivo Variable", system-ui, sans-serif';
const GRID = { left: 90, right: 96, top: 38, bottom: 82 }, ROW = 22;

/** Index of the 7-day block that holds the 1st of each month (week 1 starts 1 Jan). */
const MONTH_START = Array.from({ length: 12 }, (_, m) => Math.floor((Date.UTC(2001, m, 1) - Date.UTC(2001, 0, 1)) / 6048e5));

export type Mode = "h" | "m" | "v" | "p" | "n" | "a";

export default function Calendar({ area, mode, year, onYear, oni, onReady }: { area: Area; mode: Mode; year: number; onYear: (y: number) => void; oni?: Oni | null; onReady?: (c: any) => void }) {
  const { t } = useT();
  const legendRef = useLegendRef();
  const option = useMemo(() => {
    const years: number[] = [];
    for (let y = area.start_year; y <= area.last_year; y++) years.push(y);
    const src = mode === "a" ? area.pct : mode === "m" ? area.m : mode === "v" ? area.v : mode === "p" ? (area.h_peat ?? area.h) : mode === "n" ? (area.h_min ?? area.h) : area.h;
    const M = matrix(src), H = matrix(area.h), LO = matrix(area.lo), HI = matrix(area.hi);
    const MM = matrix(area.m), VV = matrix(area.v), P = matrix(area.pct);
    const vals: number[] = [];
    const data: [number, number, number | string][] = [];
    const pv = mode === "h" && area.prov && area.prov.weeks.length ? area.prov : null;  // provisional NOAA-20 weeks (separate layer)
    const pyi = pv ? pv.year - area.start_year : -1;
    M.forEach((row, yi) => row.forEach((v, w) => {
      const k = pv && yi === pyi ? pv.weeks.findIndex((x) => x.week === w + 1) : -1;
      if (v == null && k >= 0) { const pw = pv!.weeks[k]; data.push({ value: [w, yi, pw.value], itemStyle: { ...(pw.days < 7 ? { borderColor: "#16212b", borderWidth: 1.6, borderType: "dashed" } : {}), decal: { symbol: "rect", symbolSize: 1, rotation: Math.PI / 4, dashArrayX: [1, 0], dashArrayY: [2, 3], color: "rgba(22,33,43,.6)" } } } as any); vals.push(pw.value); return; }
      data.push([w, yi, v == null ? "-" : v]);
      if (v != null) vals.push(v);
    }));
    vals.sort((a, b) => a - b);
    const anom = mode === "a";
    const vmax = anom ? 100 : Math.max(5, vals[Math.floor(vals.length * 0.99)] || 5);
    // Quantile colour classes (non-zero values) so quiet and busy weeks look different; half-open ranges (src/pieces.ts).
    const pieces = buildPieces(vals, shortNum);
    legendRef.current = anom ? [] : pieces;
    const lastBack = Math.floor(area.back_cast_end_slot / WPY);
    const weeks = Array.from({ length: WPY }, (_, i) => String(i + 1));
    const months = MONTH_START.map((_, m) => new Date(Date.UTC(2001, m, 1)).toLocaleDateString(dateLocale.v, { month: "short", timeZone: "UTC" }).slice(0, 3));
    const totals = (mode === "a" ? H : M).map((row) => Math.round(row.reduce<number>((a, v) => a + (v ?? 0), 0)).toLocaleString(dateLocale.v));
    return {
      grid: GRID,
      title: { text: t("fireDays"), right: 2, top: 10, textStyle: { fontSize: 12, fontWeight: 600, color: MUTE, fontFamily: FONT } },
      tooltip: {
        formatter: (p: any) => {
          const [w, yi] = p.value as number[];
          const y = area.start_year + yi;
          const f = (a: (number | null)[][]) => (a[yi][w] == null ? "–" : String(a[yi][w]));
          const pk = pv && yi === pyi ? pv.weeks.findIndex((x) => x.week === w + 1) : -1;
          if (pk >= 0) {
            const pw = pv!.weeks[pk];
            return `<b>${y}, ${t("week")} ${w + 1}</b> (${t("fromWord")} ${weekLabel(w + 1)})<br/><i>${t("provTip")}</i><br/>${t("harmonized")}: ${nf(pw.value, 1)}${pw.days < 7 ? `<br/><i>${fmt(t("provWeekTip"), pw.days)}</i>` : ""}`;
          }
          const est = y < 2012 || (y === 2012 && w < 3);
          const band = est && LO[yi][w] != null ? ` (90%: ${LO[yi][w]} to ${HI[yi][w]})` : "";
          const pct = P[yi][w] == null ? "" : `<br/>${t("pctile").charAt(0).toUpperCase() + t("pctile").slice(1)}: ${P[yi][w]}`;
          return `<b>${y}, ${t("week")} ${w + 1}</b> (${t("fromWord")} ${weekLabel(w + 1)})<br/>` +
            `${t("harmonized")}: ${f(H)}${band}${est ? " *" : ""}<br/>${t("rawModis")}: ${f(MM)}<br/>${t("rawViirs")}: ${f(VV)}${pct}`;
        },
      },
      xAxis: [
        { type: "category", data: weeks, splitArea: { show: false }, axisLine: { lineStyle: { color: INK } }, axisTick: { show: true, inside: true, length: 5, interval: (i: number) => MONTH_START.includes(i), lineStyle: { color: INK } }, axisLabel: { color: MUTE, fontSize: 13, align: "left", interval: (i: number) => MONTH_START.includes(i), formatter: (_v: string, i: number) => months[MONTH_START.indexOf(i)] ?? "" } },
        { type: "category", data: weeks, position: "top", axisLine: { lineStyle: { color: INK } }, axisTick: { show: true, inside: true, length: 5, interval: 0, lineStyle: { color: INK } }, axisLabel: { color: INK, fontSize: 12, fontWeight: 600, interval: (i: number) => [0, 9, 19, 29, 39, 51].includes(i) } },
      ],
      yAxis: [
        {
          type: "category", data: years.map(String), inverse: true, axisLine: { lineStyle: { color: INK } }, axisTick: { show: false },
          axisLabel: {
            interval: 0, fontSize: 13, color: "#4a5864", fontFamily: FONT,
            rich: { n: { color: "transparent" }, e: { color: INK }, l: { color: INK }, c: { color: INK, fontWeight: 800 } },
            formatter: (v: string) => {
              const o = oni?.jas?.[v];
              const m = o == null ? "n" : o >= 0.5 ? "e" : o <= -0.5 ? "l" : "n";
              return `{${m}|${m === "l" ? "○" : "●"}} ${v === String(area.last_year) ? `{c|${v}}` : v}`;
            },
          },
        },
        {
          type: "category", data: totals, inverse: true, position: "right", axisLine: { lineStyle: { color: INK } }, axisTick: { show: false },
          axisLabel: { interval: 0, fontSize: 13, color: INK, fontFamily: FONT },
        },
      ],
      visualMap: anom
        ? { type: "continuous", min: 0, max: vmax, calculable: false, orient: "horizontal", left: 56, bottom: 0, itemWidth: 12, itemHeight: 160, text: [t("busiest"), t("quietest")], inRange: { color: ["#2b6cb0", "#a6cee3", "#f5f5f5", "#fdae61", "#a63603"] } }
        : { type: "piecewise", pieces, show: false },
      series: [{
        type: "heatmap", data, progressive: 0,
        itemStyle: { borderColor: "#ffffff", borderWidth: 0.5 },
        markLine: { silent: true, symbol: "none", lineStyle: { color: INK, type: "dashed" }, label: { formatter: "VIIRS", position: "insideEndTop", color: INK, fontWeight: 700 }, data: [{ yAxis: String(area.start_year + lastBack) }] },
        emphasis: { itemStyle: { borderColor: INK, borderWidth: 1.5 } },
      }],
    } as any;
  }, [area, mode, t, oni, dateLocale.v]);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current, peak = area.typical_period?.peak;
    if (!el || !peak || el.scrollWidth <= el.clientWidth + 4) return;
    const tm = setTimeout(() => { el.scrollLeft = Math.max(0, ((peak - 0.5) / WPY) * el.scrollWidth - el.clientWidth / 2); }, 60);
    return () => clearTimeout(tm);
  }, [area.id]);
  const onClick = useMemo(() => (p: any) => { if (p?.value) onYear(area.start_year + (p.value as number[])[1]); }, [area, onYear]);
  // Back-cast years carry a drawn bracket in the year collar, so "estimated" is visible without a hover.
  const nYears = area.last_year - area.start_year + 1;
  const nBack = Math.min(Math.floor(area.back_cast_end_slot / WPY), nYears);
  const height = GRID.top + GRID.bottom + ROW * nYears;
  return (
    <><div className="calscroll" ref={scroller}><div className="calinner" style={{ minWidth: 860 }}>
      {nBack > 0 && <div className="estbr" style={{ top: GRID.top + 2, height: ROW * nBack - 4 }}><span>{t("estimate")}</span></div>}
      <Chart option={option} height={height} onClick={onClick} onReady={onReady} label={`${t("calendar")}: ${area.name}`} />
    </div></div>
    <Legend pieces={legendRef.current} extra={mode === "h" && area.prov && area.prov.weeks.length ? t("provLegend") : undefined} />
    </>
  );
}
