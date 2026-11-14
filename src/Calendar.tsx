import { useEffect, useMemo, useRef } from "react";
import Chart from "./Chart";
import { Area, Oni, WPY, matrix, weekLabel } from "./data";
import { useT } from "./i18n";

export type Mode = "h" | "m" | "v" | "p" | "n" | "a";

export default function Calendar({ area, mode, year, onYear, oni, onReady }: { area: Area; mode: Mode; year: number; onYear: (y: number) => void; oni?: Oni | null; onReady?: (c: any) => void }) {
  const { t } = useT();
  const box = useRef<HTMLDivElement>(null);
  // On narrow screens the calendar scrolls sideways; open it on the area's fire season, not on January.
  useEffect(() => {
    const el = box.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const w = el.scrollWidth, left = 52, right = 16;
    const x = left + ((area.typical_period.peak - 0.5) / WPY) * (w - left - right);
    el.scrollLeft = Math.max(0, x - el.clientWidth / 2);
  }, [area]);
  const option = useMemo(() => {
    const years: number[] = [];
    for (let y = area.start_year; y <= area.last_year; y++) years.push(y);
    const src = mode === "a" ? area.pct : mode === "m" ? area.m : mode === "v" ? area.v : mode === "p" ? (area.h_peat ?? area.h) : mode === "n" ? (area.h_min ?? area.h) : area.h;
    const M = matrix(src), H = matrix(area.h), LO = matrix(area.lo), HI = matrix(area.hi);
    const MM = matrix(area.m), VV = matrix(area.v), P = matrix(area.pct);
    const vals: number[] = [];
    const data: [number, number, number | string][] = [];
    M.forEach((row, yi) => row.forEach((v, w) => {
      data.push([w, yi, v == null ? "-" : v]);
      if (v != null) vals.push(v);
    }));
    vals.sort((a, b) => a - b);
    const anom = mode === "a";
    const vmax = anom ? 100 : Math.max(5, vals[Math.floor(vals.length * 0.99)] || 5);
    const lastBack = Math.floor(area.back_cast_end_slot / WPY);
    return {
      grid: { left: 52, right: 16, top: 12, bottom: 78 },
      tooltip: {
        formatter: (p: any) => {
          const [w, yi] = p.value as number[];
          const y = area.start_year + yi;
          const f = (a: (number | null)[][]) => (a[yi][w] == null ? "n/a" : String(a[yi][w]));
          const est = y < 2012 || (y === 2012 && w < 3);
          const band = est && LO[yi][w] != null ? ` (90%: ${LO[yi][w]} to ${HI[yi][w]})` : "";
          const pct = P[yi][w] == null ? "" : `<br/>${t("pctile").charAt(0).toUpperCase() + t("pctile").slice(1)}: ${P[yi][w]}`;
          return `<b>${y}, ${t("week")} ${w + 1}</b> (${t("fromWord")} ${weekLabel(w + 1)})<br/>` +
            `${t("harmonized")}: ${f(H)}${band}${est ? " *" : ""}<br/>${t("rawModis")}: ${f(MM)}<br/>${t("rawViirs")}: ${f(VV)}${pct}`;
        },
      },
      xAxis: { type: "category", data: Array.from({ length: WPY }, (_, i) => String(i + 1)), name: t("week"), nameLocation: "middle", nameGap: 26, splitArea: { show: false } },
      yAxis: {
        type: "category", data: years.map(String), inverse: true,
        axisLabel: {
          interval: 0, fontSize: 11, color: "#a9adc0", rich: { n: { color: "#6f7591" }, e: { color: "#ff7a6b" }, l: { color: "#8fb8ff" } },
          formatter: (v: string) => {
            const o = oni?.jas?.[v];
            const m = o == null ? "n" : o >= 0.5 ? "e" : o <= -0.5 ? "l" : "n";
            return `{${m}|●} ${v}`;
          },
        },
      },
      visualMap: { min: 0, max: vmax, calculable: false, orient: "horizontal", left: 56, bottom: 0, itemWidth: 12, itemHeight: 160, text: anom ? [t("busiest"), t("quietest")] : [`${vmax}+ ${t("fireDays")}`, "0"], inRange: { color: anom ? ["#8fb8ff", "#3c5a96", "#222b45", "#c2541a", "#fec44f"] : ["#241f33", "#4d1a02", "#993404", "#d95f0e", "#fe9929", "#fec44f", "#fff7bc"] } },
      series: [{
        type: "heatmap", data, progressive: 0,
        itemStyle: { borderColor: "#1a2238", borderWidth: 0.5 },
        markArea: { silent: true, itemStyle: { color: "rgba(232,226,212,0.10)" }, label: { show: true, position: "insideTopRight", color: "#c9ccda", fontSize: 11.5, fontWeight: 500, formatter: t("estimate") }, data: [[{ yAxis: String(years[0]) }, { yAxis: String(years[Math.min(lastBack, years.length - 1)] - 1) }]] },
        markLine: { silent: true, symbol: "none", lineStyle: { color: "#f2f0eb", type: "dashed", width: 1.2 }, label: { formatter: "VIIRS", position: "insideStartTop", color: "#f2f0eb", fontSize: 11.5, fontWeight: 600 }, data: [{ yAxis: String(area.start_year + lastBack) }] },
        emphasis: { itemStyle: { borderColor: "#f2f0eb", borderWidth: 1 } },
      }],
    } as any;
  }, [area, mode, t, oni]);
  const onClick = useMemo(() => (p: any) => { if (p?.value) onYear(area.start_year + (p.value as number[])[1]); }, [area, onYear]);
  return <div className="calscroll" ref={box}><div className="calinner"><Chart option={option} height={640} onClick={onClick} onReady={onReady} label={`${t("calendar")}: ${area.name}`} /></div></div>;
}
