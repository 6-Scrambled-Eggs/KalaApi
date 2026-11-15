import { useEffect, useState } from "react";
import { AreaIndex, annualTotals, loadArea, nf } from "./data";
import { useT } from "./i18n";

const mean = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.reduce((a, b) => a + b, 0) / v.length; };

/** Above-the-fold proof: the 2012 sensor jump before and after harmonization, plus this year vs normal. */
export default function HomeHero(_: { index: AreaIndex[] }) {
  const { t } = useT();
  const [step, setStep] = useState<{ raw: number; h: number } | null>(null);
  useEffect(() => {
    loadArea("indonesia").then((a) => {
      const cnt = annualTotals(a.cnt, a.start_year), h = annualTotals(a.h, a.start_year);
      const pick = (s: { year: number; total: number | null }[], y0: number, y1: number) => mean(s.filter((r) => r.year >= y0 && r.year <= y1).map((r) => r.total));
      setStep({ raw: pick(cnt, 2012, 2014) / pick(cnt, 2009, 2011), h: pick(h, 2012, 2014) / pick(h, 2009, 2011) });
    }).catch(() => setStep(null));
  }, []);
  return (
    <div className="homehero">
      <div className="hh bad"><span className="big">{step ? `×${nf(step.raw, 1)}` : "…"}</span><span>{t("heroRaw")}</span></div>
      <div className="hh good"><span className="big">{step ? `×${nf(step.h, 1)}` : "…"}</span><span>{t("heroH")}</span></div>
      <p className="note hhnote">{t("heroNote")}</p>
    </div>
  );
}
