import { useEffect, useMemo, useState } from "react";
import Chart from "./Chart";
import { useT } from "./i18n";

type Live = { generated: string; sources: string[]; days: number; national: number; daily: { date: string; fire_days: number }[]; provinces: { id: string; name: string; fire_days: number }[] };

/** "Right now": the last 5 days from the NASA FIRMS API (NOAA-20/21). Hidden if the file is missing or older than 72 hours. */
export default function LiveStrip() {
  const { lang } = useT();
  const L = lang === "id";
  const [d, setD] = useState<Live | null>(null);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/live.json`, { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null)).then((j) => setD(j)).catch(() => setD(null));
  }, []);
  const fresh = useMemo(() => d && Date.now() - Date.parse(d.generated) < 72 * 3600 * 1000, [d]);
  if (!d || !fresh || !d.daily.length) return null;
  const opt: any = {
    grid: { left: 44, right: 12, top: 10, bottom: 26 }, tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: d.daily.map((r) => r.date.slice(5)) },
    yAxis: { type: "value", name: L ? "hari-api" : "fire-days" },
    series: [{ type: "bar", data: d.daily.map((r) => r.fire_days), itemStyle: { color: "#d95f0e" } }],
  };
  return (
    <div className="live">
      <h2>{L ? "Sekarang: 5 hari terakhir" : "Right now: last 5 days"}</h2>
      <p className="note">
        {L ? "Dari NASA FIRMS (NOAA-20 dan NOAA-21, siang hari, kepercayaan nominal atau tinggi). Satelit ini belum bagian dari seri terkalibrasi, jadi jangan bandingkan langsung dengan kalender."
           : "From the NASA FIRMS API (NOAA-20 and NOAA-21, daytime, nominal or high confidence). These satellites are not part of the calibrated series, so do not compare them directly with the calendar."}
        {" "}{L ? "Diperbarui" : "Updated"} {d.generated.replace("T", " ")} UTC.
      </p>
      <Chart option={opt} height={150} label={L ? "Hari-api harian, 5 hari terakhir" : "Daily fire-days, last 5 days"} />
      <p>{L ? "Provinsi terbanyak:" : "Most active provinces:"}{" "}
        {d.provinces.slice(0, 6).map((p, i) => <span key={p.id}>{i ? " · " : ""}<a href={`#/area/${p.id}`}>{p.name}</a> {p.fire_days}</span>)}</p>
    </div>
  );
}
