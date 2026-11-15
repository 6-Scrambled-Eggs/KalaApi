import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, HeatmapChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, TitleComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([BarChart, HeatmapChart, LineChart, GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, TitleComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

/** Chart theme: matches the page tokens in styles.css (paper, ink, Public Sans). */
const INK = "#1d1a17", INK2 = "#3b3631", MUTE = "#635d56", LINE = "#e3dcd0", LINE2 = "#cbc1b1";
const axis = {
  axisLine: { lineStyle: { color: LINE2 } }, axisTick: { lineStyle: { color: LINE2 } },
  axisLabel: { color: MUTE }, nameTextStyle: { color: MUTE }, splitLine: { lineStyle: { color: LINE } },
};
echarts.registerTheme("kala", {
  textStyle: { fontFamily: '"Public Sans Variable", system-ui, sans-serif', color: INK2 },
  title: { textStyle: { color: INK, fontWeight: 600 } },
  legend: { textStyle: { color: INK2 }, itemGap: 14 },
  categoryAxis: { ...axis, splitLine: { show: false } },
  valueAxis: axis,
  tooltip: {
    backgroundColor: "rgba(29,26,23,0.94)", borderWidth: 0, padding: [8, 11],
    textStyle: { color: "#f7f4ee", fontSize: 13 },
    extraCssText: "border-radius:8px;box-shadow:0 6px 20px -6px rgba(29,26,23,.35);font-variant-numeric:tabular-nums;",
  },
  visualMap: { textStyle: { color: MUTE } },
});

type Props = { option: any; height: number; onClick?: (p: any) => void; label?: string; onReady?: (c: echarts.ECharts) => void };

/** Thin ECharts wrapper: one instance per mount, resizes with its box. */
export default function Chart({ option, height, onClick, label, onReady }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<echarts.ECharts | null>(null);
  const opt = useRef(option);
  opt.current = option;
  useEffect(() => {
    if (!ref.current) return;
    const c = echarts.init(ref.current, "kala");
    inst.current = c;
    onReady?.(c);
    const onResize = () => c.resize();
    window.addEventListener("orientationchange", onResize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    ro?.observe(ref.current);
    if (!ro) window.addEventListener("resize", onResize);
    // Canvas text is drawn once; redraw after the web font arrives so labels do not stay in the fallback face.
    let live = true;
    document.fonts?.ready.then(() => { if (live && !c.isDisposed()) c.setOption(opt.current, true); }).catch(() => undefined);
    return () => { live = false; ro?.disconnect(); window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); c.dispose(); inst.current = null; };
  }, []);
  useEffect(() => { inst.current?.setOption(option, true); }, [option]);
  useEffect(() => {
    const c = inst.current;
    if (!c || !onClick) return;
    c.off("click");
    c.on("click", onClick);
  }, [onClick]);
  return <div ref={ref} style={{ width: "100%", maxWidth: "100%", height, overflow: "hidden", position: "relative" }} role="img" aria-label={label} />;
}
