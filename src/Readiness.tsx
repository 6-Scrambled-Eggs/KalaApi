import { Area, readiness, weekLabel } from "./data";
import { useT } from "./i18n";

const LEAD = 4;

/** Readiness window: when the fire season usually starts here, and a simple "be ready by" date. */
export default function Readiness({ area }: { area: Area }) {
  const { lang, t } = useT();
  const id = lang === "id";
  const r = readiness(area);
  if (!r) return <p className="note">{id ? "Terlalu sedikit tahun dengan musim api yang jelas di wilayah ini." : "Too few years with a clear fire season in this area."}</p>;
  const ready = Math.max(1, r.p10 - LEAD);
  return (
    <div>
      <h2>{t("readyTitle")}</h2>
      <p className="note">{t("notOfficial")}</p>
      <div className="tiles">
        <div className="tile"><div className="k">{id ? "Paling awal" : "Earliest onset"}</div><div className="v">{id ? "mgg" : "wk"} {r.earliest}</div><div className="s">{weekLabel(r.earliest)}</div></div>
        <div className="tile"><div className="k">{id ? "Tengah (median)" : "Median onset"}</div><div className="v">{id ? "mgg" : "wk"} {r.median}</div><div className="s">{weekLabel(r.median)}</div></div>
        <div className="tile"><div className="k">{id ? "Paling akhir" : "Latest onset"}</div><div className="v">{id ? "mgg" : "wk"} {r.latest}</div><div className="s">{weekLabel(r.latest)}</div></div>
        <div className="tile"><div className="k">{id ? "Siap paling lambat" : "Be ready by"}</div><div className="v">{weekLabel(ready)}</div><div className="s">{id ? `${LEAD} minggu sebelum awal musim yang dini (minggu ${r.p10})` : `${LEAD} weeks before the early-onset week (week ${r.p10})`}</div></div>
      </div>
      <p className="note">
        {id
          ? `Awal musim = minggu ketika 10% dari hari-api setahun sudah terjadi. Dari ${r.n} tahun (${area.start_year}–${area.last_year - 1}): sekitar 9 dari 10 tahun musim mulai pada atau setelah minggu ${r.p10}. Ini awal aktivitas titik panas, bukan awal kekeringan atau penyalaan api. Aturan ${LEAD} minggu adalah asumsi kami, bukan aturan resmi.`
          : `Onset = the first week when 10% of the year's fire-days have happened. Over ${r.n} years (${area.start_year}–${area.last_year - 1}), about 9 in 10 seasons began in or after week ${r.p10}. This is the start of hotspot activity, not of drought or ignition. The ${LEAD}-week lead is our assumption, not an official rule.`}
      </p>
    </div>
  );
}
