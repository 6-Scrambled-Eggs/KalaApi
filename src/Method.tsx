import { useEffect, useState } from "react";
import { Area, AreaIndex, Meta, Validation, loadArea, loadMeta, loadValidation, matrix, weekLabel } from "./data";

function Three({ index }: { index: AreaIndex[] }) {
  const [id, setId] = useState("kalimantan-tengah");
  const [a, setA] = useState<Area | null>(null);
  useEffect(() => { loadArea(id).then(setA); }, [id]);
  const get = (m: (number | null)[], y: number, w: number) => matrix(m)[y - 2001]?.[w - 1];
  const row = (y: number, w: number) => a && ({
    harm: get(a.h, y, w), lo: get(a.lo, y, w), hi: get(a.hi, y, w), m: get(a.m, y, w), v: get(a.v, y, w),
  });
  const ex = [[2015, 38], [2009, 38]].map(([y, w]) => ({ y, w, r: row(y, w) }));
  return (
    <>
      <h3>One week, three ways</h3>
      <label className="row">Area: <select value={id} onChange={(e) => setId(e.target.value)}>
        {index.filter((x) => x.level === "province").map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <table><thead><tr><th>Week</th><th>Raw MODIS (Aqua fire-days)</th><th>Raw VIIRS (S-NPP fire-days)</th><th>Harmonized</th></tr></thead>
        <tbody>{ex.map(({ y, w, r }) => r && (
          <tr key={y}><td>{y}, week {w} (from {weekLabel(w)})</td><td>{r.m ?? "n/a"}</td><td>{r.v ?? "not flown yet"}</td>
            <td>{r.harm ?? "n/a"}{y < 2012 && r.lo != null ? ` (90%: ${r.lo} to ${r.hi}), estimated` : ", observed VIIRS"}</td></tr>))}</tbody></table>
      <p className="note">Before 2012 only MODIS exists, so the harmonized value is an estimate with a band. From 2012 the harmonized value is the observed VIIRS fire-day count.</p>
    </>
  );
}

export default function Method({ index }: { index: AreaIndex[] }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [val, setVal] = useState<Validation | null>(null);
  useEffect(() => { loadMeta().then(setMeta); loadValidation().then(setVal).catch(() => setVal(null)); }, []);
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
  const errs = (h: Validation["V1_holdout"]) => Object.entries(h.national_err_pct).map(([y, e]) => `${y}: ${e > 0 ? "+" : ""}${e.toFixed(1)}%`).join(", ");
  return (
    <section>
      <h1>Method and data</h1>
      <p className="lead">We harmonize fire-days, not hotspot counts, and calibrate MODIS to VIIRS on the 2012–2026 overlap. The output unit is the VIIRS-equivalent fire-day.</p>
      <Three index={index} />
      <h2>How it works</h2>
      <ol>
        <li>Keep vegetation-fire detections, daytime passes only (afternoon orbit: Aqua MODIS, S-NPP VIIRS). Local solar date. MODIS confidence ≥ 30, VIIRS nominal or high.</li>
        <li>Snap to 0.05° cells (about 5.5 km). A fire-day is one cell on one day with at least one detection.</li>
        <li>For each stratum, the ratio k = VIIRS fire-days ÷ Aqua MODIS fire-days on the overlap. A stratum is a province, or its island group when the province has too few fire-days.</li>
        <li>Back-cast 2002–2011 as k × Aqua MODIS fire-days. Before July 2002 Aqua did not exist, so Terra is scaled to Aqua first.</li>
        <li>The 90% band comes from 1,000 bootstrap draws that resample years.</li>
        <li>From 2012 the series is the observed S-NPP VIIRS count.</li>
      </ol>
      <h2>Validation</h2>
      {val ? (
        <ul>
          <li><b>Holdout 2019 and 2023</b> (calibrated without them): national annual error {errs(val.V1_holdout)}; {pct(val.V1_holdout.share_within_20pct)} of province-years within ±20%; median weekly correlation {val.V1_holdout.median_weekly_r.toFixed(2)}.</li>
          <li><b>Reverse-time holdout</b> (calibrated on 2018–2026, predicting 2012–2017): national annual error {errs(val.V6_reverse)}; {pct(val.V6_reverse.share_within_20pct)} within ±20%; median weekly r {val.V6_reverse.median_weekly_r.toFixed(2)}. Quiet years are under-predicted, so back-cast bands for quiet years are likely too narrow.</li>
          <li><b>Known events</b>: {Object.entries(val.V5_known_events).map(([k, v]) => `${k}: top weekly percentile ${v.max_pct.toFixed(0)}`).join("; ")}.</li>
          <li><b>Small areas</b>: {val.V2_small_areas.low_data_areas} of {val.V2_small_areas.total_areas} areas have fewer than 50 fire-days a year and carry a low-data note.</li>
          <li><b>Burned-area cross-check (MCD64A1)</b>: {val.V7_burned_area.status}. {val.V7_burned_area.reason}.</li>
          {!val.V3_peat_available && <li><b>Peat vs mineral split</b>: not available yet. No peat polygon file was used in this build.</li>}
        </ul>
      ) : <p>Validation results are not available.</p>}
      {meta && (<>
        <h2>Calibration ratios</h2>
        <table><thead><tr><th>Stratum</th><th>Peat</th><th>k (VIIRS ÷ MODIS)</th><th>90% interval</th></tr></thead>
          <tbody>{meta.strata.map((s) => <tr key={s.stratum + s.peat}><td>{s.stratum}</td><td>{s.peat}</td><td>{s.k.toFixed(2)}</td><td>{s.k_lo.toFixed(2)} to {s.k_hi.toFixed(2)}</td></tr>)}</tbody></table>
        <p className="note">Data as of {meta.data_end}. Baseline for anomalies: {meta.baseline}. Built {meta.generated}.</p>
      </>)}
      <h2>Limits</h2>
      <ul>
        <li>Hotspots are heat detections, not area burned. Cloud and thick haze can hide fires, so the worst weeks may be undercounted.</li>
        <li>Fire-days soften but do not remove the sensor difference. That is why we calibrate.</li>
        <li>Rows before 2012 are estimates. The 2001–2011 baseline years are estimates too.</li>
        <li>Near-real-time files (after July–August 2026) have no vegetation-fire type flag, so static and offshore sources are not filtered there.</li>
      </ul>
      <h2>Sources</h2>
      <ul>
        <li>NASA FIRMS: MODIS C6.1, VIIRS S-NPP, NOAA-20, NOAA-21 active fire archive (Indonesia, 2000-11-01 to 2026-11-14).</li>
        <li>geoBoundaries (gbOpen, CC BY 4.0): Indonesia ADM1 and ADM2. Papua provinces split by kabupaten into the 2022–2023 provinces.</li>
        <li>NASA Earthdata and CAMS notes on the S-NPP VIIRS transition and MODIS orbit drift.</li>
      </ul>
    </section>
  );
}
