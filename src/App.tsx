import { useCallback, useEffect, useMemo, useState } from "react";
import AreaPage from "./AreaPage";
import AreaPicker from "./AreaPicker";
import Brief from "./Brief";
import Card from "./Card";
import Compare from "./Compare";
import EnsoView from "./EnsoView";
import { Mode } from "./Calendar";
import Hero from "./Hero";
import LiveStrip from "./LiveStrip";
import MapView from "./MapView";
import Method from "./Method";
import Story from "./Story";
import { AreaIndex, loadIndex } from "./data";
import { Lang, LangCtx, makeT } from "./i18n";

function useHash() {
  const [h, setH] = useState(window.location.hash.slice(1) || "/");
  useEffect(() => { const f = () => setH(window.location.hash.slice(1) || "/"); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const [path, qs] = h.split("?");
  return { path: path.split("/").filter(Boolean), params: new URLSearchParams(qs || "") };
}

export default function App() {
  const [index, setIndex] = useState<AreaIndex[] | null>(null);
  const [lang, setLang] = useState<Lang>(() => (localStorageGet("lang") as Lang) || "en");
  const { path, params } = useHash();
  const t = useMemo(() => makeT(lang), [lang]);
  useEffect(() => { loadIndex().then(setIndex); }, []);
  useEffect(() => { document.documentElement.lang = lang; localStorageSet("lang", lang); }, [lang]);

  const go = useCallback((p: string, q?: URLSearchParams) => { window.location.hash = p + (q && q.toString() ? `?${q}` : ""); }, []);
  const route = path[0] || "home";
  const id = path[1] || "indonesia";
  const mode = (params.get("m") as Mode) || "h";
  const year = params.get("y") ? Number(params.get("y")) : null;
  const setQ = (k: string, v: string) => { const q = new URLSearchParams(params); q.set(k, v); go(`/${path.join("/")}`, q); };

  return (
    <LangCtx.Provider value={{ lang, t }}>
      <header className="top noprint">
        <a className="brand" href="#/"><b>KalaApi</b><span>{t("tagline")}</span></a>
        <nav>
          <a href="#/" className={route === "home" ? "on" : ""}>{t("home")}</a>
          <a href="#/surge" className={route === "surge" ? "on" : ""}>{t("surge")}</a>
          <a href="#/enso" className={route === "enso" ? "on" : ""}>{t("enso")}</a>
          <a href="#/method" className={route === "method" ? "on" : ""}>{t("method")}</a>
          <button onClick={() => setLang(lang === "en" ? "id" : "en")} aria-label="Switch language">{lang === "en" ? "ID" : "EN"}</button>
        </nav>
        {index && <AreaPicker index={index} onPick={(a) => go(`/area/${a}`)} />}
      </header>
      <main>
        {!index ? <p>{t("loading")}</p> : route === "area" ? (
          <AreaPage id={id} index={index} year={year} mode={mode} setYear={(y) => setQ("y", String(y))} setMode={(m) => setQ("m", m)} go={go} />
        ) : route === "surge" ? <Hero areaId={path[1] || "indonesia"} index={index} onPick={(a) => go(`/surge/${a}`)} />
        : route === "story" ? <Story id={id} />
        : route === "card" ? <Card id={id} />
        : route === "brief" ? <Brief id={id} />
        : route === "compare" ? <Compare idA={path[1] || "papua-selatan"} idB={path[2] || "kalimantan-barat"} index={index} go={go} />
        : route === "enso" ? <EnsoView index={index} onSelect={(a) => go(`/area/${a}`)} />
        : route === "method" ? <Method index={index} />
        : (
          <section>
            <h1>{t("tagline")}</h1>
            <p className="lead">25 years of MODIS and VIIRS hotspot detections turned into one comparable burning-activity calendar for any area in Indonesia.</p>
            <MapView index={index} onSelect={(a) => go(`/area/${a}`)} />
            <LiveStrip />
            <p><a className="cta" href="#/area/indonesia">Open the national calendar</a> <a className="cta alt" href="#/surge">See the 2012 fake surge</a> <a className="cta alt" href="#/enso">Does El Niño matter here?</a> <a className="cta alt" href="#/compare/papua-selatan/kalimantan-barat">Compare two places</a></p>
          </section>
        )}
      </main>
      <footer className="noprint">NASA Space Apps 2026 · Data: NASA FIRMS (MODIS, VIIRS), geoBoundaries · Built with AI assistance (Claude), disclosed on the project page.</footer>
    </LangCtx.Provider>
  );
}

function localStorageGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
