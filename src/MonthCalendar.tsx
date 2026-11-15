import { useMemo } from "react";
import Chart from "./Chart";
import { Area, dateLocale } from "./data";
import { useL } from "./i18n";

const INK = "#16212b", MUTE = "#4a5864", FONT = '"Archivo Variable", system-ui, sans-serif';
const COLS = ["#fffbe6", "#fee391", "#fec44f", "#fe9929", "#d95f0e", "#993404", "#4d1a02"];
const GRID = { left: 58, right: 62, top: 30, bottom: 66 }, ROW = 20;

/** Months with fewer days than this in the data are left out of the grid (the tile shows month-to-date instead). */
export const MIN_DAYS = 7;

/** Year x month calendar of harmonized fire-days. Same colour logic as the weekly calendar. */
export default function MonthCalendar({ area, year, onYear, onReady }: { area: Area; year: number; onYear: (y: number) => void; onReady?: (c: any) => void }) {
  const L = useL();
  const nYears = area.last_year - area.start_year + 1;
  const height = GRID.top + GRID.bottom + ROW * nYears;
  const option = useMemo(() => {
    const mh = area.mh ?? [], lo = area.mlo ?? [], hi = area.mhi ?? [];
    const hide = area.mpartial && area.mpartial.days < MIN_DAYS ? area.mpartial.index : -1;
    const val = (i: number) => (i === hide || mh[i] == null ? null : mh[i]);
    const data: [number, number, number | string][] = [];
    const vals: number[] = [];
    for (let y = 0; y < nYears; y++) for (let m = 0; m < 12; m++) {
      const v = val(y * 12 + m);
      data.push([m, y, v == null ? "-" : v]);
      if (v != null) vals.push(v);
    }
    const nz = vals.filter((v) => v > 0).sort((a, b) => a - b);
    const q = (f: number) => Math.round(nz[Math.min(nz.length - 1, Math.floor(nz.length * f))] ?? 1);
    const cuts = Array.from(new Set([1, q(0.2), q(0.4), q(0.6), q(0.8), q(0.95)].filter((c) => c >= 1))).sort((a, b) => a - b);
    const pieces: any[] = [{ min: 0, max: 0, label: "0", color: COLS[0] }];
    cuts.forEach((c, i) => {
      const h = i + 1 < cuts.length ? cuts[i + 1] - 1 : null;
      const f = (n: number) => n.toLocaleString(dateLocale.v);
      pieces.push(h == null ? { min: c, label: `${f(c)}+`, color: COLS[Math.min(i + 1, 6)] } : { min: c, max: h, label: h > c ? `${f(c)}–${f(h)}` : f(c), color: COLS[Math.min(i + 1, 6)] });
    });
    const mname = (m: number, style: "short" | "long" = "short") => new Date(Date.UTC(2001, m, 1)).toLocaleDateString(dateLocale.v, { month: style, timeZone: "UTC" });
    const totals = Array.from({ length: nYears }, (_, y) => Math.round(Array.from({ length: 12 }, (_, m) => val(y * 12 + m) ?? 0).reduce((a, b) => a + b, 0)).toLocaleString(dateLocale.v));
    const lastBack = Math.floor(area.back_cast_end_slot / 52);
    const med = area.mstat?.med ?? [];
    return {
      grid: GRID,
      title: { text: L("Fire-days per month", "Hari-api per bulan"), right: 2, top: 10, textStyle: { fontSize: 10, fontWeight: 600, color: MUTE, fontFamily: FONT } },
      tooltip: {
        formatter: (p: any) => {
          const [m, yi] = p.value as number[];
          const y = area.start_year + yi, i = yi * 12 + m;
          const v = val(i);
          if (v == null) return `<b>${mname(m, "long")} ${y}</b><br/>–`;
          const est = y < 2012;
          const band = est && lo[i] != null ? ` (90%: ${Math.round(lo[i]!).toLocaleString(dateLocale.v)} ${L("to", "sampai")} ${Math.round(hi[i]!).toLocaleString(dateLocale.v)})` : "";
          const partial = area.mpartial && area.mpartial.index === i ? ` (${area.mpartial.days}/${area.mpartial.days_in_month} ${L("days", "hari")})` : "";
          return `<b>${mname(m, "long")} ${y}</b>${partial}<br/>${L("Harmonized", "Harmonisasi")}: ${Math.round(v).toLocaleString(dateLocale.v)}${band}${est ? " *" : ""}<br/>${L("Median 2001–2025", "Median 2001–2025")}: ${Math.round(med[m] ?? 0).toLocaleString(dateLocale.v)}`;
        },
      },
      xAxis: [
        { type: "category", data: Array.from({ length: 12 }, (_, m) => mname(m)), axisLine: { lineStyle: { color: INK } }, axisTick: { show: false }, axisLabel: { color: MUTE, fontSize: 11, interval: 0 } },
      ],
      yAxis: [
        { type: "category", data: Array.from({ length: nYears }, (_, i) => String(area.start_year + i)), inverse: true, axisLine: { lineStyle: { color: INK } }, axisTick: { show: false }, axisLabel: { interval: 0, fontSize: 11, color: MUTE, fontFamily: FONT, formatter: (v: string) => (v === String(area.last_year) ? `{c|${v}}` : v), rich: { c: { color: INK, fontWeight: 800 } } } },
        { type: "category", data: totals, inverse: true, position: "right", axisLine: { lineStyle: { color: INK } }, axisTick: { show: false }, axisLabel: { interval: 0, fontSize: 10.5, color: INK, fontFamily: FONT } },
      ],
      visualMap: { type: "piecewise", pieces, orient: "horizontal", left: 40, bottom: 4, itemWidth: 20, itemHeight: 12, itemGap: 8, textStyle: { fontSize: 10.5, color: INK, fontFamily: FONT } },
      series: [{
        type: "heatmap", data, progressive: 0, itemStyle: { borderColor: "#ffffff", borderWidth: 0.6 },
        markLine: { silent: true, symbol: "none", lineStyle: { color: INK, type: "dashed" }, label: { formatter: "VIIRS", position: "insideEndTop", color: INK, fontWeight: 700 }, data: [{ yAxis: String(area.start_year + lastBack) }] },
        emphasis: { itemStyle: { borderColor: INK, borderWidth: 1.5 } },
      }],
    } as any;
  }, [area, nYears, L]);
  const onClick = useMemo(() => (p: any) => { if (p?.value) onYear(area.start_year + (p.value as number[])[1]); }, [area, onYear]);
  void year;
  return <Chart option={option} height={height} onClick={onClick} onReady={onReady} label={`${L("Monthly calendar", "Kalender bulanan")}: ${area.name}`} />;
}
