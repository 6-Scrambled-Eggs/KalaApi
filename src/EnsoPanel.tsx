import { useMemo } from "react";
import Chart from "./Chart";
import { Area, Enso, Oni, WPY, matrix } from "./data";
import { useT } from "./i18n";

export const fmtP = (p: number) => (p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`);
const COLORS = { el: "#c0392b", la: "#2e86c1", neu: "#9aa5ad" };

/** El Nino link per area: yearly fire-days coloured by ONI class, plus a plain verdict with n and p. */
export default function EnsoPanel({ area, enso, oni, compact }: { area: Area; enso: Enso | null; oni: Oni | null; compact?: boolean }) {
  const { lang, t } = useT();
  const id = lang === "id";
  const e = enso?.areas[area.id];
  const option = useMemo(() => {
    if (!enso || !oni) return null;
    const M = matrix(area.h);
    const years: number[] = [], vals: any[] = [];
    for (let y = 2001; y <= 2025; y++) {
      const row = M[y - area.start_year] || [];
      if (row.length !== WPY || row.some((v) => v == null)) continue;
      const o = oni.jas[String(y)];
      const cls = o >= 0.5 ? "el" : o <= -0.5 ? "la" : "neu";
      years.push(y);
      vals.push({ value: Math.round(row.reduce<number>((a, v) => a + (v ?? 0), 0)), itemStyle: { color: COLORS[cls] }, oni: o });
    }
    return {
      grid: { left: 64, right: 12, top: 28, bottom: 30 },
      tooltip: { trigger: "item", formatter: (p: any) => `${years[p.dataIndex]}: ${p.value.toLocaleString()} ${t("fireDays")}<br/>ONI Jul–Sep ${p.data.oni > 0 ? "+" : ""}${p.data.oni}` },
      xAxis: { type: "category", data: years.map(String), axisLabel: { interval: 1 } },
      yAxis: { type: "value", name: t("fireDays"), nameGap: 8 },
      series: [{ type: "bar", data: vals, barCategoryGap: "25%" }],
    } as any;
  }, [area, enso, oni, t]);
  if (!enso || !oni || !e || !option) return null;
  const nEl = enso.years.el.length, nLa = enso.years.la.length, nNeu = enso.years.neu.length;
  const o26 = oni.jas["2026"];
  const verdict = {
    clear: id ? "Aktivitas api di sini jelas mengikuti El Niño." : "Fire activity here clearly follows El Niño.",
    weak: id ? "Ada kaitan lemah dengan El Niño di sini." : "There is a weak link to El Niño here.",
    none: id ? "Tidak ada kaitan jelas dengan El Niño di sini. Jangan menjadikan El Niño sebagai alasan tahun yang buruk di wilayah ini." : "No clear link to El Niño here. Do not use El Niño as the reason for a bad year in this area.",
    reverse: id ? "Kaitannya terbalik: tahun El Niño cenderung lebih sedikit api." : "The link runs the other way: El Niño years tend to have fewer fires.",
  }[e.label];
  return (
    <div>
      <h2>{t("ensoTitle")}</h2>
      <p><b>{verdict}</b> ρ = {e.rho}, {fmtP(e.p)}.{e.ratio_el_neu ? (id ? ` Tahun El Niño: tipikalnya ×${e.ratio_el_neu} hari-api tahun netral.` : ` In El Niño years the typical year had ×${e.ratio_el_neu} the fire-days of a neutral year.`) : ""}</p>
      <Chart option={option} height={compact ? 150 : 200} label={`${t("ensoTitle")} ${area.name}`} />
      <p className="note">
        <span style={{ color: COLORS.el }}>■</span> El Niño ({nEl}) <span style={{ color: COLORS.neu }}>■</span> {id ? "netral" : "neutral"} ({nNeu}) <span style={{ color: COLORS.la }}>■</span> La Niña ({nLa}) · ONI Jul–Sep. {o26 != null ? (id ? `2026: ONI ${o26 > 0 ? "+" : ""}${o26}${o26 >= 0.5 ? " (El Niño)" : ""}. ` : `2026: ONI ${o26 > 0 ? "+" : ""}${o26}${o26 >= 0.5 ? " (El Niño)" : ""}. `) : ""}
        {id
          ? `Eksploratif: korelasi peringkat atas 25 tahun (2001–2025), hanya ${nEl} tahun El Niño. Bukan prakiraan dan bukan uji sebab-akibat.`
          : `Exploratory: rank correlation over 25 years (2001–2025), only ${nEl} El Niño years. Not a forecast and not a test of cause.`}
      </p>
    </div>
  );
}
