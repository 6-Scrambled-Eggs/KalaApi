import { useEffect, useMemo, useRef, useState } from "react";
import Calendar, { Mode } from "./Calendar";
import Analog from "./Analog";
import EnsoPanel from "./EnsoPanel";
import Readiness, { LEAD } from "./Readiness";
import SheetMargin from "./SheetMargin";
import Seasonal from "./Seasonal";
import { Area, AreaIndex, Enso, Oni, WPY, analogYears, loadArea, loadEnso, loadOni, matrix, readiness, seasonal, weekLabel } from "./data";
import { fmt, useT } from "./i18n";
import { ensoLabel } from "./EnsoPanel";

const modes: [Mode, "harmonized" | "anomaly" | "rawModis" | "rawViirs" | "peatOnly" | "mineralOnly"][] = [["h", "harmonized"], ["a", "anomaly"], ["m", "rawModis"], ["v", "rawViirs"], ["p", "peatOnly"], ["n", "mineralOnly"]];

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
    const P12 = matrix(area.pct12)[y - area.start_year] || [];
    const sm = seasonal(area).med;
    const peakMed = Math.max(...sm.filter((v) => Number.isFinite(v)));
    return P.map((p, w) => ({ w, p, h: H[w], p12: P12[w], low: H[w] != null && H[w] < 0.1 * peakMed })).filter((r) => r.p != null && r.p >= 90).sort((a, b) => (b.p as number) - (a.p as number)).slice(0, 8);
  }, [area, y]);

  if (err) return <section><h1>{t("loadErrTitle")}</h1><p className="error">{t("loadErr")}</p><p><a href="#/">{t("home")}</a></p></section>;
  if (!area) return <p>{t("loading")}</p>;
  const parent = index.find((a) => a.id === area.parent);
  const cur = area.periods[String(area.last_year)];
  const onsetDiff = cur ? cur[0] - area.typical_period.onset : null;
  const tp = area.typical_period;
  const hasSplit = !!(area.h_peat && area.h_min);
  const e0 = enso?.areas[area.id];
  const summary = (() => {
    const bits: string[] = [];
    if (area.ytd_ratio != null) {
      const r = area.ytd_ratio;
      bits.push(fmt(t(r >= 1.15 ? "sumRatioHigh" : r <= 0.85 ? "sumRatioLow" : "sumRatioMid"), r));
    }
    if (onsetDiff != null) bits.push(onsetDiff === 0 ? t("sumOnTime") : fmt(t(onsetDiff < 0 ? "sumEarly" : "sumLate"), Math.abs(onsetDiff)));
    if (e0 && ensoLabel(e0) === "clear" && e0.ratio_el_neu != null && e0.ratio_el_neu > 1) bits.push(fmt(t("sumEl"), e0.ratio_el_neu));
    return bits.length ? `${area.name}: ${bits.join("; ")}.` : "";
  })();
  const exportCsv = () => {
    const rows = ["year,week,harmonized,low90,high90,raw_modis_fire_days,raw_viirs_fire_days,percentile_vs_2001_2025,frp_mw"];
    const g = (a: (number | null)[], i: number) => (a[i] == null ? "" : String(a[i]));
    for (let i = 0; i < area.h.length; i++) {
      if (area.h[i] == null && area.v[i] == null && area.m[i] == null) continue;
      rows.push([area.start_year + Math.floor(i / WPY), (i % WPY) + 1, g(area.h, i), g(area.lo, i), g(area.hi, i), g(area.m, i), g(area.v, i), g(area.pct, i), g(area.frp, i)].join(","));
    }
    const blob = new Blob([rows.join("\n") + "\n"], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `kalaapi_${area.id}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const exportPng = () => {
    const c = chart.current; if (!c) return;
    const a = document.createElement("a"); a.href = c.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#ffffff" }); a.download = `kalaapi_${area.id}_calendar.png`; a.click();
  };
  const copyLink = () => { navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => undefined); };

  const rd = readiness(area);
  const an = analogYears(area, 1)[0];
  const tools = (
    <div className="tools noprint" role="group" aria-label={t("actions")}>
      <button onClick={() => go(`/brief/${id}`)}><Icon d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" />{t("brief")}</button>
      <button onClick={() => go(`/card/${id}`)}><Icon d="M4 5h16v14H4zM8 10h8M8 14h5" />{t("card")}</button>
      <button onClick={() => go(`/compare/${id}/${id === "indonesia" ? "riau" : area.parent && area.parent !== id ? area.parent : "indonesia"}`)}><Icon d="M8 3v18M16 3v18M3 8h5M16 16h5" />{t("compare")}</button>
      <button onClick={() => go(`/story/${id}`)}><Icon d="M4 19 9 12l4 3 7-9M4 4v15h16" />{t("story")}</button>
      <button onClick={exportCsv}><Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" />{t("csv")}</button>
      <button onClick={exportPng}><Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" />{t("png")}</button>
      <button onClick={copyLink} aria-live="polite"><Icon d={copied ? "M5 12l5 5 9-10" : "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"} />{copied ? t("copied") : t("copyLink")}</button>
    </div>
  );

  return (
    <section className="sheet">
      <div className="sheethead">
        <h1 className="sheettitle">{area.name}</h1>
        <div className="sub">{parent && parent.id !== "indonesia" ? `${fmt(t("inProvince"), parent.name)} · ` : ""}{area.start_year}–{area.last_year} · {fmt(t("asOfLine"), area.last_week, area.last_year)}</div>
        <dl className="answers">
          <div><dt>{t("ytd")}</dt><dd className="fig">{area.ytd_ratio != null ? `×${area.ytd_ratio}` : "n/a"}</dd><dd>{t("pctile")} {Math.round(area.ytd_pct)} {t("pctOf")}</dd><dd>{area.ytd_ratio_recent != null ? `×${area.ytd_ratio_recent}` : "n/a"} {t("vsRecent")}</dd></div>
          <div><dt>{t("readyBy")}</dt><dd className="fig">{rd ? weekLabel(Math.max(1, rd.p10 - LEAD)) : "n/a"}</dd><dd>{rd ? fmt(t("readyBySub"), LEAD, rd.p10) : ""}</dd></div>
          <div><dt>{t("onset")}</dt><dd className="fig">{onsetDiff == null ? "n/a" : onsetDiff === 0 ? t("onTime") : fmt(t(onsetDiff < 0 ? "earlyN" : "lateN"), Math.abs(onsetDiff))}</dd><dd>{cur ? fmt(t("onsetSub"), cur[0], tp.onset, tp.peak) : `${t("typicalPeak")}: ${tp.peak}`}</dd></div>
          <div><dt>{t("mostLike")}</dt><dd className="fig">{an ? an.year : "n/a"}</dd><dd>{an && Number.isFinite(an.ratio) ? fmt(t("mostLikeSub"), an.ratio.toFixed(2)) : ""}</dd></div>
        </dl>
        <div className="quick noprint"><button className="cta" onClick={() => go(`/brief/${id}`)}>{t("brief")}</button><button className="cta alt" onClick={() => go(`/card/${id}`)}>{t("card")}</button></div>
        {summary && <p className="summary">{summary}</p>}
        {area.low_data && <div className="warn">{t("lowData")}</div>}
      </div>
      <SheetMargin area={area} index={index} tools={tools} />
      <div className="sheetbody">
      <div className="sechead">
        <h2>{t("calendar")}</h2>
        <div className="seg noprint" role="group" aria-label={t("dataView")}>
          {modes.filter(([m]) => hasSplit || (m !== "p" && m !== "n")).map(([m, k]) => <button key={m} className={m === mode ? "on" : ""} aria-pressed={m === mode} onClick={() => setMode(m)}>{t(k)}</button>)}
        </div>
      </div>
      <p className="note">{t("calNote")} {mode === "a" ? t("calNoteAnom") : ""} {t("oniNote")}</p>
      <Calendar area={area} mode={mode} year={y} onYear={setYear} oni={oni} onReady={(c) => { chart.current = c; }} />
      <h2>{t("profile")}: {y}</h2>
      <Seasonal area={area} year={y} />
      <h2>{t("anomalies")}: {y}</h2>
      {flagged.length === 0 ? <p className="note">{fmt(t("noFlags"), y)}</p> : (
        <ul className="flags">{flagged.map((f) => (
          <li key={f.w}><span className="wk">{t("week")} {f.w + 1} · {t("fromWord")} {weekLabel(f.w + 1)}</span>
            <span className={`badge ${(f.p as number) >= 97.5 ? "x" : "e"}`} title={f.low ? t("lowBaseNote") : undefined}>{(f.p as number) >= 97.5 ? t(f.low ? "extremeLow" : "extreme") : t(f.low ? "elevatedLow" : "elevated")}</span>
            <span className="s">{t("pctile")} {f.p} · {f.h} {t("fireDays")}{f.p12 != null && y >= 2012 ? ` · ${fmt(t("base12"), f.p12)}` : ""}</span></li>))}</ul>
      )}
      <Readiness area={area} />
      <Analog area={area} />
      <EnsoPanel area={area} enso={enso} oni={oni} />
      {area.level === "province" && <p className="note">{fmt(t("kabHint"), area.name)}</p>}
      </div>
    </section>
  );
}

/** Line icon, 24-unit grid, drawn with the button's text colour. */
function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
}
