import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AreaIndex, loadProvinces } from "./data";
import { fmt, useT } from "./i18n";
import Legend from "./Legend";
import { onHighlight, setHighlight } from "./hl";

const LONS = [95, 100, 105, 110, 115, 120, 125, 130, 135, 140], LATS = [5, 0, -5, -10];
type Grat = { x: { v: number; px: number }[]; y: { v: number; px: number }[] };

/** Home map: provinces shaded by this year's fire-days vs the same weeks in 2001-2025 (percentile rank). */
export default function MapView({ index, onSelect }: { index: AreaIndex[]; onSelect: (id: string) => void }) {
  const { lang, t } = useT();
  const el = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [grat, setGrat] = useState<Grat>({ x: [], y: [] });
  // The map is built once; read labels through a ref so a language switch reaches the hover text.
  const tr = useRef(t);
  tr.current = t;
  useEffect(() => {
    if (!el.current) return;
    const map = new maplibregl.Map({
      container: el.current,
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#d4e6f0" } }] },
      bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: 12 }, attributionControl: false, scrollZoom: false, dragRotate: false,
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
        "fill-color": ["case", ["<", ["get", "pct"], 0], "#cccccc", ["interpolate", ["linear"], ["get", "pct"], 0, "#fff7bc", 50, "#fe9929", 90, "#d95f0e", 100, "#4d1a02"]],
        "fill-opacity": 0.92 } });
      map.addLayer({ id: "line", type: "line", source: "prov", paint: { "line-color": "#ffffff", "line-width": 0.8 } });
      map.addLayer({ id: "hl", type: "line", source: "prov", paint: { "line-color": "#0f4c6e", "line-width": 2.5 }, filter: ["==", ["get", "id"], ""] });
      offHl = onHighlight((hid) => map.getLayer("hl") && map.setFilter("hl", ["==", ["get", "id"], hid ?? ""]));
      setReady(true);
      map.on("click", "fill", (e) => { const f = e.features?.[0]; if (f) onSelect((f.properties as any).id); });
      map.on("mousemove", "fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const p = e.features?.[0]?.properties as any;
        if (p) setHighlight(p.id);
        if (p) setTip(p.pct < 0 ? `${p.name}: ${tr.current("legNoData")}` : `${p.name}: ${tr.current("pctile")} ${Math.round(p.pct)}${p.ratio ? `, ${fmt(tr.current("ofNormal"), p.ratio)}` : ""}`);
      });
      map.on("mouseleave", "fill", () => { map.getCanvas().style.cursor = ""; setTip(""); setHighlight(null); });
    });
    let offHl = () => {};
    // Graticule labels sit outside the neat-line, so they are positioned from the map's own projection.
    const place = () => {
      const w = el.current?.clientWidth ?? 0, h = el.current?.clientHeight ?? 0;
      setGrat({
        x: LONS.map((v) => ({ v, px: map.project([v, 0]).x })).filter((g) => g.px > 12 && g.px < w - 12),
        y: LATS.map((v) => ({ v, px: map.project([118, v]).y })).filter((g) => g.px > 8 && g.px < h - 8),
      });
    };
    map.on("moveend", place);
    map.once("load", place);
    const fit = () => { map.resize(); map.fitBounds([[94, -11.5], [141.5, 6.5]], { padding: 12, duration: 0 }); place(); };
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(el.current);
    window.addEventListener("orientationchange", fit);
    window.addEventListener("resize", fit);
    return () => { offHl(); ro?.disconnect(); window.removeEventListener("orientationchange", fit); window.removeEventListener("resize", fit); map.remove(); };
  }, [index]);
  return (
    <div className="mapWrap gr">
      <div className="mapBox">
        <div ref={el} className="map" role="img" aria-label="Map of Indonesian provinces shaded by this year's fire activity" />
        {!ready && <div className="mapLoad">{t("loadingMap")}</div>}
        {grat.x.map((g) => <span key={`x${g.v}`} className="grat x" style={{ left: 34 + g.px }}>{g.v}° {lang === "id" ? "BT" : "E"}</span>)}
        {grat.y.map((g) => <span key={`y${g.v}`} className="grat y" style={{ top: 16 + g.px }}>{Math.abs(g.v)}°{g.v === 0 ? "" : g.v > 0 ? (lang === "id" ? " LU" : " N") : (lang === "id" ? " LS" : " S")}</span>)}
        <div className="mapTip">{tip || t("mapHint")}</div>
      </div>
      <Legend title={t("legMapTitle")} stops={[["#fff7bc", 0], ["#fe9929", 50], ["#d95f0e", 90], ["#4d1a02", 100]]} low={t("legQuiet")} high={t("legBusy")} extra={t("legNoData")} />
    </div>
  );
}
