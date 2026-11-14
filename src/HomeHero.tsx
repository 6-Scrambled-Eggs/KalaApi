import { useEffect, useState } from "react";
import { AreaIndex, annualTotals, loadArea, loadMeta } from "./data";
import { fmt, useT } from "./i18n";

const mean = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.reduce((a, b) => a + b, 0) / v.length; };

/** Above-the-fold proof: the 2012 sensor jump before and after harmonization, plus this year vs normal. */
export default function HomeHero({ index }: { index: AreaIndex[] }) {
  const { t } = useT();
  const [step, setStep] = useState<{ raw: number; h: number } | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  useEffect(() => { loadMeta().then((m) => setWeek(m.last_complete_week)).catch(() => undefined); }, []);
  useEffect(() => {
    loadArea("indonesia").then((a) => {
      const cnt = annualTotals(a.cnt, a.start_year), h = annualTotals(a.h, a.start_year);
      const pick = (s: { year: number; total: number | null }[], y0: number, y1: number) => mean(s.filter((r) => r.year >= y0 && r.year <= y1).map((r) => r.total));
      setStep({ raw: pick(cnt, 2012, 2014) / pick(cnt, 2009, 2011), h: pick(h, 2012, 2014) / pick(h, 2009, 2011) });
    }).catch(() => setStep(null));
  }, []);
  const nat = index.find((a) => a.id === "indonesia");
  return (
    <div className="homehero">
      <div className="hh bad"><span className="big">{step ? `×${step.raw.toFixed(1)}` : "…"}</span><span>{t("heroRaw")}</span></div>
      <div className="hh good"><span className="big">{step ? `×${step.h.toFixed(1)}` : "…"}</span><span>{t("heroH")}</span></div>
      <div className="hh"><span className="big">{nat?.ytd_ratio != null ? `×${nat.ytd_ratio}` : "…"}</span><span>{fmt(t("heroNow"), week ?? "")}</span>
        {nat?.ytd_ratio_recent != null && <span className="sm">×{nat.ytd_ratio_recent} {t("heroRecent")}</span>}</div>
      <p className="note hhnote">{t("heroNote")}</p>
    </div>
  );
}
