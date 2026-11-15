import { useMemo } from "react";
import Chart from "./Chart";
import { Area, dateLocale } from "./data";
import { useL, useT } from "./i18n";
import { buildPieces } from "./pieces";

const INK = "#16212b", MUTE = "#4a5864", FONT = '"Archivo Variable", system-ui, sans-serif';
const GRID = { left: 58, right: 62, top: 30, bottom: 66 }, ROW = 20;


/** Year x month calendar of harmonized fire-days. Same colour logic as the weekly calendar. */
export default function MonthCalendar({ area, year, onYear, onReady }: { area: Area; year: number; onYear: (y: number) => void; onReady?: (c: any) => void }) {
  const L = useL();
  const { t } = useT();
  const nYears = area.last_year - area.start_year + 1;
  const height = GRID.top + GRID.bottom + ROW * nYears;
  const option = useMemo(() => {
    const mh = area.mh ?? [], lo = area.mlo ?? [], hi = area.mhi ?? [];
    const hide = -1;  // the partial month is drawn too; its tooltip says how many days it holds
    const val = (i: number) => (i === hide || mh[i] == null ? null : mh[i]);
    const data: [number, number, number | string][] = [];
    const pdata: [number, number, number][] = [];  // the partial month: drawn in grey, outside the fire colour ramp
    const pidx = area.mpartial ? area.mpartial.index : -1;
    const vals: number[] = [];
    for (let y = 0; y < nYears; y++) for (let m = 0; m < 12; m++) {
      const i = y * 12 + m, v = val(i);
      if (i === pidx && v != null) { data.push([m, y, "-"]); pdata.push([m, y, v]); continue; }
      data.push([m, y, v == null ? "-" : v]);
      if (v != null) vals.push(v);
    }
    const pieces: any[] = buildPieces(vals, (n) => n.toLocaleString(dateLocale.v));
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
          const pm = area.mpartial && area.mpartial.index === i ? area.mpartial : null;
          const partial = pm ? `<br/><i>${L("Partial month", "Bulan parsial")}: ${pm.days > 1 ? `1–${pm.days}` : "1"} ${mname(m)} ${y}</i>` : "";
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
      visualMap: { type: "piecewise", seriesIndex: 0, pieces, orient: "horizontal", left: 40, bottom: 4, itemWidth: 20, itemHeight: 12, itemGap: 8, textStyle: { fontSize: 10.5, color: INK, fontFamily: FONT } },
      series: [{
        type: "heatmap", data, progressive: 0, itemStyle: { borderColor: "#ffffff", borderWidth: 0.6 },
        markLine: { silent: true, symbol: "none", lineStyle: { color: INK, type: "dashed" }, label: { formatter: "VIIRS", position: "insideEndTop", color: INK, fontWeight: 700 }, data: [{ yAxis: String(area.start_year + lastBack) }] },
        emphasis: { itemStyle: { borderColor: INK, borderWidth: 1.5 } },
      }, {
        type: "heatmap", data: pdata, progressive: 0, silent: false,
        itemStyle: { color: "#d4d8d6", borderColor: INK, borderWidth: 1, borderType: "dashed" },
        emphasis: { itemStyle: { borderColor: INK, borderWidth: 1.5 } },
      }],
    } as any;
  }, [area, nYears, L]);
  const onClick = useMemo(() => (p: any) => { if (p?.value) onYear(area.start_year + (p.value as number[])[1]); }, [area, onYear]);
  void year;
  // Years before the first full S-NPP VIIRS week are estimates: same bracket as the week view.
  const nBack = Math.min(Math.floor(area.back_cast_end_slot / 52), nYears);
  return (
    <div className="calscroll"><div style={{ position: "relative" }}>
      {nBack > 0 && <div className="estbr" style={{ top: GRID.top + 2, height: ROW * nBack - 4 }}><span>{t("estimate")}</span></div>}
      <Chart option={option} height={height} onClick={onClick} onReady={onReady} label={`${L("Monthly calendar", "Kalender bulanan")}: ${area.name}`} />
      {area.mpartial && <p className="partialkey"><i aria-hidden="true" />{L("partial", "parsial")}: {L("incomplete month, not on the colour scale", "bulan belum lengkap, di luar skala warna")}</p>}
    </div></div>
  );
}
