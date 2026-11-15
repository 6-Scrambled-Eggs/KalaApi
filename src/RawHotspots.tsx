import { useState } from "react";
import { useL } from "./i18n";

type Shape = { mode: "circle" | "box"; lat: number; lon: number; radius: number; box: { w: number; s: number; e: number; n: number }; valid: boolean };
const SOURCES = ["VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "VIIRS_SNPP_SP", "MODIS_NRT", "MODIS_SP"];
const MAX_DAYS = 5;  // FIRMS area API: 1 to 5 days per query
const hav = (la1: number, lo1: number, la2: number, lo2: number) => {
  const r = Math.PI / 180, a = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};
const yesterday = () => new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);

/** Raw FIRMS hotspots for the current circle or box. The user's own MAP_KEY stays in this component's state: never stored, never logged. */
export default function RawHotspots({ shape }: { shape: Shape }) {
  const L = useL();
  const [key, setKey] = useState("");
  const [source, setSource] = useState(SOURCES[0]);
  const [start, setStart] = useState(yesterday());
  const [days, setDays] = useState(3);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const { mode, lat, lon, radius, box, valid } = shape;
  const bb = mode === "box" ? box : (() => { const dla = radius / 110.57, dlo = radius / (111.32 * Math.cos((lat * Math.PI) / 180)); return { w: lon - dlo, s: lat - dla, e: lon + dlo, n: lat + dla }; })();
  const bbox = [bb.w, bb.s, bb.e, bb.n].map((x) => x.toFixed(3)).join(",");
  const keep = (la: number, lo: number) => (mode === "circle" ? hav(lat, lon, la, lo) <= radius : la >= box.s && la <= box.n && lo >= box.w && lo <= box.e);

  const finish = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    const head = lines[0]?.split(",") ?? [];
    const ia = head.indexOf("latitude"), io = head.indexOf("longitude");
    if (ia < 0 || io < 0) { setMsg(L(`FIRMS did not return a table: ${text.slice(0, 120)}`, `FIRMS tidak mengembalikan tabel: ${text.slice(0, 120)}`)); return; }
    const rows = lines.slice(1).filter((r) => { const c = r.split(","); return keep(parseFloat(c[ia]), parseFloat(c[io])); });
    if (!rows.length) { setMsg(L("No hotspots in this shape for these days. That means no heat detection by the satellite in these days, not proof that nothing burned.", "Tidak ada titik panas di bentuk ini pada hari-hari tersebut. Artinya tidak ada deteksi panas oleh satelit pada hari itu, bukan bukti bahwa tidak ada yang terbakar.")); return; }
    const blob = new Blob([[lines[0], ...rows].join("\n") + "\n"], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `kalaapi_hotspots_${source}_${bbox.replace(/,/g, "_")}_${start}_${days}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setMsg(L(`Downloaded ${rows.length} raw detections (${lines.length - 1} in the bounding box, ${rows.length} inside the ${mode === "box" ? "box" : "circle"}).`, `Terunduh ${rows.length} deteksi mentah (${lines.length - 1} di kotak pembatas, ${rows.length} di dalam ${mode === "box" ? "kotak" : "lingkaran"}).`));
  };

  const go = async () => {
    setUrl("");
    if (!valid) { setMsg(L("Fix the area above first.", "Perbaiki area di atas dulu.")); return; }
    if (!key.trim()) { setMsg(L("Enter your free FIRMS MAP_KEY first. Get one at firms.modaps.eosdis.nasa.gov/api/area.", "Masukkan MAP_KEY FIRMS gratis Anda dulu. Dapatkan di firms.modaps.eosdis.nasa.gov/api/area.")); return; }
    if (!/^[0-9a-zA-Z]{20,40}$/.test(key.trim())) { setMsg(L("This does not look like a MAP_KEY (20 to 40 letters and digits).", "Ini tidak tampak seperti MAP_KEY (20 sampai 40 huruf dan angka).")); return; }
    setBusy(true); setMsg("");
    const u = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key.trim()}/${source}/${bbox}/${days}/${start}`;
    try {
      const r = await fetch(u);
      const text = await r.text();
      if (!r.ok) setMsg(L(`FIRMS answered with status ${r.status}. Check the key and the dates.`, `FIRMS menjawab dengan status ${r.status}. Periksa kunci dan tanggalnya.`));
      else finish(text);
    } catch {
      setMsg(L("Your browser could not call FIRMS from this page (FIRMS may block calls from other sites, or the key or network failed). Open the request on FIRMS yourself, then filter the file here.", "Peramban Anda tidak dapat memanggil FIRMS dari halaman ini (FIRMS mungkin memblokir panggilan dari situs lain, atau kunci atau jaringan gagal). Buka permintaannya di FIRMS sendiri, lalu saring berkasnya di sini."));
      setUrl(u);
    }
    setBusy(false);
  };
  const onFile = async (f: File | undefined) => { if (f) finish(await f.text()); };

  return (
    <section className="rawhot noprint">
      <h3>{L("Raw hotspots from NASA FIRMS", "Titik panas mentah dari NASA FIRMS")}</h3>
      <p className="note">{L("These are raw detections, not harmonized fire-days. Use them to inspect single fires. Your MAP_KEY is free, stays in this page only, and is never stored or sent to us.", "Ini deteksi mentah, bukan hari-api terharmonisasi. Pakai untuk memeriksa kebakaran tunggal. MAP_KEY Anda gratis, hanya ada di halaman ini, dan tidak disimpan atau dikirim ke kami.")}</p>
      <div className="row">
        <label>MAP_KEY<input type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)} placeholder="FIRMS MAP_KEY" /></label>
        <label>{L("Sensor", "Sensor")}<select value={source} onChange={(e) => setSource(e.target.value)}>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        <label>{L("Start date", "Tanggal mulai")}<input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label>{L("Days", "Hari")} (1–{MAX_DAYS})<input type="number" min={1} max={MAX_DAYS} value={days} onChange={(e) => setDays(Math.max(1, Math.min(MAX_DAYS, parseInt(e.target.value) || 1)))} /></label>
      </div>
      <p className="tools"><button type="button" onClick={go} disabled={busy}>{busy ? "…" : L("Download raw hotspots (CSV)", "Unduh titik panas mentah (CSV)")}</button></p>
      <p className="note">{L(`FIRMS allows at most ${MAX_DAYS} days per request. NRT sensors hold the latest weeks; SP sensors are the archive.`, `FIRMS mengizinkan paling banyak ${MAX_DAYS} hari per permintaan. Sensor NRT menyimpan beberapa minggu terakhir; sensor SP adalah arsip.`)}</p>
      {msg && <p className="note" role="status">{msg}</p>}
      {url && <p className="note"><a href={url} target="_blank" rel="noreferrer">{L("Open this request on FIRMS (new tab)", "Buka permintaan ini di FIRMS (tab baru)")}</a> · <a href="https://firms.modaps.eosdis.nasa.gov/api/area/" target="_blank" rel="noreferrer">{L("FIRMS API page", "Halaman API FIRMS")}</a> · <label className="linkbtn">{L("Filter a downloaded CSV", "Saring CSV yang diunduh")}<input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => onFile(e.target.files?.[0])} /></label></p>}
    </section>
  );
}
