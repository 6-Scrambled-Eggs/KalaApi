import { useEffect, useMemo, useState } from "react";
import { Area, AreaIndex, Locator, loadLocator } from "./data";
import { fmt, useT } from "./i18n";

/** The margin of an area page: level, locator inset, source, unit, tools. */
export default function SheetMargin({ area, index, tools }: { area: Area; index: AreaIndex[]; tools: React.ReactNode }) {
  const { lang, t } = useT();
  const [loc, setLoc] = useState<Locator | null>(null);
  useEffect(() => { loadLocator().then(setLoc).catch(() => setLoc(null)); }, []);

  const provinces = useMemo(() => index.filter((a) => a.level === "province").sort((a, b) => a.name.localeCompare(b.name)), [index]);
  const provId = area.level === "province" ? area.id : area.level === "kabupaten" ? area.parent : null;
  const sheetNo = useMemo(() => {
    if (area.level === "nation") return "00";
    const pi = provinces.findIndex((p) => p.id === provId) + 1;
    const pp = String(pi).padStart(2, "0");
    if (area.level === "province") return pp;
    const kabs = index.filter((a) => a.level === "kabupaten" && a.parent === provId).sort((a, b) => a.name.localeCompare(b.name));
    return `${pp}.${String(kabs.findIndex((k) => k.id === area.id) + 1).padStart(2, "0")}`;
  }, [area, index, provinces, provId]);
  const level = area.level === "nation" ? t("sheetNation") : area.level === "province" ? t("sheetProv") : t("sheetKab");
  const near = provId && loc?.provinces[provId] ? loc.provinces[provId].near.filter((id) => loc.provinces[id]) : [];
  const parent = area.level === "kabupaten" ? index.find((a) => a.id === area.parent) : null;

  return (
    <aside className="margin" aria-label={area.name}>
      <div className="mk">{level}</div>
      {loc && <LocatorInset loc={loc} hi={provId} near={near} label={fmt(t("locatorLabel"), area.name)} ns={lang === "id" ? ["LU", "LS"] : ["N", "S"]} />}
      {parent && <p className="mrow"><a href={`#/area/${parent.id}`}>{parent.name}</a></p>}
      {area.level === "nation" && <p className="mrow">{t("allIndonesia")}</p>}
      <h4>{t("source")}</h4>
      <p className="mrow">{t("sourceLine")}</p>
      <h4>{t("unit")}</h4>
      <p className="mrow">{t("unitLine")}</p>
      <h4>{t("tools")}</h4>
      {tools}
    </aside>
  );
}

/** Plain links to the neighbouring provinces (shown under the calendar). */
export function Neighbours({ area }: { area: Area }) {
  const { t } = useT();
  const [loc, setLoc] = useState<Locator | null>(null);
  useEffect(() => { loadLocator().then(setLoc).catch(() => setLoc(null)); }, []);
  const provId = area.level === "province" ? area.id : area.level === "kabupaten" ? area.parent : null;
  const near = provId && loc?.provinces[provId] ? loc.provinces[provId].near.filter((id) => loc.provinces[id]) : [];
  if (!near.length) return null;
  return <p className="note">{t("neighbours")}: {near.map((id, i) => <span key={id}>{i ? " · " : ""}<a href={`#/area/${id}`}>{loc!.provinces[id].name}</a></span>)}</p>;
}

/** Index map of Indonesia with the current sheet filled and the adjoining sheets as links. */
function LocatorInset({ loc, hi, near, label, ns }: { loc: Locator; hi: string | null; near: string[]; label: string; ns: [string, string] }) {
  const [w0, s0, e0, n0] = loc.frame;
  const lon = (x: number) => ((x - w0) / (e0 - w0)) * 100;
  const lonTicks = [100, 110, 120, 130, 140];
  return (
    <figure className="locator">
      <svg viewBox={`0 0 ${loc.width} ${loc.height}`} role="img" aria-label={label}>
        <rect width={loc.width} height={loc.height} className="sea" />
        {Object.entries(loc.provinces).map(([id, p]) => {
          const cls = id === hi ? "me" : near.includes(id) ? "nb" : "land";
          const path = <path key={id} d={p.d} className={cls}><title>{p.name}</title></path>;
          return cls === "nb" ? <a key={id} href={`#/area/${id}`}>{path}</a> : path;
        })}
      </svg>
      <div className="gx" aria-hidden="true">{lonTicks.map((x) => <span key={x} style={{ left: `${lon(x)}%` }}>{x}°</span>)}</div>
      <div className="gy" aria-hidden="true"><span>{n0}° {ns[0]}</span><span>{Math.abs(s0)}° {ns[1]}</span></div>
    </figure>
  );
}
