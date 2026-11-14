import { useMemo } from "react";
import Chart from "./Chart";
import { Area, WPY, matrix, weekLabel } from "./data";
import { useT } from "./i18n";

export type Mode = "h" | "m" | "v";

export default function Calendar({ area, mode, year, onYear }: { area: Area; mode: Mode; year: number; onYear: (y: number) => void }) {
  const { t } = useT();
  const option = useMemo(() => {
    const years: number[] = [];
    for (let y = area.start_year; y <= area.last_year; y++) years.push(y);
    const src = mode === "h" ? area.h : mode === "m" ? area.m : area.v;
    const M = matrix(src), H = matrix(area.h), LO = matrix(area.lo), HI = matrix(area.hi);
    const MM = matrix(area.m), VV = matrix(area.v), P = matrix(area.pct);
    const vals: number[] = [];
    const data: [number, number, number | string][] = [];
    M.forEach((row, yi) => row.forEach((v, w) => {
      data.push([w, yi, v == null ? "-" : v]);
      if (v != null) vals.push(v);
    }));
    vals.sort((a, b) => a - b);
    const vmax = Math.max(5, vals[Math.floor(vals.length * 0.99)] || 5);
    const lastBack = Math.floor(area.back_cast_end_slot / WPY);
    return {
      grid: { left: 52, right: 16, top: 12, bottom: 56 },
      tooltip: {
        formatter: (p: any) => {
          const [w, yi] = p.value as number[];
          const y = area.start_year + yi;
          const f = (a: (number | null)[][]) => (a[yi][w] == null ? "n/a" : String(a[yi][w]));
          const est = y < 2012 || (y === 2012 && w < 3);
          const band = est && LO[yi][w] != null ? ` (90%: ${LO[yi][w]} to ${HI[yi][w]})` : "";
          const pct = P[yi][w] == null ? "" : `<br/>${t("pctile")}: ${P[yi][w]}`;
          return `<b>${y}, ${t("week")} ${w + 1}</b> (from ${weekLabel(w + 1)})<br/>` +
            `${t("harmonized")}: ${f(H)}${band}${est ? " *" : ""}<br/>${t("rawModis")}: ${f(MM)}<br/>${t("rawViirs")}: ${f(VV)}${pct}`;
        },
      },
      xAxis: { type: "category", data: Array.from({ length: WPY }, (_, i) => String(i + 1)), name: t("week"), nameLocation: "middle", nameGap: 30, splitArea: { show: false } },
      yAxis: { type: "category", data: years.map(String), inverse: true, axisLabel: { interval: 1 } },
      visualMap: { min: 0, max: vmax, calculable: false, orient: "horizontal", left: "center", bottom: 0, itemWidth: 12, itemHeight: 160, text: [t("fireDays"), ""], inRange: { color: ["#fff7bc", "#fec44f", "#fe9929", "#d95f0e", "#993404", "#4d1a02"] } },
      series: [{
        type: "heatmap", data, progressive: 0,
        itemStyle: { borderColor: "#fff", borderWidth: 0.5 },
        markArea: { silent: true, itemStyle: { color: "rgba(255,255,255,0.35)" }, label: { show: true, position: "insideTopRight", color: "#555", fontSize: 11, formatter: t("estimate") }, data: [[{ yAxis: String(years[0]) }, { yAxis: String(years[Math.min(lastBack, years.length - 1)] - 1) }]] },
        markLine: { silent: true, symbol: "none", lineStyle: { color: "#111", type: "dashed" }, label: { formatter: "VIIRS", position: "insideEndTop" }, data: [{ yAxis: String(area.start_year + lastBack) }] },
        emphasis: { itemStyle: { borderColor: "#000", borderWidth: 1 } },
      }],
    } as any;
  }, [area, mode, t]);
  const onClick = useMemo(() => (p: any) => { if (p?.value) onYear(area.start_year + (p.value as number[])[1]); }, [area, onYear]);
  return <Chart option={option} height={560} onClick={onClick} label={`${t("calendar")}: ${area.name}`} />;
}
