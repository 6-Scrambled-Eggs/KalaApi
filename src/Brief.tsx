import { useEffect, useMemo, useState } from "react";
import Analog from "./Analog";
import Chart from "./Chart";
import EnsoPanel from "./EnsoPanel";
import Readiness from "./Readiness";
import { Area, Enso, Oni, WPY, loadArea, loadEnso, loadOni, matrix, upto } from "./data";
import { useT } from "./i18n";

const YEARS = [2015, 2019, 2026];
const COL: Record<number, string> = { 2015: "#7b241c", 2019: "#e67e22", 2026: "#000000" };

/** One-page A4 brief for a local disaster agency (BPBD): where we stand, when to be ready, what the numbers cannot say. */
export default function Brief({ id }: { id: string }) {
  const { lang } = useT();
  const L = lang === "id";
  const [a, setA] = useState<Area | null>(null);
  const [enso, setEnso] = useState<Enso | null>(null);
  const [oni, setOni] = useState<Oni | null>(null);
  useEffect(() => { loadArea(id).then(setA); loadEnso().then(setEnso).catch(() => undefined); loadOni().then(setOni).catch(() => undefined); }, [id]);
  const chart = useMemo(() => {
    if (!a) return null;
    const M = matrix(a.h);
    const cum = (y: number) => { let s = 0; return (M[y - a.start_year] || []).map((v) => (v == null ? null : (s += v))); };
    return {
      grid: { left: 56, right: 12, top: 28, bottom: 28 }, legend: { top: 0, icon: "roundRect" }, animation: false,
      xAxis: { type: "category", data: Array.from({ length: WPY }, (_, i) => String(i + 1)), name: L ? "minggu" : "week", nameLocation: "middle", nameGap: 20 },
      yAxis: { type: "value", name: L ? "hari-api kumulatif" : "cumulative fire-days" },
      series: YEARS.map((y) => ({ name: String(y), type: "line", showSymbol: false, data: cum(y).map((v) => (v == null ? "-" : Math.round(v))), lineStyle: { color: COL[y], width: y === 2026 ? 3 : 2 }, itemStyle: { color: COL[y] } })),
    } as any;
  }, [a, L]);
  if (!a || !chart) return <p>Loading…</p>;
  const w = a.last_week;
  const P = matrix(a.pct)[a.last_year - a.start_year] || [];
  let wk = w - 1;
  while (wk > 0 && P[wk] == null) wk--;
  const pct = P[wk];
  const now = upto(a, a.last_year, w), u15 = upto(a, 2015, w), u19 = upto(a, 2019, w);
  const rr = (x: number) => (x > 0 ? `${Math.round((now / x) * 100)}%` : "n/a");
  let peatShare: string | null = null;
  if (a.h_peat && a.h_min) {
    const hp = matrix(a.h_peat), hm = matrix(a.h_min);
    let p = 0, m = 0;
    for (let y = 2016; y <= 2025; y++) for (let i = 0; i < WPY; i++) { p += hp[y - a.start_year]?.[i] ?? 0; m += hm[y - a.start_year]?.[i] ?? 0; }
    if (p + m > 0) peatShare = `${Math.round((p / (p + m)) * 100)}%`;
  }
  return (
    <>
      <div className="sheetbar noprint"><button className="btn primary" onClick={() => window.print()}>{L ? "Cetak atau simpan PDF" : "Print or save as PDF"}</button></div>
      <section className="card a4 brief">
        <h1>{a.name}: {L ? "ringkasan kesiapsiagaan api" : "fire readiness brief"}</h1>
      <p className="note">{L ? "Bukan produk resmi. Dibuat untuk NASA Space Apps Challenge dari data NASA FIRMS. Belum disahkan oleh BPBD atau lembaga mana pun." : "Not an official product. Made for the NASA Space Apps Challenge from NASA FIRMS data. Not endorsed by BPBD or any agency."}</p>
      <p className="note">{L ? "Untuk BPBD, Manggala Agni, dan pengelola gambut. Data per minggu" : "For BPBD, Manggala Agni and peat managers. Data as of week"} {w} {L ? "tahun" : "of"} {a.last_year} · NASA FIRMS MODIS + VIIRS</p>
      <table><tbody>
        <tr><th>{L ? "Saat ini" : "Right now"}</th><td>{L ? `Minggu ${wk + 1} berada di persentil ke-${pct == null ? "n/a" : Math.round(pct)} dari minggu yang sama 2001–2025.` : `Week ${wk + 1} is at the ${pct == null ? "n/a" : Math.round(pct)}th percentile of the same week in 2001–2025.`} {L ? `Sejak awal tahun: ×${a.ytd_ratio ?? "n/a"} dari normal (×${a.ytd_ratio_recent ?? "n/a"} dari 10 tahun terakhir).` : `Year to date: ×${a.ytd_ratio ?? "n/a"} of normal (×${a.ytd_ratio_recent ?? "n/a"} of the last 10 years).`}</td></tr>
        <tr><th>{L ? "Dibanding tahun besar" : "Against big years"}</th><td>{L ? `Sampai minggu ${w}, ${a.last_year} adalah ${rr(u15)} dari 2015 dan ${rr(u19)} dari 2019 (hari-api).` : `Up to week ${w}, ${a.last_year} is ${rr(u15)} of 2015 and ${rr(u19)} of 2019 (fire-days).`}</td></tr>
        {peatShare && <tr><th>{L ? "Gambut" : "Peat"}</th><td>{L ? `${peatShare} hari-api 2016–2025 terjadi di sel gambut (≥50% gambut).` : `${peatShare} of fire-days in 2016–2025 were in peat cells (≥50% peat).`}</td></tr>}
      </tbody></table>
      <div className="chartbox"><Chart option={chart} height={150} label={`${a.name} cumulative fire-days`} /></div>
      <Readiness area={a} />
      <Analog area={a} />
      <EnsoPanel area={a} enso={enso} oni={oni} compact />
      <h2>{L ? "Batas angka ini" : "Limits of these numbers"}</h2>
      <ol>
        <li>{L ? "Titik panas menunjukkan panas, bukan luas terbakar. Awan dan asap dapat menyembunyikan api." : "Hotspots show heat, not area burned. Cloud and haze can hide fires."}</li>
        <li>{L ? "Tahun sebelum 2012 diperkirakan dari MODIS: total tahunan provinsi biasanya dalam ±10% (9 dari 10 dalam ±30%)." : "Years before 2012 are estimated from MODIS: yearly province totals are typically within ±10% (9 in 10 within ±30%)."}</li>
        <li>{a.low_data ? (L ? "Wilayah ini punya sedikit api pada tahun rata-rata. Baca persentil dengan hati-hati." : "This area has few fires in an average year. Read the percentiles with care.") : (L ? "Persentil membandingkan tiap minggu dengan minggu yang sama 2001–2025." : "Percentiles compare each week with the same week in 2001–2025.")}</li>
        <li>{L ? "Jendela kesiapsiagaan dan kaitan El Niño adalah gambaran sejarah, bukan prakiraan." : "The readiness window and the El Niño link describe history. They are not forecasts."}</li>
      </ol>
      <p className="foot">KalaApi · {typeof window !== "undefined" ? window.location.href : ""}</p>
    </section>
    </>
  );
}
