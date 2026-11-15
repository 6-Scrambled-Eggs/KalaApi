import { useMemo } from "react";
import Chart from "./Chart";
import { Area, WPY, matrix, seasonal } from "./data";
import { useT } from "./i18n";

export default function Seasonal({ area, year }: { area: Area; year: number }) {
  const { t } = useT();
  const option = useMemo(() => {
    const s = seasonal(area);
    const M = matrix(area.h);
    const cur = (M[year - area.start_year] || []).map((v) => (v == null ? "-" : v));
    const weeks = Array.from({ length: WPY }, (_, i) => String(i + 1));
    const r = (a: number[]) => a.map((x) => Math.round(x * 10) / 10);
    return {
      grid: { left: 52, right: 16, top: 52, bottom: 36 },
      legend: { top: 0, icon: "rect", itemWidth: 18, itemHeight: 4, data: [t("medianName"), t("bandName"), String(year)] },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: weeks, name: t("week"), nameLocation: "middle", nameGap: 24 },
      yAxis: { type: "value", name: t("fireDays"), nameGap: 12 },
      series: [
        { name: "p10", type: "line", data: r(s.p10), stack: "band", symbol: "none", lineStyle: { opacity: 0 }, tooltip: { show: false } },
        { name: t("bandName"), type: "line", data: r(s.p90.map((x, i) => x - s.p10[i])), stack: "band", symbol: "none", lineStyle: { opacity: 0 }, areaStyle: { color: "#c5cdc8", opacity: 0.55 }, itemStyle: { color: "#c5cdc8" } },
        { name: t("medianName"), type: "line", data: r(s.med), symbol: "none", lineStyle: { color: "#6b7a84", width: 2 }, itemStyle: { color: "#6b7a84" } },
        { name: String(year), type: "line", data: cur, symbol: "none", lineStyle: { color: "#16212b", width: 3 }, itemStyle: { color: "#16212b" } },
      ],
    } as any;
  }, [area, year, t]);
  return <Chart option={option} height={300} label={`${t("profile")}: ${area.name}, ${year}`} />;
}
