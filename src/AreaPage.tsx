import { useEffect, useMemo, useState } from "react";
import Calendar, { Mode } from "./Calendar";
import Seasonal from "./Seasonal";
import { Area, AreaIndex, WPY, loadArea, matrix, weekLabel } from "./data";
import { useT } from "./i18n";

const modes: [Mode, "harmonized" | "rawModis" | "rawViirs"][] = [["h", "harmonized"], ["m", "rawModis"], ["v", "rawViirs"]];

export default function AreaPage({ id, index, year, mode, setYear, setMode, go }: {
  id: string; index: AreaIndex[]; year: number | null; mode: Mode; setYear: (y: number) => void; setMode: (m: Mode) => void; go: (path: string) => void;
}) {
  const { t } = useT();
  const [area, setArea] = useState<Area | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { setArea(null); setErr(""); loadArea(id).then(setArea).catch((e) => setErr(String(e))); }, [id]);
  const y = year ?? area?.last_year ?? 2026;

  const flagged = useMemo(() => {
    if (!area) return [];
    const P = matrix(area.pct)[y - area.start_year] || [];
    const H = matrix(area.h)[y - area.start_year] || [];
    return P.map((p, w) => ({ w, p, h: H[w] })).filter((r) => r.p != null && r.p >= 90).sort((a, b) => (b.p as number) - (a.p as number)).slice(0, 8);
  }, [area, y]);

  if (err) return <p className="error">Could not load this area. {err}</p>;
  if (!area) return <p>{t("loading")}</p>;
  const parent = index.find((a) => a.id === area.parent);
  const cur = area.periods[String(area.last_year)];
  const onsetDiff = cur ? cur[0] - area.typical_period.onset : null;
  const tp = area.typical_period;

  return (
    <section>
      <div className="head">
        <div>
          <h1>{area.name}</h1>
          <div className="sub">{parent && parent.id !== "indonesia" ? `${parent.name} · ` : ""}{area.start_year}–{area.last_year} · {t("asOf")} week {area.last_week} of {area.last_year}</div>
        </div>
        <div className="toggles" role="group" aria-label="Data view">
          {modes.map(([m, k]) => <button key={m} className={m === mode ? "on" : ""} onClick={() => setMode(m)}>{t(k)}</button>)}
          <button onClick={() => go(`/card/${id}`)}>{t("card")}</button>
          <button onClick={() => go(`/story/${id}`)}>{t("story")}</button>
        </div>
      </div>
      {area.low_data && <div className="warn">{t("lowData")}</div>}
      <div className="tiles">
        <div className="tile"><div className="k">{t("ytd")}</div><div className="v">{area.ytd_ratio != null ? `×${area.ytd_ratio}` : "n/a"}</div><div className="s">{t("pctile")} {Math.round(area.ytd_pct)} of 2001–2025</div></div>
        <div className="tile"><div className="k">{t("typicalPeak")}</div><div className="v">{tp.peak}</div><div className="s">{weekLabel(tp.peak)} · onset {weekLabel(tp.onset)} · end {weekLabel(tp.end)}</div></div>
        <div className="tile"><div className="k">{t("onset")}</div><div className="v">{onsetDiff == null ? "n/a" : onsetDiff === 0 ? "on time" : `${Math.abs(onsetDiff)} wk ${onsetDiff < 0 ? "early" : "late"}`}</div><div className="s">{area.last_year}: {cur ? `${t("week")} ${cur[0]}` : "n/a"} vs typical {tp.onset}</div></div>
      </div>
      <h2>{t("calendar")}</h2>
      <p className="note">One row per year, one column per 7-day block. Rows before 2012 are estimated from MODIS and shown with a pale overlay. Click a row to compare that year below.</p>
      <Calendar area={area} mode={mode} year={y} onYear={setYear} />
      <h2>{t("profile")}: {y}</h2>
      <Seasonal area={area} year={y} />
      <h2>{t("anomalies")}: {y}</h2>
      {flagged.length === 0 ? <p className="note">No weeks at or above the 90th percentile in {y}.</p> : (
        <ul className="flags">{flagged.map((f) => (
          <li key={f.w}><button onClick={() => setYear(y)}>{t("week")} {f.w + 1} · from {weekLabel(f.w + 1)}</button>
            <span className={`badge ${(f.p as number) >= 97.5 ? "x" : "e"}`}>{(f.p as number) >= 97.5 ? t("extreme") : t("elevated")}</span>
            <span className="s">{t("pctile")} {f.p} · {f.h} {t("fireDays")}</span></li>))}</ul>
      )}
      {area.level === "province" && <p className="note"><a href={`#/area/${id}`}>Kabupaten in {area.name}</a>: use the search box above.</p>}
    </section>
  );
}
