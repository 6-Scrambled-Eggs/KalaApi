import { useEffect, useMemo, useRef, useState } from "react";
import Calendar, { Mode } from "./Calendar";
import MonthCalendar from "./MonthCalendar";
import Analog from "./Analog";
import EnsoPanel from "./EnsoPanel";
import Readiness from "./Readiness";
import SheetMargin, { Neighbours } from "./SheetMargin";
import Seasonal from "./Seasonal";
import { Area, AreaIndex, Enso, Meta, Oni, WPY, dateLocale, loadMeta, loadArea, loadEnso, loadOni, matrix, seasonal, weekLabel, nf } from "./data";
import { fmt, useL, useT } from "./i18n";

const modes: [Mode, "harmonized" | "anomaly" | "rawModis" | "rawViirs" | "peatOnly" | "mineralOnly"][] = [["h", "harmonized"], ["a", "anomaly"], ["m", "rawModis"], ["v", "rawViirs"], ["p", "peatOnly"], ["n", "mineralOnly"]];

export default function AreaPage({ id, index, year, mode, setYear, setMode, go }: {
  id: string; index: AreaIndex[]; year: number | null; mode: Mode; setYear: (y: number) => void; setMode: (m: Mode) => void; go: (path: string) => void;
}) {
  const { t } = useT();
  const L = useL();
  const [area, setArea] = useState<Area | null>(null);
  const [err, setErr] = useState("");
  const [oni, setOni] = useState<Oni | null>(null);
  const [copied, setCopied] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => { loadMeta().then(setMeta).catch(() => setMeta(null)); }, []);
  const [grain, setGrain] = useState<"m" | "w">("m");
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
  const endDate = meta ? new Date(meta.data_end + "T00:00:00Z").toLocaleDateString(dateLocale.v, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
  const endLine = endDate ? `${L("Data to", "Data sampai")} ${endDate} (${L("end of S-NPP VIIRS", "akhir S-NPP VIIRS")})` : "";
  const pdate = (s: string) => new Date(s + "T00:00:00Z").toLocaleDateString(dateLocale.v, { day: "numeric", month: "short", timeZone: "UTC" });
  const pv = area.prov && area.prov.weeks.length ? area.prov : null;
  const endLine2 = endLine && pv ? `${endLine} ${fmt(t("provHead"), pdate(pv.through))}` : endLine;
  const mc = area.mcur;
  const monthName = mc ? new Date(Date.UTC(2001, mc.month - 1, 1)).toLocaleDateString(dateLocale.v, { month: "long", timeZone: "UTC" }) : "";
  const summary = (() => {
    const bits: string[] = [];
    if (area.ytd_ratio != null) {
      const r = area.ytd_ratio;
      bits.push(fmt(t(r >= 1.15 ? "sumRatioHigh" : r <= 0.85 ? "sumRatioLow" : "sumRatioMid"), nf(r, 2)));
    }
    if (onsetDiff != null) bits.push(onsetDiff === 0 ? t("sumOnTime") : fmt(t(onsetDiff < 0 ? "sumEarly" : "sumLate"), Math.abs(onsetDiff)));
    return bits.length ? `${area.name}: ${bits.join("; ")}.` : "";
  })();
  const exportMonthCsv = () => {
    const mh = area.mh ?? [], lo = area.mlo ?? [], hi = area.mhi ?? [];
    const hide = -1;
    const rows = ["year,month,harmonized_fire_days,low90,high90,median_2001_2025_same_month"];
    mh.forEach((v, i) => {
      if (v == null || i === hide) return;
      rows.push([area.start_year + Math.floor(i / 12), (i % 12) + 1, v, lo[i] ?? "", hi[i] ?? "", area.mstat?.med[i % 12] ?? ""].join(","));
    });
    const blob = new Blob([rows.join("\n") + "\n"], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `kalaapi_${area.id}_monthly.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const exportCsv = () => {
    if (grain === "m" && area.mh) return exportMonthCsv();
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

  const tools = (
    <div className="tools noprint" role="group" aria-label={t("actions")}>
      <button onClick={exportCsv}><Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" />{t("csv")}</button>
      <button onClick={exportPng}><Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" />{t("png")}</button>
      <button onClick={copyLink} aria-live="polite"><Icon d={copied ? "M5 12l5 5 9-10" : "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"} />{copied ? t("copied") : t("copyLink")}</button>
    </div>
  );
  const more = (
    <div className="tools noprint" role="group" aria-label={t("actions")}>
      <button onClick={() => go(`/brief/${id}`)}><Icon d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" />{t("brief")}</button>
      <button onClick={() => go(`/card/${id}`)}><Icon d="M4 5h16v14H4zM8 10h8M8 14h5" />{t("card")}</button>
      <button onClick={() => go(`/compare/${id}/${id === "indonesia" ? "riau" : area.parent && area.parent !== id ? area.parent : "indonesia"}`)}><Icon d="M8 3v18M16 3v18M3 8h5M16 16h5" />{t("compare")}</button>
      <button onClick={() => go(`/story/${id}`)}><Icon d="M4 19 9 12l4 3 7-9M4 4v15h16" />{t("story")}</button>
      <button onClick={() => go("/surge")}><Icon d="M4 19 9 12l4 3 7-9M4 4v15h16" />{t("surge")}</button>
    </div>
  );

  return (
    <section className="sheet">
      <div className="sheethead">
        <h1 className="sheettitle">{area.name}</h1>
        <div className="sub">{parent && parent.id !== "indonesia" ? `${fmt(t("inProvince"), parent.name)} · ` : ""}{area.start_year}–{area.last_year} · {endLine2}</div>
        <dl className="answers three">
          {mc && <div><dt>{monthName} {mc.year}{mc.partial ? ` (${mc.days}/${mc.days_in_month} ${L("days", "hari")})` : ""}</dt><dd className="fig">{mc.ratio != null ? `×${nf(mc.ratio, 2)}` : "n/a"}</dd><dd>{nf(Math.round(mc.value))} {t("fireDays")} {L("vs median", "vs median")} {nf(Math.round(mc.median))} · {t("pctile")} {Math.round(mc.pct)} {t("pctOf")}</dd></div>}
          <div><dt>{t("ytd")}</dt><dd className="fig">{area.ytd_ratio != null ? `×${nf(area.ytd_ratio, 2)}` : "n/a"}</dd><dd>{t("pctile")} {Math.round(area.ytd_pct)} {t("pctOf")}</dd></div>
          <div><dt>{t("onset")}</dt><dd className="fig">{onsetDiff == null ? "n/a" : onsetDiff === 0 ? t("onTime") : fmt(t(onsetDiff < 0 ? "earlyN" : "lateN"), Math.abs(onsetDiff))}</dd><dd>{cur ? fmt(t("onsetSub"), cur[0], tp.onset, tp.peak) : `${t("typicalPeak")}: ${tp.peak}`}</dd></div>
        </dl>
        {pv && pv.tile && (
          <div className="provtile"><b>{fmt(t("provTileTitle"), pdate(pv.from), pdate(pv.through))}</b>
            <div className="fig">{pv.tile.ratio != null ? `×${nf(pv.tile.ratio, 2)}` : "n/a"}</div>
            <div>{fmt(t("provTileBody"), nf(Math.round(pv.tile.value)), pv.tile.median != null ? nf(Math.round(pv.tile.median)) : "n/a")}</div>
            <small>{t("provTileNote")}</small></div>
        )}
        <p className="note">{L("× = ratio to the median of 2001–2025. Percentile = rank among those 25 years. They measure different things, and the month and the year to date can differ.", "× = rasio terhadap median 2001–2025. Persentil = peringkat di antara 25 tahun itu. Keduanya mengukur hal berbeda, dan bulan serta tahun berjalan bisa berbeda.")}</p>
        {area.low_data && <div className="warn">{t("lowData")}</div>}
      </div>
      <SheetMargin area={area} index={index} tools={tools} />
      <div className="sheetbody">
      <div className="sechead">
        <h2>{t("calendar")}</h2>
        <div className="seg noprint" role="group" aria-label={L("Time step", "Satuan waktu")}>
          {area.mh && <button className={grain === "m" ? "on" : ""} aria-pressed={grain === "m"} onClick={() => setGrain("m")}>{L("Months", "Bulan")}</button>}
          <button className={grain === "w" ? "on" : ""} aria-pressed={grain === "w"} onClick={() => setGrain("w")}>{L("Weeks", "Minggu")}</button>
        </div>
        {grain === "w" && <div className="seg noprint" role="group" aria-label={t("dataView")}>
          {modes.filter(([m]) => hasSplit || (m !== "p" && m !== "n")).map(([m, k]) => <button key={m} className={m === mode ? "on" : ""} aria-pressed={m === mode} onClick={() => setMode(m)}>{t(k)}</button>)}
        </div>}
      </div>
      {grain === "m" && area.mh ? (
        <>
          <MonthCalendar area={area} year={y} onYear={setYear} onReady={(c) => { chart.current = c; }} />
          <p className="note">{L("One row per year, one column per month. Each cell counts harmonized fire-days: one grid cell on one day with at least one daytime detection. Monthly values add up to the weekly values.", "Satu baris per tahun, satu kolom per bulan. Setiap sel menghitung hari-api terharmonisasi: satu sel grid pada satu hari dengan sedikitnya satu deteksi siang. Nilai bulanan sama dengan jumlah nilai mingguan.")} {L("Years before 2012 are estimates and can rank above observed years (see Method, question 2).", "Tahun sebelum 2012 adalah perkiraan dan bisa berada di atas tahun teramati (lihat Metode, pertanyaan 2).")}{area.mpartial ? ` ${L("The 2026 total includes", "Total 2026 termasuk")} 1${area.mpartial.days > 1 ? `–${area.mpartial.days}` : ""} ${new Date(Date.UTC(2001, area.mpartial.index % 12, 1)).toLocaleDateString(dateLocale.v, { month: "short", timeZone: "UTC" })}.` : ""}</p>
        </>
      ) : (
        <>
          <Calendar area={area} mode={mode} year={y} onYear={setYear} oni={oni} onReady={(c) => { chart.current = c; }} />
          <p className="note">{t("calNote")} {mode === "a" ? t("calNoteAnom") : ""} {t("oniNote")}</p>
        </>
      )}
      {summary && <p className="summary">{summary}</p>}
      <Neighbours area={area} />
      <h2>{t("profile")}: {y}</h2>
      <Seasonal area={area} year={y} />
      <h2>{t("anomalies")}: {y}</h2>
      {flagged.length === 0 ? <p className="note">{fmt(t("noFlags"), y)}</p> : (
        <ul className="flags">{flagged.map((f) => (
          <li key={f.w}><span className="wk">{t("week")} {f.w + 1} · {t("fromWord")} {weekLabel(f.w + 1)}</span>
            <span className={`badge ${(f.p as number) >= 97.5 ? "x" : "e"}`} title={f.low ? t("lowBaseNote") : undefined}>{(f.p as number) >= 97.5 ? t(f.low ? "extremeLow" : "extreme") : t(f.low ? "elevatedLow" : "elevated")}</span>
            <span className="s">{t("pctile")} {f.p} · {f.h} {t("fireDays")}{f.p12 != null && y >= 2012 ? ` · ${fmt(t("base12"), f.p12)}` : ""}</span></li>))}</ul>
      )}
      <details className="more noprint">
        <summary>{L("More analysis", "Analisis lanjutan")}</summary>
        {more}
        <p className="note">{area.ytd_ratio_recent != null ? `×${nf(area.ytd_ratio_recent, 2)} ${t("vsRecent")}` : ""}</p>
        <Readiness area={area} />
        <Analog area={area} />
        <EnsoPanel area={area} enso={enso} oni={oni} />
      </details>
      {area.level === "province" && <p className="note">{fmt(t("kabHint"), area.name)}</p>}
      </div>
    </section>
  );
}

/** Line icon, 24-unit grid, drawn with the button's text colour. */
function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
}
