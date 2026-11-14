import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AreaIndex, loadProvinces } from "./data";
import { useT } from "./i18n";
import Legend from "./Legend";

/** Home map: provinces shaded by this year's fire-days vs the same weeks in 2001-2025 (percentile rank). */
export default function MapView({ index, onSelect }: { index: AreaIndex[]; onSelect: (id: string) => void }) {
  const { t } = useT();
  const el = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<string>("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!el.current) return;
    const map = new maplibregl.Map({
      container: el.current,
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#e8eef3" } }] },
      bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: 12 }, attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const pct = new Map(index.filter((a) => a.level === "province").map((a) => [a.id, a]));
    map.on("load", async () => {
      const fc = await loadProvinces();
      fc.features.forEach((f) => {
        const a = pct.get((f.properties as any).id);
        (f.properties as any).pct = a ? a.ytd_pct : -1;
        (f.properties as any).ratio = a?.ytd_ratio ?? null;
      });
      map.addSource("prov", { type: "geojson", data: fc });
      map.addLayer({ id: "fill", type: "fill", source: "prov", paint: {
        "fill-color": ["case", ["<", ["get", "pct"], 0], "#ccc", ["interpolate", ["linear"], ["get", "pct"], 0, "#fff7bc", 50, "#fe9929", 90, "#d95f0e", 100, "#4d1a02"]],
        "fill-opacity": 0.92 } });
      map.addLayer({ id: "line", type: "line", source: "prov", paint: { "line-color": "#fff", "line-width": 0.8 } });
      setReady(true);
      map.on("click", "fill", (e) => { const f = e.features?.[0]; if (f) onSelect((f.properties as any).id); });
      map.on("mousemove", "fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const p = e.features?.[0]?.properties as any;
        if (p) setTip(`${p.name}: ${t("pctile")} ${Math.round(p.pct)}${p.ratio ? `, ×${p.ratio} of normal` : ""}`);
      });
      map.on("mouseleave", "fill", () => { map.getCanvas().style.cursor = ""; setTip(""); });
    });
    const fit = () => { map.resize(); map.fitBounds([[94, -11.5], [141.5, 6.5]], { padding: 12, duration: 0 }); };
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(el.current);
    window.addEventListener("orientationchange", fit);
    window.addEventListener("resize", fit);
    return () => { ro?.disconnect(); window.removeEventListener("orientationchange", fit); window.removeEventListener("resize", fit); map.remove(); };
  }, [index]);
  return (
    <div className="mapWrap">
      <div className="mapBox">
        <div ref={el} className="map" role="img" aria-label="Map of Indonesian provinces shaded by this year's fire activity" />
        {!ready && <div className="mapLoad">{t("loadingMap")}</div>}
        <div className="mapTip">{tip || t("mapHint")}</div>
      </div>
      <Legend title={t("legMapTitle")} stops={[["#fff7bc", 0], ["#fe9929", 50], ["#d95f0e", 90], ["#4d1a02", 100]]} low={t("legQuiet")} high={t("legBusy")} extra={t("legNoData")} />
    </div>
  );
}
