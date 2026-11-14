import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, HeatmapChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, TitleComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([BarChart, HeatmapChart, LineChart, GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, TitleComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

/** Two chart themes: "kala" for the night screens and "kala-paper" for charts inside the white A4 brief.
 *  Both set the app font, quiet axes, a faint grid and a plain tooltip. Options set by each chart still win. */
const FONT = '"Inter Variable", "Inter Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const theme = (t: { ink: string; mute: string; grid: string; axis: string; tipBg: string; tipLine: string; pointer: string; palette: string[] }) => {
  const axisCommon = {
    axisLine: { lineStyle: { color: t.axis } }, axisTick: { show: false },
    axisLabel: { color: t.mute, fontSize: 11.5 }, nameTextStyle: { color: t.mute, fontSize: 11.5 },
    splitLine: { lineStyle: { color: t.grid } },
  };
  return {
    color: t.palette, backgroundColor: "transparent",
    textStyle: { fontFamily: FONT, color: t.ink },
    title: { textStyle: { fontFamily: FONT, fontWeight: 600, color: t.ink } },
    legend: { itemWidth: 14, itemHeight: 8, itemGap: 16, textStyle: { color: t.mute, fontSize: 12 }, inactiveColor: t.axis },
    tooltip: {
      backgroundColor: t.tipBg, borderColor: t.tipLine, borderWidth: 1, padding: [8, 11],
      textStyle: { color: t.ink, fontSize: 12.5, fontFamily: FONT },
      extraCssText: "box-shadow:0 8px 24px rgba(0,0,0,.25);border-radius:6px;font-variant-numeric:tabular-nums;",
      axisPointer: { lineStyle: { color: t.pointer }, crossStyle: { color: t.pointer } },
    },
    categoryAxis: { ...axisCommon, splitLine: { show: false } },
    valueAxis: { ...axisCommon, axisLine: { show: false } },
    visualMap: { textStyle: { color: t.mute, fontSize: 12 } },
  };
};
echarts.registerTheme("kala", theme({ ink: "#f2f0eb", mute: "#a9adc0", grid: "#26304d", axis: "#3b456a", tipBg: "#0e1322", tipLine: "#3b456a", pointer: "#56628f", palette: ["#fe9929", "#e8e2d4", "#8fb8ff", "#c58b4b", "#8e93aa"] }));
echarts.registerTheme("kala-paper", theme({ ink: "#18181b", mute: "#55585c", grid: "#ecece9", axis: "#cfcfcb", tipBg: "#ffffff", tipLine: "#e4e4e1", pointer: "#a3a39e", palette: ["#d95f0e", "#3f3f46", "#1f5f8b", "#993404", "#8a8a85"] }));

type Props = { option: any; height: number; onClick?: (p: any) => void; label?: string; onReady?: (c: echarts.ECharts) => void };

/** Thin ECharts wrapper: one instance per mount, resizes with its box. */
export default function Chart({ option, height, onClick, label, onReady }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<echarts.ECharts | null>(null);
  const opt = useRef(option);
  opt.current = option;
  useEffect(() => {
    if (!ref.current) return;
    inst.current = echarts.init(ref.current, ref.current.closest(".a4") ? "kala-paper" : "kala");
    onReady?.(inst.current);
    const onResize = () => inst.current?.resize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    ro?.observe(ref.current);
    // Canvas text is drawn once; redraw when the web font has arrived so labels use it.
    let live = true;
    document.fonts?.ready.then(() => { if (live && inst.current) inst.current.setOption(opt.current, true); }).catch(() => undefined);
    return () => { live = false; ro?.disconnect(); window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); inst.current?.dispose(); inst.current = null; };
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
