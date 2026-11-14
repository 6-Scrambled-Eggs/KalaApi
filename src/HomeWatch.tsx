import { useEffect, useRef, useState } from "react";
import { Area, AreaIndex, analogYears, loadArea, loadMeta } from "./data";
import { fmt, useT } from "./i18n";

/** Home: provinces to watch (highest percentile this year vs normal), and a shareable weekly card. */
export default function HomeWatch({ index }: { index: AreaIndex[] }) {
  const { lang, t } = useT();
  const L = lang === "id";
  const [nat, setNat] = useState<Area | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { loadArea("indonesia").then(setNat).catch(() => undefined); loadMeta().then((m) => setWeek(m.last_complete_week)).catch(() => undefined); }, []);
  const top = index.filter((a) => a.level === "province" && !a.low_data && a.mean_annual_fire_days >= 1000 && a.ytd_ratio != null)
    .sort((a, b) => b.ytd_pct - a.ytd_pct || (b.ytd_ratio ?? 0) - (a.ytd_ratio ?? 0)).slice(0, 5);
  const n = index.find((a) => a.id === "indonesia");
  const analog = nat ? analogYears(nat, 1)[0]?.year : undefined;
  const lines = week == null || !n ? [] : [
    L ? `KalaApi · minggu ${week}, 2026` : `KalaApi · week ${week}, 2026`,
    L ? `Indonesia: ×${n.ytd_ratio} dari normal sejauh ini tahun ini (persentil ${Math.round(n.ytd_pct)} dari 2001–2025).`
      : `Indonesia: ${n.ytd_ratio} times normal so far this year (percentile ${Math.round(n.ytd_pct)} of 2001–2025).`,
    (L ? "Provinsi untuk dipantau: " : "Provinces to watch: ") + top.slice(0, 3).map((a) => `${a.name} ×${a.ytd_ratio}`).join(", ") + ".",
    analog ? (L ? `Tahun paling mirip sejauh ini: ${analog} (kemiripan kurva, bukan prakiraan).` : `Most similar year so far: ${analog} (a likeness of the curve, not a forecast).`) : "",
  ].filter(Boolean);
  const canvas = useRef<HTMLCanvasElement>(null);
  const download = () => {
    const c = document.createElement("canvas"); c.width = 1200; c.height = 630;
    const g = c.getContext("2d"); if (!g) return;
    g.fillStyle = "#fff"; g.fillRect(0, 0, 1200, 630); g.fillStyle = "#993404"; g.fillRect(0, 0, 1200, 14);
    g.fillStyle = "#111"; g.font = "bold 44px sans-serif"; g.fillText(lines[0], 60, 100);
    g.font = "32px sans-serif";
    let y = 190;
    lines.slice(1).forEach((l) => { const words = l.split(" "); let cur = "";
      words.forEach((w) => { if (g.measureText(cur + w).width > 1080) { g.fillText(cur, 60, y); y += 46; cur = ""; } cur += w + " "; });
      g.fillText(cur, 60, y); y += 70; });
    g.fillStyle = "#666"; g.font = "24px sans-serif";
    g.fillText(L ? "Bukan produk resmi · data NASA FIRMS · 6 Scrambled Eggs · NASA Space Apps 2026" : "Not an official product · NASA FIRMS data · 6 Scrambled Eggs · NASA Space Apps 2026", 60, 590);
    const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = `kalaapi_week${week}.png`; a.click();
  };
  const copy = () => navigator.clipboard?.writeText(lines.join("\n")).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => undefined);
  void canvas;
  if (!top.length) return null;
  return (
    <div className="watch">
      <div className="watchcol">
        <h2>{L ? "Provinsi untuk dipantau" : "Provinces to watch"}</h2>
        <p className="note">{L ? "Peringkat menurut persentil tahun ini dibanding minggu yang sama 2001–2025. Hanya provinsi dengan minimal 1.000 hari-api pada tahun rata-rata, agar basis kecil tidak mendominasi." : "Ranked by this year's percentile against the same weeks in 2001–2025. Only provinces with at least 1,000 fire-days in an average year, so tiny bases do not dominate."}</p>
        <ol className="watchlist">{top.map((a) => (
          <li key={a.id}><a href={`#/area/${a.id}`}>{a.name}</a><span className="bar"><i style={{ width: `${Math.max(4, Math.round(a.ytd_pct))}%` }} /></span>
            <span className="s">×{a.ytd_ratio} · {t("pctile")} {Math.round(a.ytd_pct)}</span></li>))}</ol>
      </div>
      <div className="watchcol">
        <h2>{L ? "Kartu minggu ini" : "This week's card"}</h2>
        <div className="sharetext">{lines.map((l, i) => <p key={i} className={i === 0 ? "b" : ""}>{l}</p>)}</div>
        <div className="toggles"><button onClick={copy}>{copied ? t("copied") : (L ? "Salin teks" : "Copy text")}</button><button onClick={download}>{t("png")}</button></div>
      </div>
    </div>
  );
}
