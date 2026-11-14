import { useEffect, useState } from "react";
import { useT } from "./i18n";
import { Area, WPY, loadArea, matrix, weekLabel } from "./data";

/** FR-20: one-page A4 readiness card, print-styled. */
export default function Card({ id }: { id: string }) {
  const { lang } = useT();
  const L = (en: string, idt: string) => (lang === "id" ? idt : en);
  const [a, setA] = useState<Area | null>(null);
  useEffect(() => { loadArea(id).then(setA); }, [id]);
  if (!a) return <p>{L("Loading…", "Memuat…")}</p>;
  const P = matrix(a.pct)[a.last_year - a.start_year];
  let wk = a.last_week - 1;
  while (wk > 0 && P[wk] == null) wk--;
  const pct = P[wk];
  const tp = a.typical_period;
  return (
    <section className="card a4">
      <button className="noprint" onClick={() => window.print()}>{L("Print", "Cetak")}</button>
      <h1>{a.name}: {L("fire readiness card", "kartu kesiapsiagaan api")}</h1>
      <p className="note">{L("Not an official product. Made for the NASA Space Apps Challenge from NASA FIRMS data.", "Bukan produk resmi. Dibuat untuk NASA Space Apps Challenge dari data NASA FIRMS.")}</p>
      <table><tbody>
        <tr><th>{L("Fire season, typical", "Musim api, tipikal")}</th><td>{L("starts", "mulai")} {weekLabel(tp.onset)} · {L("peaks", "puncak")} {weekLabel(tp.peak)} · {L("ends", "berakhir")} {weekLabel(tp.end)}</td></tr>
        <tr><th>{L("This year", "Tahun ini")} ({a.last_year})</th><td>{lang === "id" ? `minggu ${wk + 1} berada di persentil ke-${pct == null ? "n/a" : Math.round(pct)} dari minggu yang sama pada 2001–2025. Sejak awal tahun: ×${a.ytd_ratio ?? "n/a"} dari jumlah normal (persentil ${Math.round(a.ytd_pct)}).` : `week ${wk + 1} is at the ${pct == null ? "n/a" : Math.round(pct)}th percentile of the same week in 2001–2025. Year to date: ×${a.ytd_ratio ?? "n/a"} of the normal amount (percentile ${Math.round(a.ytd_pct)}).`}</td></tr>
        <tr><th>{L("Average year", "Tahun rata-rata")}</th><td>{Math.round(a.mean_annual_fire_days).toLocaleString()} {L("harmonized fire-days", "hari-api terharmonisasi")}</td></tr>
      </tbody></table>
      <h2>{L("Three things to know", "Tiga hal yang perlu diketahui")}</h2>
      <ol>
        <li>{L("Hotspots show heat, not area burned. Cloud and haze can hide fires.", "Titik panas menunjukkan panas, bukan luas terbakar. Awan dan asap dapat menyembunyikan api.")}</li>
        <li>{L("Years before 2012 are estimated from MODIS and carry uncertainty. Sensors differ, so raw counts are not comparable across 2012.", "Tahun sebelum 2012 diperkirakan dari MODIS dan memiliki ketidakpastian. Sensornya berbeda, sehingga jumlah mentah tidak sebanding sebelum dan sesudah 2012.")}</li>
        <li>{a.low_data ? L("This area has few fires in an average year. Read the percentiles with care.", "Wilayah ini jarang terbakar pada tahun rata-rata. Baca persentil dengan hati-hati.") : L("Percentiles compare each week with the same week in 2001–2025.", "Persentil membandingkan tiap minggu dengan minggu yang sama pada 2001–2025.")}</li>
      </ol>
      <p className="foot">{L("Data as of week", "Data per minggu")} {a.last_week} {L("of", "tahun")} {a.last_year} · NASA FIRMS MODIS and VIIRS · {typeof window !== "undefined" ? window.location.href : ""}</p>
    </section>
  );
}
