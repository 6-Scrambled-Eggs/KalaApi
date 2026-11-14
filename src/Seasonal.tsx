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
      grid: { left: 52, right: 16, top: 56, bottom: 36 },
      legend: { top: 4, icon: "roundRect", data: ["median 2001-2025", "10-90%", String(year)] },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: weeks, name: t("week"), nameLocation: "middle", nameGap: 24 },
      yAxis: { type: "value", name: t("fireDays"), nameGap: 12 },
      series: [
        { name: "p10", type: "line", data: r(s.p10), stack: "band", symbol: "none", lineStyle: { opacity: 0 }, tooltip: { show: false } },
        { name: "10-90%", type: "line", data: r(s.p90.map((x, i) => x - s.p10[i])), stack: "band", symbol: "none", lineStyle: { opacity: 0 }, itemStyle: { color: "#3b456a" }, areaStyle: { color: "#3b456a", opacity: 0.75 } },
        { name: "median 2001-2025", type: "line", data: r(s.med), symbol: "none", lineStyle: { color: "#c9ccda", width: 2 }, itemStyle: { color: "#c9ccda" } },
        { name: String(year), type: "line", data: cur, symbol: "none", lineStyle: { color: "#fe9929", width: 2.5 }, itemStyle: { color: "#fe9929" } },
      ],
    } as any;
  }, [area, year, t]);
  return <Chart option={option} height={360} label={`${t("profile")}: ${area.name}, ${year}`} />;
}
