import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AreaIndex, Enso, loadEnso, loadOni, loadProvinces, Oni } from "./data";
import { ensoLabel, fmtP } from "./EnsoPanel";
import Legend from "./Legend";
import { useT } from "./i18n";

/** #/enso: provinces shaded by how strongly yearly fire activity follows El Nino (Spearman rho, 2001-2025). */
export default function EnsoView({ index, onSelect }: { index: AreaIndex[]; onSelect: (id: string) => void }) {
  const { lang } = useT();
  const id = lang === "id";
  const el = useRef<HTMLDivElement>(null);
  const [enso, setEnso] = useState<Enso | null>(null);
  const [oni, setOni] = useState<Oni | null>(null);
  const [tip, setTip] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => { loadEnso().then(setEnso); loadOni().then(setOni); }, []);
  const rows = useMemo(() => !enso ? [] : index.filter((a) => a.level === "province" && enso.areas[a.id]).map((a) => ({ a, e: enso.areas[a.id] })).sort((x, y) => y.e.rho - x.e.rho), [enso, index]);
  useEffect(() => {
    if (!el.current || !enso) return;
    const map = new maplibregl.Map({
      container: el.current,
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#0d1324" } }] },
      bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: 12 }, attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", async () => {
      const fc = await loadProvinces();
      fc.features.forEach((f) => {
        const e = enso.areas[(f.properties as any).id];
        (f.properties as any).rho = e ? e.rho : -9;
        (f.properties as any).lab = e ? ensoLabel(e) : "";
        (f.properties as any).p = e ? e.p : 1;
      });
      map.addSource("prov", { type: "geojson", data: fc });
      map.addLayer({ id: "fill", type: "fill", source: "prov", paint: {
        "fill-color": ["case", ["<", ["get", "rho"], -5], "#3b4060", ["interpolate", ["linear"], ["get", "rho"], -0.2, "#26304d", 0, "#26304d", 0.3, "#3c5a96", 0.6, "#6f97dd", 0.9, "#d6e6ff"],],
        "fill-opacity": 0.92 } });
      map.addLayer({ id: "line", type: "line", source: "prov", paint: { "line-color": "#0d1324", "line-width": 0.8 } });
      setReady(true);
      map.on("click", "fill", (e) => { const f = e.features?.[0]; if (f) onSelect((f.properties as any).id); });
      map.on("mousemove", "fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const p = e.features?.[0]?.properties as any;
        if (p) setTip(`${p.name}: ρ = ${p.rho} (${p.lab}), ${fmtP(p.p)}`);
      });
      map.on("mouseleave", "fill", () => { map.getCanvas().style.cursor = ""; setTip(""); });
    });
    const fit = () => { map.resize(); map.fitBounds([[94, -11.5], [141.5, 6.5]], { padding: 12, duration: 0 }); };
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(el.current);
    window.addEventListener("orientationchange", fit);
    window.addEventListener("resize", fit);
    return () => { ro?.disconnect(); window.removeEventListener("orientationchange", fit); window.removeEventListener("resize", fit); map.remove(); };
  }, [enso]);
  const n = enso ? enso.years.el.length : 0;
  const o26 = oni?.jas["2026"];
  return (
    <section>
      <h1>{id ? "Kaitan El Niño dengan api" : "El Niño link"}</h1>
      <p className="lead">{id
        ? "Di setiap provinsi, apakah tahun dengan El Niño juga tahun dengan lebih banyak hari-api? Warna terang berarti kaitan kuat. Warna gelap berarti tidak ada kaitan jelas."
        : "In each province, are El Niño years also years with more fire-days? Bright means a strong link. Dark means no clear link."}</p>
      <div className="mapWrap">
        <div className="mapBox">
          <div ref={el} className="map" role="img" aria-label="Map of provinces shaded by the El Niño link of yearly fire activity" />
          {!ready && <div className="mapLoad">{id ? "Memuat peta…" : "Loading map…"}</div>}
          <div className="mapTip">{tip || (id ? "Klik provinsi untuk melihat grafiknya." : "Click a province for its chart.")}</div>
        </div>
        <Legend title={id ? "Seberapa kuat api mengikuti El Niño (ρ)" : "How strongly fire follows El Niño (ρ)"} stops={[["#26304d", 0], ["#3c5a96", 33], ["#6f97dd", 66], ["#d6e6ff", 100]]} low={id ? "tidak ada kaitan jelas" : "no clear link"} high={id ? "kaitan kuat" : "strong link"} extra={id ? "tanpa data" : "no data"} ticks={[[0, "ρ 0"], [33, "0.3"], [66, "0.6"], [100, "0.9"]]} />
      </div>
      <p className="note">{id
        ? `Warna: korelasi peringkat (ρ) antara hari-api tahunan 2001–2025 dan ONI Juli–September. Hanya ${n} tahun El Niño dalam 25 tahun, jadi baca sebagai petunjuk, bukan bukti. ${o26 != null ? `ONI Juli–September 2026: ${o26 > 0 ? "+" : ""}${o26}.` : ""} Ini bukan prakiraan 2027.`
        : `Colour: rank correlation (ρ) of yearly fire-days (2001–2025) with the July–September ONI. Only ${n} El Niño years in 25, so read this as a lead, not proof. ${o26 != null ? `July–September 2026 ONI: ${o26 > 0 ? "+" : ""}${o26}.` : ""} This is not a forecast for 2027.`}</p>
      <h2>{id ? "Provinsi, dari kaitan terkuat" : "Provinces, strongest link first"}</h2>
      <div className="tablewrap"><table>
        <thead><tr><th>{id ? "Provinsi" : "Province"}</th><th className="num">ρ</th><th className="num">p</th><th>{id ? "Kaitan" : "Link"}</th><th className="num">{id ? "El Niño vs netral" : "El Niño vs neutral"}</th></tr></thead>
        <tbody>{rows.map(({ a, e }) => (
          <tr key={a.id}><td><a href={`#/area/${a.id}`}>{a.name}</a></td><td className="num">{e.rho}</td><td className="num">{fmtP(e.p).replace("p ", "")}</td><td><span className={`pill ${ensoLabel(e)}`}>{id ? ({ clear: "jelas", suggestive: "indikasi", weak: "lemah", none: "tidak ada", reverse: "terbalik" } as Record<string, string>)[ensoLabel(e)] : ensoLabel(e)}</span></td><td className="num">{e.ratio_el_neu ? `×${e.ratio_el_neu}` : "n/a"}</td></tr>
        ))}</tbody>
      </table></div>
      <p className="note">{id ? "Terdapat 38 provinsi dan banyak kabupaten; p tidak dikoreksi untuk uji berganda. Label: clear (jelas) = p < 0,01 dan ρ ≥ 0,4; suggestive (indikasi) = p < 0,05 dan ρ ≥ 0,4; lemah (weak) = p < 0,15. Hanya 5 tahun El Niño: baca sebagai petunjuk." : "38 provinces and many kabupaten are tested; p is not corrected for multiple tests. Labels: clear = p < 0.01 and ρ ≥ 0.4; suggestive = p < 0.05 and ρ ≥ 0.4; weak = p < 0.15. With only 5 El Niño years, read all of this as a lead, not proof."}</p>
    </section>
  );
}
