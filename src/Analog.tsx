import { Area, analogYears, upto } from "./data";
import { useT } from "./i18n";

/** "This year is most like ...": closest past cumulative curve up to the current week. */
export default function Analog({ area }: { area: Area }) {
  const { lang, t } = useT();
  const id = lang === "id";
  const a = analogYears(area, 2);
  if (!a.length) return null;
  const w = area.last_week;
  const now = upto(area, area.last_year, w);
  const line = (x: { year: number }) => {
    const past = upto(area, x.year, w);
    const r = past > 0 ? now / past : NaN;
    return `${x.year}${x.year < 2012 ? (id ? " (perkiraan dari MODIS)" : " (estimated from MODIS)") : ""}, ×${Number.isFinite(r) ? r.toFixed(2) : "n/a"}`;
  };
  return (
    <div>
      <h2>{t("analogTitle")}: {a[0].year}</h2>
      <p>
        {id ? `Sampai minggu ${w}, ${area.last_year} paling mirip dengan ` : `Up to week ${w}, ${area.last_year} is closest to `}
        <b>{line(a[0])}</b>{a[1] ? (id ? `, lalu ${line(a[1])}.` : `, then ${line(a[1])}.`) : "."}
        {id ? " Angka ×: hari-api tahun ini dibanding tahun itu pada minggu yang sama." : " The × number: this year's fire-days divided by that year's, up to the same week."}
      </p>
      <p className="note">
        {id
          ? "Ini kemiripan bentuk dan besar kurva kumulatif, bukan prakiraan. Tidak menunjukkan bagaimana sisa tahun akan berjalan."
          : "This is a likeness of the cumulative curve in shape and size. It is not a forecast. It does not say how the rest of the year will go."}
      </p>
    </div>
  );
}
