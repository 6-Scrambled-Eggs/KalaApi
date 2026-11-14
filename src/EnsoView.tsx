import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AreaIndex, Enso, loadEnso, loadOni, loadProvinces, Oni } from "./data";
import { fmtP } from "./EnsoPanel";
import { useT } from "./i18n";

/** #/enso: provinces shaded by how strongly yearly fire activity follows El Nino (Spearman rho, 2001-2025). */
export default function EnsoView({ index, onSelect }: { index: AreaIndex[]; onSelect: (id: string) => void }) {
  const { lang } = useT();
  const id = lang === "id";
  const el = useRef<HTMLDivElement>(null);
  const [enso, setEnso] = useState<Enso | null>(null);
  const [oni, setOni] = useState<Oni | null>(null);
  const [tip, setTip] = useState("");
  useEffect(() => { loadEnso().then(setEnso); loadOni().then(setOni); }, []);
  const rows = useMemo(() => !enso ? [] : index.filter((a) => a.level === "province" && enso.areas[a.id]).map((a) => ({ a, e: enso.areas[a.id] })).sort((x, y) => y.e.rho - x.e.rho), [enso, index]);
  useEffect(() => {
    if (!el.current || !enso) return;
    const map = new maplibregl.Map({
      container: el.current,
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#e8eef3" } }] },
      bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: 12 }, attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", async () => {
      const fc = await loadProvinces();
      fc.features.forEach((f) => {
        const e = enso.areas[(f.properties as any).id];
        (f.properties as any).rho = e ? e.rho : -9;
        (f.properties as any).lab = e ? e.label : "";
        (f.properties as any).p = e ? e.p : 1;
      });
      map.addSource("prov", { type: "geojson", data: fc });
      map.addLayer({ id: "fill", type: "fill", source: "prov", paint: {
        "fill-color": ["case", ["<", ["get", "rho"], -5], "#ccc", ["interpolate", ["linear"], ["get", "rho"], -0.2, "#d9d9d9", 0, "#f0f0f0", 0.3, "#fdd0a2", 0.6, "#e6550d", 0.9, "#7f2704"],],
        "fill-opacity": 0.92 } });
      map.addLayer({ id: "line", type: "line", source: "prov", paint: { "line-color": "#fff", "line-width": 0.8 } });
      map.on("click", "fill", (e) => { const f = e.features?.[0]; if (f) onSelect((f.properties as any).id); });
      map.on("mousemove", "fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const p = e.features?.[0]?.properties as any;
        if (p) setTip(`${p.name}: ρ = ${p.rho} (${p.lab}), ${fmtP(p.p)}`);
      });
      map.on("mouseleave", "fill", () => { map.getCanvas().style.cursor = ""; setTip(""); });
    });
    return () => map.remove();
  }, [enso]);
  const n = enso ? enso.years.el.length : 0;
  const o26 = oni?.jas["2026"];
  return (
    <section>
      <h1>{id ? "Apakah El Niño berpengaruh di sini?" : "Does El Niño matter here?"}</h1>
      <p className="lead">{id
        ? "Di setiap provinsi, apakah tahun dengan El Niño juga tahun dengan lebih banyak hari-api? Warna gelap berarti kaitan kuat. Abu-abu berarti tidak ada kaitan jelas."
        : "In each province, are El Niño years also years with more fire-days? Dark means a strong link. Grey means no clear link."}</p>
      <div className="mapWrap">
        <div ref={el} className="map" role="img" aria-label="Map of provinces shaded by the El Niño link of yearly fire activity" />
        <div className="mapTip">{tip || (id ? "Klik provinsi untuk melihat grafiknya." : "Click a province for its chart.")}</div>
      </div>
      <p className="note">{id
        ? `Warna: korelasi peringkat (ρ) antara hari-api tahunan 2001–2025 dan ONI Juli–September. Hanya ${n} tahun El Niño dalam 25 tahun, jadi baca sebagai petunjuk, bukan bukti. ${o26 != null ? `ONI Juli–September 2026: ${o26 > 0 ? "+" : ""}${o26}.` : ""} Ini bukan prakiraan 2027.`
        : `Colour: rank correlation (ρ) of yearly fire-days (2001–2025) with the July–September ONI. Only ${n} El Niño years in 25, so read this as a lead, not proof. ${o26 != null ? `July–September 2026 ONI: ${o26 > 0 ? "+" : ""}${o26}.` : ""} This is not a forecast for 2027.`}</p>
      <h2>{id ? "Provinsi, dari kaitan terkuat" : "Provinces, strongest link first"}</h2>
      <table>
        <thead><tr><th>{id ? "Provinsi" : "Province"}</th><th>ρ</th><th>p</th><th>{id ? "Kaitan" : "Link"}</th><th>{id ? "El Niño vs netral" : "El Niño vs neutral"}</th></tr></thead>
        <tbody>{rows.map(({ a, e }) => (
          <tr key={a.id}><td><a href={`#/area/${a.id}`}>{a.name}</a></td><td>{e.rho}</td><td>{fmtP(e.p).replace("p ", "")}</td><td>{e.label}</td><td>{e.ratio_el_neu ? `×${e.ratio_el_neu}` : "n/a"}</td></tr>
        ))}</tbody>
      </table>
      <p className="note">{id ? "Terdapat 38 provinsi dan banyak kabupaten; p tidak dikoreksi untuk uji berganda. Label: clear = p < 0,05 dan ρ ≥ 0,4; weak = p < 0,15." : "38 provinces and many kabupaten are tested; p is not corrected for multiple tests. Labels: clear = p < 0.05 and ρ ≥ 0.4; weak = p < 0.15."}</p>
    </section>
  );
}
