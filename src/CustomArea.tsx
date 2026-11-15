import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Chart from "./Chart";
import { dateLocale, loadProvinces } from "./data";
import { useL } from "./i18n";

const base = import.meta.env.BASE_URL;
const WPY = 52;
type Tile = { lat: number; lon: number; per: number; deg: number; c: number[]; s: number[]; h: number[]; m: number[]; v: number[] };
type GridIndex = { tiles: string[]; last_slot: number; tile_deg: number; a0: number; s0: number };
type Row = { lat: number; lon: number; slot: number; h: number; m: number; v: number };

const tileCache = new Map<string, Promise<Tile | null>>();
const loadTile = (k: string) => {
  if (!tileCache.has(k)) tileCache.set(k, fetch(`${base}data/grid/${k}.json`).then((r) => (r.ok ? (r.json() as Promise<Tile>) : null)).catch(() => null));
  return tileCache.get(k)!;
};
let idxP: Promise<GridIndex> | null = null;
const loadIndex = () => (idxP ??= fetch(`${base}data/grid/index.json`).then((r) => r.json()));

const km = (la1: number, lo1: number, la2: number, lo2: number) => {
  const r = Math.PI / 180, dla = (la2 - la1) * r, dlo = (lo2 - lo1) * r;
  const a = Math.sin(dla / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dlo / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};
const slotOfDate = (d: Date) => {
  const doy = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5) + 1;
  return (d.getUTCFullYear() - 2001) * WPY + Math.min(Math.floor((doy - 1) / 7), WPY - 1);
};
const slotStart = (s: number) => new Date(Date.UTC(2001 + Math.floor(s / WPY), 0, 1 + 7 * (s % WPY)));
const iso = (d: Date) => d.toISOString().slice(0, 10);
const circle = (lat: number, lon: number, r: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 64; i++) { const a = (i / 64) * 2 * Math.PI; pts.push([lon + (r / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a), lat + (r / 110.57) * Math.cos(a)]); }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [pts] } } as GeoJSON.Feature;
};

export default function CustomArea() {
  const L = useL();
  const [idx, setIdx] = useState<GridIndex | null>(null);
  const [lat, setLat] = useState(-2.3), [lon, setLon] = useState(114.0), [radius, setRadius] = useState(30);
  const [from, setFrom] = useState(""), [to, setTo] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  useEffect(() => {
    loadIndex().then((g) => {
      setIdx(g);
      setFrom(iso(slotStart(g.last_slot - 51)));
      setTo(iso(new Date(slotStart(g.last_slot).getTime() + 6 * 864e5)));
    });
  }, []);
  // Map
  useEffect(() => {
    if (!el.current) return;
    const map = new maplibregl.Map({
      container: el.current, attributionControl: false, dragRotate: false,
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#d4e6f0" } }] },
      bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: 12 },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", async () => {
      const fc = await loadProvinces();
      map.addSource("prov", { type: "geojson", data: fc });
      map.addLayer({ id: "fill", type: "fill", source: "prov", paint: { "fill-color": "#f2ead3", "fill-opacity": 1 } });
      map.addLayer({ id: "line", type: "line", source: "prov", paint: { "line-color": "#9aa6a0", "line-width": 0.6 } });
      map.addSource("circ", { type: "geojson", data: circle(-2.3, 114.0, 30) });
      map.addLayer({ id: "cfill", type: "fill", source: "circ", paint: { "fill-color": "#d95f0e", "fill-opacity": 0.25 } });
      map.addLayer({ id: "cline", type: "line", source: "circ", paint: { "line-color": "#993404", "line-width": 2 } });
      map.fire("kala-ready" as any);
    });
    map.on("click", (e) => { setLat(Math.round(e.lngLat.lat * 100) / 100); setLon(Math.round(e.lngLat.lng * 100) / 100); });
    const fit = () => map.resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(el.current);
    return () => { ro?.disconnect(); map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const upd = () => { const s = map.getSource("circ") as maplibregl.GeoJSONSource | undefined; s?.setData(circle(lat, lon, radius)); };
    if (map.getSource("circ")) upd(); else map.once("kala-ready" as any, upd);
  }, [lat, lon, radius]);

  const valid = Number.isFinite(lat) && Number.isFinite(lon) && lat >= -12 && lat <= 7 && lon >= 94 && lon <= 142 && radius >= 5 && radius <= 100;
  const s1 = from ? slotOfDate(new Date(from + "T00:00:00Z")) : 0, s2 = to ? slotOfDate(new Date(to + "T00:00:00Z")) : 0;
  const rangeOk = idx != null && from && to && s1 <= s2 && s2 <= idx.last_slot && s1 >= 0;

  const run = async () => {
    if (!idx || !valid || !rangeOk) return;
    setBusy(true); setErr(""); setRows(null);
    try {
      const dlat = radius / 110.57 + 0.05, dlon = radius / (111.32 * Math.cos((lat * Math.PI) / 180)) + 0.05;
      const keys: string[] = [];
      for (let la = Math.floor(lat - dlat); la <= Math.floor(lat + dlat); la++) for (let lo = Math.floor(lon - dlon); lo <= Math.floor(lon + dlon); lo++) if (idx.tiles.includes(`${la}_${lo}`)) keys.push(`${la}_${lo}`);
      const tiles = (await Promise.all(keys.map(loadTile))).filter(Boolean) as Tile[];
      const out: Row[] = [];
      for (const t of tiles) {
        let cell = 0, slot = 0;
        for (let i = 0; i < t.c.length; i++) {
          const newCell = i === 0 || t.c[i] !== 0;
          cell += t.c[i];
          slot = newCell ? t.s[i] : slot + t.s[i];
          const iy = Math.floor(cell / t.per), ix = cell % t.per;
          const clat = (t.lat * t.per + iy + 0.5) * t.deg, clon = (t.lon * t.per + ix + 0.5) * t.deg;
          if (km(lat, lon, clat, clon) > radius) continue;
          out.push({ lat: clat, lon: clon, slot, h: t.h[i] / 100, m: t.m[i], v: t.v[i] });
        }
      }
      setRows(out);
    } catch (e) { setErr(String(e)); }
    setBusy(false);
  };
  useEffect(() => { if (idx && from && to) void run(); /* first run when the page opens */ }, [idx, from === "" ? 0 : 1]);

  const nCells = useMemo(() => {
    if (!valid) return 0;
    const deg = 0.05, dla = radius / 110.57, dlo = radius / (111.32 * Math.cos((lat * Math.PI) / 180));
    let n = 0;
    for (let la = Math.floor((lat - dla) / deg); la <= Math.floor((lat + dla) / deg); la++) for (let lo = Math.floor((lon - dlo) / deg); lo <= Math.floor((lon + dlo) / deg); lo++) if (km(lat, lon, (la + 0.5) * deg, (lo + 0.5) * deg) <= radius) n++;
    return n;
  }, [lat, lon, radius, valid]);

  const result = useMemo(() => {
    if (!rows || !idx || !rangeOk || !valid) return null;
    const n = s2 - s1 + 1;
    const H = new Array(n).fill(0), M = new Array(n).fill(0), V = new Array(n).fill(0);
    const byYear = new Map<number, number>();
    const w1 = s1 % WPY, w2 = s2 % WPY, wrap = n > WPY || w1 > w2;
    for (const r of rows) {
      if (r.slot >= s1 && r.slot <= s2) { H[r.slot - s1] += r.h; M[r.slot - s1] += r.m; V[r.slot - s1] += r.v; }
      const y = 2001 + Math.floor(r.slot / WPY), w = r.slot % WPY;
      if (!wrap && w >= w1 && w <= w2) byYear.set(y, (byYear.get(y) ?? 0) + r.h);
    }
    const total = H.reduce((a, b) => a + b, 0);
    const lastY = 2001 + Math.floor(idx.last_slot / WPY);
    const years: number[] = [];
    for (let y = 2001; y <= lastY; y++) years.push(y);
    const yv = years.map((y) => Math.round((byYear.get(y) ?? 0) * 10) / 10);
    const selY = 2001 + Math.floor(s2 / WPY);
    const baseV = years.filter((y) => y <= 2025).map((y) => byYear.get(y) ?? 0).sort((a, b) => a - b);
    const med = baseV.length ? (baseV[Math.floor((baseV.length - 1) / 2)] + baseV[Math.ceil((baseV.length - 1) / 2)]) / 2 : 0;
    return { n, H, M, V, total, years, yv, selY, med, wrap, cur: byYear.get(selY) ?? 0 };
  }, [rows, s1, s2, idx, rangeOk, valid]);

  const f = (x: number) => Math.round(x).toLocaleString(dateLocale.v);
  const lineOpt = useMemo(() => {
    if (!result || !idx) return null;
    const labels = Array.from({ length: result.n }, (_, i) => { const d = slotStart(s1 + i); return `${d.getUTCFullYear()} w${(s1 + i) % WPY + 1}`; });
    const raw = (a: number[], first: number) => a.map((v, i) => (s1 + i < first ? null : Math.round(v)));
    return {
      grid: { left: 48, right: 14, top: 36, bottom: 38 },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: labels, axisLabel: { hideOverlap: true, fontSize: 10 } },
      yAxis: { type: "value", name: L("fire-days / week", "hari-api / minggu"), nameTextStyle: { fontSize: 10 } },
      series: [
        { name: L("Harmonized", "Harmonisasi"), type: "line", showSymbol: false, data: result.H.map((v) => Math.round(v * 10) / 10), lineStyle: { width: 2.4, color: "#993404" }, itemStyle: { color: "#993404" } },
        { name: L("Raw MODIS (Aqua)", "MODIS mentah (Aqua)"), type: "line", showSymbol: false, data: raw(result.M, idx.a0), lineStyle: { width: 1.2, type: "dashed", color: "#2b6cb0" }, itemStyle: { color: "#2b6cb0" } },
        { name: L("Raw VIIRS (S-NPP)", "VIIRS mentah (S-NPP)"), type: "line", showSymbol: false, data: raw(result.V, idx.s0), lineStyle: { width: 1.2, type: "dotted", color: "#16212b" }, itemStyle: { color: "#16212b" } },
      ],
    } as any;
  }, [result, idx, s1, L]);
  const barOpt = useMemo(() => {
    if (!result || result.wrap) return null;
    return {
      grid: { left: 48, right: 14, top: 14, bottom: 30 },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: result.years.map(String), axisLabel: { fontSize: 10, interval: 2 } },
      yAxis: { type: "value", axisLabel: { fontSize: 10 } },
      series: [{ type: "bar", data: result.yv.map((v, i) => ({ value: v, itemStyle: { color: result.years[i] === result.selY ? "#993404" : "#fec44f" } })) }],
    } as any;
  }, [result]);

  const csv = () => {
    if (!rows) return;
    const out = ["cell_lat,cell_lon,year,week,harmonized_fire_days,raw_modis_fire_days,raw_viirs_fire_days"];
    rows.filter((r) => r.slot >= s1 && r.slot <= s2).sort((a, b) => a.slot - b.slot || a.lat - b.lat || a.lon - b.lon)
      .forEach((r) => out.push([r.lat.toFixed(3), r.lon.toFixed(3), 2001 + Math.floor(r.slot / WPY), (r.slot % WPY) + 1, r.h.toFixed(2), r.m, r.v].join(",")));
    const blob = new Blob([out.join("\n") + "\n"], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `kalaapi_custom_${lat}_${lon}_${radius}km_${from}_${to}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <section className="custom">
      <h1>{L("Your own area", "Area pilihan Anda")}</h1>
      <p className="lead">{L("Pick a point on the map and a radius. KalaApi sums the harmonized fire-days of all 0.05° grid cells (about 5.5 km) inside the circle, for the dates you choose.", "Pilih satu titik di peta dan radius. KalaApi menjumlahkan hari-api terharmonisasi semua sel grid 0,05° (sekitar 5,5 km) di dalam lingkaran, untuk tanggal yang Anda pilih.")}</p>
      <div className="customgrid">
        <div>
          <div ref={el} className="map" role="img" aria-label={L("Map: click to place the centre of your area", "Peta: klik untuk menaruh pusat area Anda")} />
          <p className="note">{L("Click the map to move the centre.", "Klik peta untuk memindahkan pusat.")}</p>
        </div>
        <form className="cform" onSubmit={(e) => { e.preventDefault(); void run(); }}>
          <label>{L("Latitude", "Lintang")}<input type="number" step="0.01" min={-12} max={7} value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} /></label>
          <label>{L("Longitude", "Bujur")}<input type="number" step="0.01" min={94} max={142} value={lon} onChange={(e) => setLon(parseFloat(e.target.value))} /></label>
          <label>{L("Radius", "Radius")}: {radius} km<input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} /></label>
          <label>{L("From", "Dari")}<input type="date" min="2001-01-01" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>{L("To", "Sampai")}<input type="date" min="2001-01-01" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button type="submit" className="cta" disabled={busy || !valid || !rangeOk}>{busy ? L("Loading…", "Memuat…") : L("Show fire-days", "Tampilkan hari-api")}</button>
          {!valid && <p className="warn">{L("Use latitude −12 to 7, longitude 94 to 142, radius 5 to 100 km.", "Gunakan lintang −12 sampai 7, bujur 94 sampai 142, radius 5 sampai 100 km.")}</p>}
          {idx && !rangeOk && from && <p className="warn">{L("Choose dates between 2001 and", "Pilih tanggal antara 2001 dan")} {iso(new Date(slotStart(idx.last_slot).getTime() + 6 * 864e5))}.</p>}
        </form>
      </div>
      {err && <p className="error">{err}</p>}
      {result && (
        <div aria-live="polite">
          <dl className="answers three">
            <div><dt>{L("Harmonized fire-days", "Hari-api terharmonisasi")}</dt><dd className="fig">{f(result.total)}</dd><dd>{from} → {to} · {result.n} {L("weeks", "minggu")}</dd></div>
            <div><dt>{L("Grid cells in circle", "Sel grid dalam lingkaran")}</dt><dd className="fig">{nCells.toLocaleString(dateLocale.v)}</dd><dd>≈ {f(nCells * 30)} km²</dd></div>
            {!result.wrap && <div><dt>{L("Same weeks, other years", "Minggu sama, tahun lain")}</dt><dd className="fig">{result.med > 0 ? `×${(result.cur / result.med).toFixed(2)}` : "n/a"}</dd><dd>{L("vs median 2001–2025:", "vs median 2001–2025:")} {f(result.med)}</dd></div>}
          </dl>
          {result.total === 0 && <p className="note">{L("No detections in this circle for these dates. A zero means no heat detection by the satellites, not proof that nothing burned.", "Tidak ada deteksi di lingkaran ini untuk tanggal tersebut. Nol berarti satelit tidak mendeteksi panas, bukan bukti tidak ada yang terbakar.")}</p>}
          <h2>{L("Weekly fire-days", "Hari-api mingguan")}</h2>
          <Chart option={lineOpt} height={300} label={L("Weekly fire-days in your area", "Hari-api mingguan di area Anda")} />
          {barOpt && <><h2>{L("The same weeks in every year", "Minggu yang sama di setiap tahun")}</h2><Chart option={barOpt} height={220} label={L("Fire-days in the same weeks by year", "Hari-api pada minggu yang sama per tahun")} /></>}
          <p className="tools noprint"><button onClick={csv}>{L("Download CSV (cell × week)", "Unduh CSV (sel × minggu)")}</button></p>
          <p className="note">{L("Before 2012 the values are estimates: the province-level back-cast is shared out to cells by their own MODIS detections. Small circles (under about 100 km²) are noisy. Fire-days are heat detections, not burned area. Data end: last complete week of S-NPP VIIRS (to 2 Nov 2026).", "Sebelum 2012 nilainya perkiraan: hasil hitung-mundur tingkat provinsi dibagi ke sel menurut deteksi MODIS sel itu sendiri. Lingkaran kecil (di bawah sekitar 100 km²) berisik. Hari-api adalah deteksi panas, bukan luas terbakar. Data berakhir pada minggu lengkap terakhir S-NPP VIIRS (sampai 2 Nov 2026).")}</p>
        </div>
      )}
    </section>
  );
}
