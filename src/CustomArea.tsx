import { useEffect, useMemo, useRef, useState } from "react";
import RawHotspots from "./RawHotspots";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Chart from "./Chart";
import MonthCalendar from "./MonthCalendar";
import { dateLocale, loadProvinces, nf } from "./data";
import { useL, useT } from "./i18n";
import "./tool-pages.css";

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
const T0 = Date.UTC(2001, 0, 1);
const dayIdx = (t: number) => Math.round((t - T0) / 864e5);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const circle = (lat: number, lon: number, r: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 64; i++) { const a = (i / 64) * 2 * Math.PI; pts.push([lon + (r / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(a), lat + (r / 110.57) * Math.cos(a)]); }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [pts] } } as GeoJSON.Feature;
};

const boxPoly = (b: { w: number; s: number; e: number; n: number }) => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[b.w, b.s], [b.e, b.s], [b.e, b.n], [b.w, b.n], [b.w, b.s]]] } } as GeoJSON.Feature);
const BOX_MAX = 3;  // degrees, tile load

export default function CustomArea() {
  const L = useL();
  const { t } = useT();
  const [mode, setMode] = useState<"circle" | "box">("circle");
  const [bx, setBx] = useState({ w: 113.4, s: -2.7, e: 114.4, n: -1.7 });
  const [pend, setPend] = useState<[number, number] | null>(null);
  const modeRef = useRef(mode), pendRef = useRef<[number, number] | null>(null);
  modeRef.current = mode;
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
    map.on("click", (e) => {
      const la = Math.round(e.lngLat.lat * 100) / 100, lo = Math.round(e.lngLat.lng * 100) / 100;
      if (modeRef.current === "circle") { setLat(la); setLon(lo); return; }
      const p = pendRef.current;
      if (!p) { pendRef.current = [lo, la]; setPend([lo, la]); setBx({ w: lo, e: lo, s: la, n: la }); }
      else { pendRef.current = null; setPend(null); setBx({ w: Math.min(p[0], lo), e: Math.max(p[0], lo), s: Math.min(p[1], la), n: Math.max(p[1], la) }); }
    });
    const fit = () => map.resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(el.current);
    return () => { ro?.disconnect(); map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const upd = () => { const s = map.getSource("circ") as maplibregl.GeoJSONSource | undefined; s?.setData(mode === "circle" ? circle(lat, lon, radius) : boxPoly(bx)); };
    if (map.getSource("circ")) upd(); else map.once("kala-ready" as any, upd);
  }, [lat, lon, radius, mode, bx]);
  // Switching the shape: zoom to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pendRef.current = null; setPend(null);
    const go = () => {
      if (mode === "box") map.fitBounds([[bx.w - 0.3, bx.s - 0.3], [bx.e + 0.3, bx.n + 0.3]], { duration: 0, padding: 10, maxZoom: 9 });
      else { const dla = radius / 110.57, dlo = radius / (111.32 * Math.cos((lat * Math.PI) / 180)); map.fitBounds([[lon - dlo * 3, lat - dla * 3], [lon + dlo * 3, lat + dla * 3]], { duration: 0, padding: 10, maxZoom: 9 }); }
    };
    if (map.loaded()) go(); else map.once("load", go);
  }, [mode]);
  // Zoom to the circle when the radius changes (and on first show); a click only moves the circle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = () => {
      const dla = radius / 110.57, dlo = radius / (111.32 * Math.cos((lat * Math.PI) / 180));
      map.fitBounds([[lon - dlo * 3, lat - dla * 3], [lon + dlo * 3, lat + dla * 3]], { duration: 0, padding: 10, maxZoom: 9 });
    };
    if (map.loaded()) zoom(); else map.once("load", zoom);
  }, [radius]);

  const boxFinite = [bx.w, bx.s, bx.e, bx.n].every(Number.isFinite);
  const boxOk = boxFinite && bx.w < bx.e && bx.s < bx.n && bx.w >= 94 && bx.e <= 142 && bx.s >= -12 && bx.n <= 7;
  const boxBig = boxFinite && (bx.e - bx.w > BOX_MAX + 1e-9 || bx.n - bx.s > BOX_MAX + 1e-9);
  const boxValid = boxOk && !boxBig;
  const circleValid = Number.isFinite(lat) && Number.isFinite(lon) && lat >= -12 && lat <= 7 && lon >= 94 && lon <= 142 && radius >= 5 && radius <= 100;
  const valid = mode === "circle" ? circleValid : boxValid;
  const s1 = from ? slotOfDate(new Date(from + "T00:00:00Z")) : 0, s2 = to ? slotOfDate(new Date(to + "T00:00:00Z")) : 0;
  const rangeOk = idx != null && from && to && s1 <= s2 && s2 <= idx.last_slot && s1 >= 0;

  const run = async () => {
    if (!idx || !valid || !rangeOk) return;
    setBusy(true); setErr(""); setRows(null);
    try {
      const dlat = radius / 110.57 + 0.05, dlon = radius / (111.32 * Math.cos((lat * Math.PI) / 180)) + 0.05;
      const [la0, la1, lo0, lo1] = mode === "circle" ? [lat - dlat, lat + dlat, lon - dlon, lon + dlon] : [bx.s, bx.n, bx.w, bx.e];
      const keys: string[] = [];
      for (let la = Math.floor(la0); la <= Math.floor(la1); la++) for (let lo = Math.floor(lo0); lo <= Math.floor(lo1); lo++) if (idx.tiles.includes(`${la}_${lo}`)) keys.push(`${la}_${lo}`);
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
          if (mode === "circle" ? km(lat, lon, clat, clon) > radius : (clat < bx.s || clat > bx.n || clon < bx.w || clon > bx.e)) continue;
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
    if (mode === "box") { let n = 0; for (let la = Math.floor(bx.s / 0.05); la <= Math.floor(bx.n / 0.05); la++) for (let lo = Math.floor(bx.w / 0.05); lo <= Math.floor(bx.e / 0.05); lo++) { const cy = (la + 0.5) * 0.05, cx = (lo + 0.5) * 0.05; if (cy >= bx.s && cy <= bx.n && cx >= bx.w && cx <= bx.e) n++; } return n; }
    const deg = 0.05, dla = radius / 110.57, dlo = radius / (111.32 * Math.cos((lat * Math.PI) / 180));
    let n = 0;
    for (let la = Math.floor((lat - dla) / deg); la <= Math.floor((lat + dla) / deg); la++) for (let lo = Math.floor((lon - dlo) / deg); lo <= Math.floor((lon + dlo) / deg); lo++) if (km(lat, lon, (la + 0.5) * deg, (lo + 0.5) * deg) <= radius) n++;
    return n;
  }, [lat, lon, radius, valid, mode, bx]);

  // Daily series of the circle (each week's value shared evenly over its days; week 52 holds the last 8-9 days of the year).
  const daily = useMemo(() => {
    if (!rows || !idx) return null;
    const lastY = 2001 + Math.floor(idx.last_slot / WPY);
    const total = dayIdx(Date.UTC(lastY + 1, 0, 1));
    const slotSum = new Map<number, number>();
    for (const r of rows) slotSum.set(r.slot, (slotSum.get(r.slot) ?? 0) + r.h);
    const pref = new Float64Array(total + 1);
    const lastDay = dayIdx(slotStart(idx.last_slot).getTime()) + 6;
    const day = new Float64Array(total);
    slotSum.forEach((v, slot) => {
      const y = 2001 + Math.floor(slot / WPY), w = slot % WPY;
      const start = dayIdx(slotStart(slot).getTime());
      const len = w === WPY - 1 ? dayIdx(Date.UTC(y + 1, 0, 1)) - start : 7;
      for (let d = 0; d < len; d++) day[start + d] = v / len;
    });
    for (let d = 0; d < total; d++) pref[d + 1] = pref[d] + (d <= lastDay ? day[d] : 0);
    return { pref, lastDay, lastY };
  }, [rows, idx]);
  const sum = (d: NonNullable<typeof daily>, a: number, b: number) => d.pref[Math.min(b, d.lastDay) + 1] - d.pref[Math.max(a, 0)];

  // Monthly series 2001-2026 for the circle: same calendar as an area page.
  const monthArea = useMemo(() => {
    if (!daily || !idx) return null;
    const ny = daily.lastY - 2001 + 1;
    const mh: (number | null)[] = new Array(ny * 12).fill(null);
    let partial: { index: number; days: number; days_in_month: number } | null = null;
    for (let y = 0; y < ny; y++) for (let m = 0; m < 12; m++) {
      const a = dayIdx(Date.UTC(2001 + y, m, 1)), b = dayIdx(Date.UTC(2001 + y, m + 1, 1));
      const covered = Math.min(b, daily.lastDay + 1) - a;
      if (covered <= 0) continue;
      mh[y * 12 + m] = Math.round(sum(daily, a, b - 1) * 10) / 10;
      if (covered < b - a) partial = { index: y * 12 + m, days: covered, days_in_month: b - a };
    }
    const med = Array.from({ length: 12 }, (_, m) => {
      const v = Array.from({ length: 25 }, (_, y) => mh[y * 12 + m] ?? 0).sort((x, z) => x - z);
      return (v[12] + v[12]) / 2;
    });
    return { id: "custom", name: L("Your area", "Area Anda"), level: "kabupaten", start_year: 2001, last_year: daily.lastY, back_cast_end_slot: idx.s0,
      mh, mlo: mh.map(() => null), mhi: mh.map(() => null), mstat: { med, p25: med, p75: med }, mpartial: partial } as any;
  }, [daily, idx, L]);

  // Selected period against the same calendar window in each year.
  const result = useMemo(() => {
    if (!rows || !idx || !daily || !rangeOk || !valid) return null;
    const n = s2 - s1 + 1;
    const H = new Array(n).fill(0), M = new Array(n).fill(0), V = new Array(n).fill(0);
    for (const r of rows) if (r.slot >= s1 && r.slot <= s2) { H[r.slot - s1] += r.h; M[r.slot - s1] += r.m; V[r.slot - s1] += r.v; }
    const fd = new Date(from + "T00:00:00Z"), td = new Date(to + "T00:00:00Z");
    const fy = fd.getUTCFullYear(), dy = td.getUTCFullYear() - fy;
    const win = (y: number) => {
      const a = dayIdx(Date.UTC(y, fd.getUTCMonth(), fd.getUTCDate())), b = dayIdx(Date.UTC(y + dy, td.getUTCMonth(), td.getUTCDate()));
      return b <= daily.lastDay ? sum(daily, a, b) : null;
    };
    const years: number[] = [];
    for (let y = 2001; y <= daily.lastY; y++) years.push(y);
    const yv = years.map((y) => { const w = win(y); return w == null ? null : Math.round(w * 10) / 10; });
    const total = H.reduce((a, b) => a + b, 0);
    const cur = win(fy) ?? total;
    const base = years.filter((y) => y <= 2025).map((y) => win(y)).filter((v): v is number => v != null).sort((a, b) => a - b);
    const med = base.length ? (base[Math.floor((base.length - 1) / 2)] + base[Math.ceil((base.length - 1) / 2)]) / 2 : 0;
    const pct = base.length ? (100 * (base.filter((v) => v < cur).length + 0.5 * base.filter((v) => v === cur).length)) / base.length : 0;
    return { n, H, M, V, total, years, yv, selY: fy, med, pct, cur, nBase: base.length };
  }, [rows, daily, s1, s2, idx, rangeOk, valid, from, to]);

  const f = (x: number) => nf(Math.round(x));
  const lineOpt = useMemo(() => {
    if (!result || !idx) return null;
    const labels = Array.from({ length: result.n }, (_, i) => { const d = slotStart(s1 + i); return `${d.getUTCFullYear()} w${(s1 + i) % WPY + 1}`; });
    const raw = (a: number[], first: number) => a.map((v, i) => (s1 + i < first ? null : Math.round(v)));
    return {
      grid: { left: 16, right: 16, top: 38, bottom: 100, containLabel: true },
      legend: { bottom: 0, left: 8, right: 8, itemGap: 10, textStyle: { fontSize: 13 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: labels, axisLabel: { hideOverlap: true, fontSize: 12 } },
      yAxis: { type: "value", name: L("fire-days / week", "hari-api / minggu"), nameTextStyle: { fontSize: 12 }, axisLabel: { fontSize: 12 } },
      series: [
        { name: L("Harmonized", "Harmonisasi"), type: "line", showSymbol: false, data: result.H.map((v) => Math.round(v * 10) / 10), lineStyle: { width: 2.4, color: "#993404" }, itemStyle: { color: "#993404" } },
        { name: L("Raw MODIS (Aqua)", "MODIS mentah (Aqua)"), type: "line", showSymbol: false, data: raw(result.M, idx.a0), lineStyle: { width: 1.2, type: "dashed", color: "#2b6cb0" }, itemStyle: { color: "#2b6cb0" } },
        { name: L("Raw VIIRS (S-NPP)", "VIIRS mentah (S-NPP)"), type: "line", showSymbol: false, data: raw(result.V, idx.s0), lineStyle: { width: 1.2, type: "dotted", color: "#16212b" }, itemStyle: { color: "#16212b" } },
      ],
    } as any;
  }, [result, idx, s1, L]);
  const barOpt = useMemo(() => {
    if (!result) return null;
    return {
      grid: { left: 16, right: 16, top: 14, bottom: 12, containLabel: true },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: result.years.map(String), axisLabel: { fontSize: 12, interval: 2, hideOverlap: true } },
      yAxis: { type: "value", axisLabel: { fontSize: 12 } },
      series: [{ type: "bar", data: result.yv.map((v, i) => ({ value: v ?? "-", itemStyle: { color: result.years[i] === result.selY ? "#993404" : "#fec44f" } })) }],
    } as any;
  }, [result]);

  const csv = () => {
    if (!rows) return;
    const out = ["cell_lat,cell_lon,year,week,harmonized_fire_days,raw_modis_fire_days,raw_viirs_fire_days"];
    rows.filter((r) => r.slot >= s1 && r.slot <= s2).sort((a, b) => a.slot - b.slot || a.lat - b.lat || a.lon - b.lon)
      .forEach((r) => out.push([r.lat.toFixed(3), r.lon.toFixed(3), 2001 + Math.floor(r.slot / WPY), (r.slot % WPY) + 1, r.h.toFixed(2), r.m, r.v].join(",")));
    const blob = new Blob([out.join("\n") + "\n"], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = mode === "box" ? `kalaapi_custom_box_${bx.w}_${bx.s}_${bx.e}_${bx.n}_${from}_${to}.csv` : `kalaapi_custom_${lat}_${lon}_${radius}km_${from}_${to}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <section className="custom">
      <h1>{L("Your own area", "Area pilihan Anda")}</h1>
      <p className="lead">{L("Pick a point on the map and a radius. KalaApi sums the harmonized fire-days of all 0.05° grid cells (about 5.5 km) inside the circle, for the dates you choose.", "Pilih satu titik di peta dan radius. KalaApi menjumlahkan hari-api terharmonisasi semua sel grid 0,05° (sekitar 5,5 km) di dalam lingkaran, untuk tanggal yang Anda pilih.")} {t("boxLead")}</p>
      <div className="customgrid">
        <div>
          <div ref={el} className="map" role="img" aria-label={L("Map: click to place the centre of your area", "Peta: klik untuk menaruh pusat area Anda")} />
          <p className="note">{mode === "circle" ? L("Click the map to move the centre.", "Klik peta untuk memindahkan pusat.") : (pend ? t("boxPick") : t("boxHint"))}</p>
        </div>
        <form className="cform" onSubmit={(e) => { e.preventDefault(); void run(); }}>
          <div className="seg" role="group" aria-label={L("Shape of the area", "Bentuk area")}>
            <button type="button" className={mode === "circle" ? "on" : ""} aria-pressed={mode === "circle"} onClick={() => setMode("circle")}>{t("modeCircle")}</button>
            <button type="button" className={mode === "box" ? "on" : ""} aria-pressed={mode === "box"} onClick={() => setMode("box")}>{t("modeBox")}</button>
          </div>
          {mode === "circle" ? (<>
          <label>{L("Latitude", "Lintang")}<input type="number" step="0.01" min={-12} max={7} value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} /></label>
          <label>{L("Longitude", "Bujur")}<input type="number" step="0.01" min={94} max={142} value={lon} onChange={(e) => setLon(parseFloat(e.target.value))} /></label>
          <label>{L("Radius", "Radius")}: {radius} km<input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} /></label>
          </>) : (<>
          <label>{t("boxW")}<input type="number" step="0.01" min={94} max={142} value={bx.w} onChange={(e) => setBx({ ...bx, w: parseFloat(e.target.value) })} /></label>
          <label>{t("boxS")}<input type="number" step="0.01" min={-12} max={7} value={bx.s} onChange={(e) => setBx({ ...bx, s: parseFloat(e.target.value) })} /></label>
          <label>{t("boxE")}<input type="number" step="0.01" min={94} max={142} value={bx.e} onChange={(e) => setBx({ ...bx, e: parseFloat(e.target.value) })} /></label>
          <label>{t("boxN")}<input type="number" step="0.01" min={-12} max={7} value={bx.n} onChange={(e) => setBx({ ...bx, n: parseFloat(e.target.value) })} /></label>
          <button type="button" className="linkbtn" onClick={() => setBx({ w: 113.4, s: -2.7, e: 114.4, n: -1.7 })}>{t("boxExample")}</button>
          </>)}
          <label>{L("From", "Dari")}<input type="date" min="2001-01-01" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>{L("To", "Sampai")}<input type="date" min="2001-01-01" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button type="submit" className="cta" disabled={busy || !valid || !rangeOk}>{busy ? L("Loading…", "Memuat…") : L("Show fire-days", "Tampilkan hari-api")}</button>
          {mode === "box" && boxBig && <p className="warn">{t("boxTooBig")}</p>}
          {mode === "box" && !boxOk && !boxBig && <p className="warn">{t("boxBad")}</p>}
          {mode === "circle" && !valid && <p className="warn">{L("Use latitude −12 to 7, longitude 94 to 142, radius 5 to 100 km.", "Gunakan lintang −12 sampai 7, bujur 94 sampai 142, radius 5 sampai 100 km.")}</p>}
          {idx && !rangeOk && from && <p className="warn">{L("Choose dates between 2001 and", "Pilih tanggal antara 2001 dan")} {iso(new Date(slotStart(idx.last_slot).getTime() + 6 * 864e5))}.</p>}
        </form>
      </div>
      {err && <p className="error">{err}</p>}
      {result && (
        <div className="custom-results" aria-live="polite">
          <dl className="answers three">
            <div><dt>{L("Harmonized fire-days", "Hari-api terharmonisasi")}</dt><dd className="fig">{f(result.cur)}</dd><dd>{from} → {to} · {L("exact dates", "tanggal tepat")}. {L("Chart and CSV use whole 7-day weeks:", "Grafik dan CSV memakai minggu penuh 7 hari:")} {result.n} {L("weeks", "minggu")}, {f(result.total)}.</dd></div>
            <div><dt>{mode === "box" ? t("boxCells") : L("Grid cells in circle", "Sel grid dalam lingkaran")}</dt><dd className="fig">{nf(nCells)}</dd><dd>≈ {f(nCells * 30)} km²</dd></div>
            <div><dt>{L("Is this period unusual?", "Apakah periode ini tidak biasa?")}</dt><dd className="fig">{result.med > 0 ? `×${nf((result.cur / result.med), 2)}` : "n/a"}</dd><dd>{L("Selected period:", "Periode terpilih:")} {f(result.cur)} {L("fire-days. Same dates in 2001–2025: median", "hari-api. Tanggal sama pada 2001–2025: median")} {f(result.med)} · {L("percentile", "persentil")} {Math.round(result.pct)} {L("of", "dari")} {result.nBase} {L("years", "tahun")}</dd></div>
          </dl>
          {result.total === 0 && <p className="note">{mode === "box" ? t("boxNone") : L("No detections in this circle for these dates. A zero means no heat detection by the satellites, not proof that nothing burned.", "Tidak ada deteksi di lingkaran ini untuk tanggal tersebut. Nol berarti satelit tidak mendeteksi panas, bukan bukti tidak ada yang terbakar.")}</p>}
          {monthArea && <><h2>{L("Monthly calendar of your area, 2001 to now", "Kalender bulanan area Anda, 2001 sampai sekarang")}</h2>
            <MonthCalendar area={monthArea} year={result.selY} onYear={() => undefined} />
            <p className="note">{mode === "box" ? t("boxCal") : L("This calendar does not change with the dates above. One cell = harmonized fire-days in the circle in that month; weekly values are shared evenly over their days. Years before 2012 are estimates.", "Kalender ini tidak berubah mengikuti tanggal di atas. Satu sel = hari-api terharmonisasi di dalam lingkaran pada bulan itu; nilai mingguan dibagi rata ke hari-harinya. Tahun sebelum 2012 adalah perkiraan.")}</p></>}
          <h2>{L("Weekly fire-days", "Hari-api mingguan")}</h2>
          <Chart option={lineOpt} height={300} label={L("Weekly fire-days in your area", "Hari-api mingguan di area Anda")} />
          {barOpt && <><h2>{L("The same dates in every year", "Tanggal yang sama di setiap tahun")}</h2><Chart option={barOpt} height={220} label={L("Fire-days on the same dates by year", "Hari-api pada tanggal yang sama per tahun")} /></>}
          <p className="tools noprint"><button onClick={csv}>{L("Download CSV (cell × week)", "Unduh CSV (sel × minggu)")}</button></p>
          <RawHotspots shape={{ mode, lat, lon, radius, box: bx, valid }} />
          <p className="note">{L("Before 2012 the values are estimates: the province-level back-cast is shared out to cells by their own MODIS detections. Small circles (under about 100 km²) are noisy. Fire-days are heat detections, not burned area. Data end: last complete week of S-NPP VIIRS (to 2 Nov 2026).", "Sebelum 2012 nilainya perkiraan: hasil hitung-mundur tingkat provinsi dibagi ke sel menurut deteksi MODIS sel itu sendiri. Lingkaran kecil (di bawah sekitar 100 km²) berisik. Hari-api adalah deteksi panas, bukan luas terbakar. Data berakhir pada minggu lengkap terakhir S-NPP VIIRS (sampai 2 Nov 2026).")}</p>
        </div>
      )}
    </section>
  );
}
