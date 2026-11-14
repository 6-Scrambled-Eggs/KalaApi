import { useEffect, useMemo, useRef, useState } from "react";
import Calendar, { Mode } from "./Calendar";
import Analog from "./Analog";
import EnsoPanel from "./EnsoPanel";
import Readiness from "./Readiness";
import Seasonal from "./Seasonal";
import { Area, AreaIndex, Enso, Oni, WPY, loadArea, loadEnso, loadOni, matrix, weekLabel } from "./data";
import { useT } from "./i18n";

const modes: [Mode, "harmonized" | "rawModis" | "rawViirs" | "peatOnly" | "mineralOnly"][] = [["h", "harmonized"], ["m", "rawModis"], ["v", "rawViirs"], ["p", "peatOnly"], ["n", "mineralOnly"]];

export default function AreaPage({ id, index, year, mode, setYear, setMode, go }: {
  id: string; index: AreaIndex[]; year: number | null; mode: Mode; setYear: (y: number) => void; setMode: (m: Mode) => void; go: (path: string) => void;
}) {
  const { t } = useT();
  const [area, setArea] = useState<Area | null>(null);
  const [err, setErr] = useState("");
  const [oni, setOni] = useState<Oni | null>(null);
  const [copied, setCopied] = useState(false);
  const [enso, setEnso] = useState<Enso | null>(null);
  const chart = useRef<any>(null);
  useEffect(() => { loadOni().then(setOni).catch(() => setOni(null)); loadEnso().then(setEnso).catch(() => setEnso(null)); }, []);
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
  const hasSplit = !!(area.h_peat && area.h_min);
  const exportCsv = () => {
    const rows = ["year,week,harmonized,low90,high90,raw_modis_fire_days,raw_viirs_fire_days,percentile_vs_2001_2025,frp_mw"];
    const g = (a: (number | null)[], i: number) => (a[i] == null ? "" : String(a[i]));
    for (let i = 0; i < area.h.length; i++) {
      if (area.h[i] == null && area.v[i] == null && area.m[i] == null) continue;
      rows.push([area.start_year + Math.floor(i / WPY), (i % WPY) + 1, g(area.h, i), g(area.lo, i), g(area.hi, i), g(area.m, i), g(area.v, i), g(area.pct, i), g(area.frp, i)].join(","));
    }
    const blob = new Blob([rows.join("\n") + "\n"], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `kalaapi_${area.id}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const exportPng = () => {
    const c = chart.current; if (!c) return;
    const a = document.createElement("a"); a.href = c.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" }); a.download = `kalaapi_${area.id}_calendar.png`; a.click();
  };
  const copyLink = () => { navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => undefined); };

  return (
    <section>
      <div className="head">
        <div>
          <h1>{area.name}</h1>
          <div className="sub">{parent && parent.id !== "indonesia" ? `${parent.name} · ` : ""}{area.start_year}–{area.last_year} · {t("asOf")} week {area.last_week} of {area.last_year}</div>
        </div>
        <div className="toggles" role="group" aria-label="Data view">
          {modes.filter(([m]) => hasSplit || (m !== "p" && m !== "n")).map(([m, k]) => <button key={m} className={m === mode ? "on" : ""} onClick={() => setMode(m)}>{t(k)}</button>)}
          <button onClick={() => go(`/compare/${id}/${id === "indonesia" ? "riau" : area.parent && area.parent !== id ? area.parent : "indonesia"}`)}>{t("compare")}</button>
          <button onClick={() => go(`/brief/${id}`)}>{t("brief")}</button>
          <button onClick={() => go(`/card/${id}`)}>{t("card")}</button>
          <button onClick={() => go(`/story/${id}`)}>{t("story")}</button>
          <button onClick={exportCsv}>{t("csv")}</button>
          <button onClick={exportPng}>{t("png")}</button>
          <button onClick={copyLink}>{copied ? t("copied") : t("copyLink")}</button>
        </div>
      </div>
      {area.low_data && <div className="warn">{t("lowData")}</div>}
      <div className="tiles">
        <div className="tile"><div className="k">{t("ytd")}</div><div className="v">{area.ytd_ratio != null ? `×${area.ytd_ratio}` : "n/a"}</div><div className="s">{t("pctile")} {Math.round(area.ytd_pct)} of 2001–2025</div><div className="s">{area.ytd_ratio_recent != null ? `×${area.ytd_ratio_recent}` : "n/a"} {t("vsRecent")} · {t("pctile")} {Math.round(area.ytd_pct_recent)}</div></div>
        <div className="tile"><div className="k">{t("typicalPeak")}</div><div className="v">{tp.peak}</div><div className="s">{weekLabel(tp.peak)} · onset {weekLabel(tp.onset)} · end {weekLabel(tp.end)}</div></div>
        <div className="tile"><div className="k">{t("onset")}</div><div className="v">{onsetDiff == null ? "n/a" : onsetDiff === 0 ? "on time" : `${Math.abs(onsetDiff)} wk ${onsetDiff < 0 ? "early" : "late"}`}</div><div className="s">{area.last_year}: {cur ? `${t("week")} ${cur[0]}` : "n/a"} vs typical {tp.onset}</div></div>
      </div>
      <Readiness area={area} />
      <Analog area={area} />
      <EnsoPanel area={area} enso={enso} oni={oni} />
      <h2>{t("calendar")}</h2>
      <p className="note">One row per year, one column per 7-day block. Rows before 2012 are estimated from MODIS and shown with a pale overlay. Click a row to compare that year below. {t("oniNote")}</p>
      <Calendar area={area} mode={mode} year={y} onYear={setYear} oni={oni} onReady={(c) => { chart.current = c; }} />
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
