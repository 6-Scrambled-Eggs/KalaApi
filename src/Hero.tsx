import { useEffect, useMemo, useState } from "react";
import Chart from "./Chart";
import { Area, AreaIndex, WPY, annualTotals, loadArea, nf } from "./data";
import { useT } from "./i18n";

function mean(xs: (number | null)[]) {
  const v = xs.filter((x): x is number => x != null);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

/** FR-19: raw stitched series next to the harmonized series, with the step at 2012 measured. */
export default function Hero({ areaId, index, onPick }: { areaId: string; index: AreaIndex[]; onPick: (id: string) => void }) {
  const { t } = useT();
  const [area, setArea] = useState<Area | null>(null);
  useEffect(() => { setArea(null); loadArea(areaId).then(setArea); }, [areaId]);

  const view = useMemo(() => {
    if (!area) return null;
    const x = (i: number) => area.start_year + (i % 1000000) / WPY;
    const pts = (s: (number | null)[]) => s.map((v, i) => (v == null ? null : [x(i), v]));
    const cnt = annualTotals(area.cnt, area.start_year), h = annualTotals(area.h, area.start_year);
    const pick = (a: { year: number; total: number | null }[], y0: number, y1: number) =>
      mean(a.filter((r) => r.year >= y0 && r.year <= y1).map((r) => r.total));
    const stepRaw = pick(cnt, 2012, 2014) / pick(cnt, 2009, 2011);
    const stepH = pick(h, 2012, 2014) / pick(h, 2009, 2011);
    const mk = { silent: true, symbol: "none", lineStyle: { color: "#111", type: "dashed" }, label: { formatter: "2012: VIIRS starts", position: "end", distance: 4 }, data: [{ xAxis: 2012.06 }] };
    const base = { grid: { left: 60, right: 16, top: 66, bottom: 30 }, xAxis: { type: "value", min: area.start_year, max: area.last_year + 1, axisLabel: { formatter: (v: number) => String(v) } }, yAxis: { type: "value" }, tooltip: { trigger: "axis", valueFormatter: (v: number) => String(v) } };
    const rawOpt = { ...base, title: { text: "Raw counts, stitched (MODIS to 2011, VIIRS from 2012)", textStyle: { fontSize: 13, width: 300, overflow: "break" } },
      series: [{ type: "line", showSymbol: false, data: pts(area.cnt), lineStyle: { color: "#c0392b", width: 1.4 }, markLine: mk }] };
    const hOpt = { ...base, title: { text: "Harmonized fire-days (VIIRS-equivalent, 90% band to 2011, ratio uncertainty only)", textStyle: { fontSize: 13, width: 300, overflow: "break" } },
      series: [
        { type: "line", showSymbol: false, data: pts(area.hi), lineStyle: { opacity: 0 }, areaStyle: { color: "#2e86c1", opacity: 0.2 }, z: 1, tooltip: { show: false } },
        { type: "line", showSymbol: false, data: pts(area.lo), lineStyle: { opacity: 0 }, areaStyle: { color: "#fff", opacity: 1 }, z: 2, tooltip: { show: false } },
        { type: "line", showSymbol: false, data: pts(area.h), lineStyle: { color: "#1f618d", width: 1.4 }, z: 3, markLine: mk }],
    };
    return { rawOpt: rawOpt as any, hOpt: hOpt as any, stepRaw, stepH };
  }, [area]);

  return (
    <section>
      <h1>{t("heroTitle")}</h1>
      <p className="lead">{t("heroLead")}</p>
      <label className="row">{t("pick")}: <select value={areaId} onChange={(e) => onPick(e.target.value)}>
        {index.filter((a) => a.level !== "kabupaten").map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select></label>
      {!view ? <p>{t("loading")}</p> : (
        <>
          <div className="stepRow">
            <div className="step bad"><span className="big">×{nf(view.stepRaw, 1)}</span><span>{t("heroRaw")}</span></div>
            <div className="step good"><span className="big">×{nf(view.stepH, 1)}</span><span>{t("heroH")}</span></div>
          </div>
          <Chart option={view.rawOpt} height={260} label="Raw stitched hotspot counts" />
          <Chart option={view.hOpt} height={260} label="Harmonized fire-days" />
          <p className="note">{t("heroNote2")}</p>
        </>
      )}
    </section>
  );
}
