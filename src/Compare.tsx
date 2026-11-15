import { useEffect, useMemo, useState } from "react";
import Chart from "./Chart";
import { ensoLabel } from "./EnsoPanel";
import { Area, AreaIndex, Enso, WPY, loadArea, loadEnso, matrix, readiness, seasonal, upto, weekLabel, nf } from "./data";
import { useT } from "./i18n";
import "./tool-pages.css";

const COLS = ["#b03a12", "#1f6fa8"];

/** Compare two places: typical season shape, 2026 vs 2015 curves, and the key numbers side by side. */
export default function Compare({ idA, idB, index, go }: { idA: string; idB: string; index: AreaIndex[]; go: (p: string) => void }) {
  const { lang } = useT();
  const L = lang === "id";
  const [A, setA] = useState<Area | null>(null);
  const [B, setB] = useState<Area | null>(null);
  const [enso, setEnso] = useState<Enso | null>(null);
  useEffect(() => { setA(null); loadArea(idA).then(setA); }, [idA]);
  useEffect(() => { setB(null); loadArea(idB).then(setB); }, [idB]);
  useEffect(() => { loadEnso().then(setEnso).catch(() => undefined); }, []);
  const opts = useMemo(() => index.filter((a) => a.level !== "kabupaten" || a.id === idA || a.id === idB), [index, idA, idB]);

  const charts = useMemo(() => {
    if (!A || !B) return null;
    const areas = [A, B];
    const weeks = Array.from({ length: WPY }, (_, i) => String(i + 1));
    // season shape: median share of the year's fire-days per week (2001-2025)
    const shape = areas.map((a) => {
      const M = matrix(a.h);
      const rows: number[][] = [];
      for (let y = 2001; y <= 2025; y++) {
        const r = M[y - a.start_year] || [];
        if (r.length !== WPY || r.some((v) => v == null)) continue;
        const tot = (r as number[]).reduce((s, v) => s + v, 0);
        if (tot > 0) rows.push((r as number[]).map((v) => (v / tot) * 100));
      }
      return Array.from({ length: WPY }, (_, w) => { const c = rows.map((r) => r[w]).sort((x, y) => x - y); return c.length ? Math.round(c[Math.floor(c.length / 2)] * 100) / 100 : 0; });
    });
    const shapeOpt = {
      grid: { left: 52, right: 12, top: 36, bottom: 34 }, legend: { top: 0, type: "scroll" }, tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: weeks, name: L ? "minggu" : "week", nameLocation: "middle", nameGap: 22 },
      yAxis: { type: "value", name: "%", nameGap: 10 },
      series: areas.map((a, i) => ({ name: a.name, type: "line", showSymbol: false, data: shape[i], lineStyle: { color: COLS[i], width: 2.5 }, itemStyle: { color: COLS[i] } })),
    } as any;
    // 2015 vs current year, each area's cumulative as % of its own 2015 total
    const cumOpt = (() => {
      const series: any[] = [];
      areas.forEach((a, i) => {
        const M = matrix(a.h);
        const tot15 = upto(a, 2015, WPY);
        const cum = (y: number) => { let s = 0; return (M[y - a.start_year] || []).map((v) => (v == null ? "-" : Math.round(((s += v) / tot15) * 1000) / 10)); };
        series.push({ name: `${a.name} ${a.last_year}`, type: "line", showSymbol: false, data: cum(a.last_year), lineStyle: { color: COLS[i], width: 3 }, itemStyle: { color: COLS[i] } });
        series.push({ name: `${a.name} 2015`, type: "line", showSymbol: false, data: cum(2015), lineStyle: { color: COLS[i], width: 1.8, type: "dashed" }, itemStyle: { color: COLS[i] } });
      });
      return {
        grid: { left: 52, right: 12, top: 30, bottom: 104 }, legend: { bottom: 0 }, tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: weeks, name: L ? "minggu" : "week", nameLocation: "middle", nameGap: 22 },
        yAxis: { type: "value", name: L ? "% dari total 2015" : "% of own 2015 total", nameGap: 10 },
        series,
      } as any;
    })();
    return { shapeOpt, cumOpt };
  }, [A, B, L]);

  const sel = (val: string, other: string, set: (v: string) => void) => (
    <select value={val} onChange={(e) => set(e.target.value)} aria-label={L ? "Pilih wilayah" : "Pick an area"}>
      {opts.filter((o) => o.id !== other).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
  const row = (a: Area) => {
    const w = a.last_week, r = readiness(a), e = enso?.areas[a.id];
    const now = upto(a, a.last_year, w), u15 = upto(a, 2015, w);
    return {
      ytd: a.ytd_ratio != null ? `×${nf(a.ytd_ratio, 2)} (${L ? "persentil" : "percentile"} ${Math.round(a.ytd_pct)})` : "n/a",
      vs15: u15 > 0 ? `${Math.round((now / u15) * 100)}%` : "n/a",
      onset: r ? `${L ? "minggu" : "wk"} ${r.median} (${weekLabel(r.median)}), ${L ? "rentang" : "range"} ${r.earliest}–${r.latest}` : "n/a",
      peak: `${L ? "minggu" : "wk"} ${a.typical_period.peak} (${weekLabel(a.typical_period.peak)})`,
      enso: e ? `${L ? ({ clear: "jelas", suggestive: "indikasi", weak: "lemah", none: "tidak ada", reverse: "terbalik" } as Record<string, string>)[ensoLabel(e)] : ensoLabel(e)}, ρ = ${nf(e.rho, 2)}` : "n/a",
      mean: nf(Math.round(a.mean_annual_fire_days)),
    };
  };
  const ra = A ? row(A) : null, rb = B ? row(B) : null;
  const pick = (a: string, b: string) => go(`/compare/${a}/${b}`);
  return (
    <section className="cmp">
      <h1>{L ? "Bandingkan dua wilayah" : "Compare two places"}</h1>
      <div className="row">{sel(idA, idB, (v) => pick(v, idB))} <span>{L ? "dan" : "and"}</span> {sel(idB, idA, (v) => pick(idA, v))}
        <button className="cta alt" onClick={() => pick(idB, idA)}>{L ? "Tukar" : "Swap"}</button></div>
      {!A || !B || !charts || !ra || !rb ? <p>{L ? "Memuat…" : "Loading…"}</p> : (
        <>
          <div className="cmp-table-wrap" role="region" aria-label={L ? "Bandingkan dua wilayah" : "Compare two places"} tabIndex={0}>
          <table>
            <thead><tr><th></th><th style={{ color: COLS[0] }}>{A.name}</th><th style={{ color: COLS[1] }}>{B.name}</th></tr></thead>
            <tbody>
              <tr><th>{L ? "Tahun ini vs normal" : "This year vs normal"}</th><td>{ra.ytd}</td><td>{rb.ytd}</td></tr>
              <tr><th>{L ? `${A.last_year} dibanding 2015 (minggu ${A.last_week})` : `${A.last_year} vs 2015 (same weeks)`}</th><td>{ra.vs15}</td><td>{rb.vs15}</td></tr>
              <tr><th>{L ? "Awal musim (median)" : "Season onset (median)"}</th><td>{ra.onset}</td><td>{rb.onset}</td></tr>
              <tr><th>{L ? "Puncak biasanya" : "Typical peak"}</th><td>{ra.peak}</td><td>{rb.peak}</td></tr>
              <tr><th>{L ? "Kaitan El Niño" : "El Niño link"}</th><td>{ra.enso}</td><td>{rb.enso}</td></tr>
              <tr><th>{L ? "Hari-api rata-rata per tahun" : "Fire-days in an average year"}</th><td>{ra.mean}</td><td>{rb.mean}</td></tr>
            </tbody>
          </table>
          </div>
          <h2>{L ? "Bentuk musim yang biasa" : "Typical season shape"}</h2>
          <p className="note">{L ? "Median bagian hari-api tahunan per minggu, 2001–2025. Dinormalkan, jadi wilayah besar dan kecil bisa dibandingkan." : "Median share of each year's fire-days by week, 2001–2025. Normalized, so a big and a small area can be compared."}</p>
          <Chart option={charts.shapeOpt} height={260} label="Typical season shape of both areas" />
          <h2>{A.last_year} {L ? "dibanding 2015" : "against 2015"}</h2>
          <p className="note">{L ? "Hari-api kumulatif sebagai persen dari total 2015 wilayah itu sendiri. Garis putus-putus: 2015." : "Cumulative fire-days as a percent of each area's own 2015 total. Dashed lines: 2015."}</p>
          <Chart option={charts.cumOpt} height={360} label="Current year against 2015 for both areas" />
          <p className="note">{L ? "Titik panas menunjukkan panas, bukan luas terbakar. Tahun sebelum 2012 diperkirakan dari MODIS." : "Hotspots show heat, not area burned. Years before 2012 are estimated from MODIS."} <a href={`#/area/${idA}`}>{A.name}</a> · <a href={`#/area/${idB}`}>{B.name}</a></p>
        </>
      )}
    </section>
  );
}
