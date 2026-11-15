import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import AreaPicker from "./AreaPicker";
import type { Mode } from "./Calendar";
import HomeHero from "./HomeHero";
import OnVisible from "./OnVisible";
import { AreaIndex, dateLocale, loadIndex } from "./data";
import ProvList from "./ProvList";
import { Lang, LangCtx, makeT } from "./i18n";

const AreaPage = lazy(() => import("./AreaPage"));
const Brief = lazy(() => import("./Brief"));
const Card = lazy(() => import("./Card"));
const CustomArea = lazy(() => import("./CustomArea"));
const Compare = lazy(() => import("./Compare"));
const EnsoView = lazy(() => import("./EnsoView"));
const Hero = lazy(() => import("./Hero"));
const MapView = lazy(() => import("./MapView"));
const Method = lazy(() => import("./Method"));
const Story = lazy(() => import("./Story"));

function useHash() {
  const [h, setH] = useState(window.location.hash.slice(1) || "/");
  useEffect(() => { const f = () => setH(window.location.hash.slice(1) || "/"); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const [path, qs] = h.split("?");
  return { path: path.split("/").filter(Boolean), params: new URLSearchParams(qs || "") };
}

export default function App() {
  const [index, setIndex] = useState<AreaIndex[] | null>(null);
  const [lang, setLang] = useState<Lang>(() => (localStorageGet("lang") as Lang) || "en");
  const [menuOpen, setMenuOpen] = useState(false);
  const { path, params } = useHash();
  const t = useMemo(() => makeT(lang), [lang]);
  useEffect(() => { loadIndex().then(setIndex); }, []);
  dateLocale.v = lang === "id" ? "id-ID" : "en-GB";
  useEffect(() => { document.documentElement.lang = lang; localStorageSet("lang", lang); }, [lang]);

  const go = useCallback((p: string, q?: URLSearchParams) => { window.location.hash = p + (q && q.toString() ? `?${q}` : ""); }, []);
  const route = path[0] || "home";
  const id = path[1] || "indonesia";
  const mode = (params.get("m") as Mode) || "h";
  const year = params.get("y") ? Number(params.get("y")) : null;
  const setQ = (k: string, v: string) => { const q = new URLSearchParams(params); q.set(k, v); go(`/${path.join("/")}`, q); };

  return (
    <LangCtx.Provider value={{ lang, t }}>
      <a className="skip" href="#main-content" onClick={(e) => { e.preventDefault(); document.getElementById("main-content")?.focus(); }}>{lang === "id" ? "Lewati ke isi" : "Skip to content"}</a>
      <header className="top noprint">
        <a className="brand" href="#/"><span className="brand-mark" aria-hidden="true">K</span><b>KalaApi</b></a>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-nav" onClick={() => setMenuOpen(!menuOpen)}>{t("menu")}</button>
        <nav id="site-nav" className={menuOpen ? "open" : ""} onClick={() => setMenuOpen(false)}>
          <a href="#/" className={route === "home" ? "on" : ""}>{t("home")}</a>
          <a href="#/custom" className={route === "custom" ? "on" : ""}>{lang === "id" ? "Area sendiri" : "Your area"}</a>
          <a href="#/compare/papua-selatan/kalimantan-barat" className={route === "compare" ? "on" : ""}>{t("compare")}</a>
          <a href="#/method" className={route === "method" ? "on" : ""}>{t("method")}</a>
          <button onClick={() => setLang(lang === "en" ? "id" : "en")} aria-label={`${lang === "en" ? "ID" : "EN"}: ${lang === "en" ? "Switch to Indonesian" : "Switch to English"}`}>{lang === "en" ? "ID" : "EN"}</button>
        </nav>
        <AreaPicker key={path.join("/")} index={index ?? []} onPick={(a) => go(`/area/${a}`)} />
      </header>
      <main id="main-content" className={route === "home" ? "home-main" : undefined} tabIndex={-1}>
        <Suspense fallback={<p>{t("loading")}</p>}>
        {!index ? (["area","surge","story","card","brief","compare","enso","method","custom"].includes(route) ? <p>{t("loading")}</p> : <section><h1>{t("tagline")}</h1><p className="lead">{t("lead")}</p><div className="homehero" aria-busy="true"><div className="hh" /><div className="hh" /><p className="note hhnote">{t("heroNote")}</p></div></section>) : route === "area" ? (
          <AreaPage id={id} index={index} year={year} mode={mode} setYear={(y) => setQ("y", String(y))} setMode={(m) => setQ("m", m)} go={go} />
        ) : route === "surge" ? <Hero areaId={path[1] || "indonesia"} index={index} onPick={(a) => go(`/surge/${a}`)} />
        : route === "story" ? <Story id={id} />
        : route === "card" ? <Card id={id} />
        : route === "brief" ? <Brief id={id} />
        : route === "compare" ? <Compare idA={path[1] || "papua-selatan"} idB={path[2] || "kalimantan-barat"} index={index} go={go} />
        : route === "custom" ? <CustomArea />
        : route === "enso" ? <EnsoView index={index} onSelect={(a) => go(`/area/${a}`)} />
        : route === "method" ? <Method index={index} />
        : (
          <div className="home-page">
            <section className="home-opening">
              <div className="home-intro">
                <h1>{t("tagline")}</h1>
                <p className="lead">{t("lead")}</p>
                <div className="home-actions"><a className="cta" href="#/area/indonesia">{t("ctaNational")}</a><a className="home-text-link" href="#/custom">{t("homeCustom")}</a></div>
                <p className="home-source">{t("homeSource")}</p>
              </div>
              <div className="home-map">
                <div className="home-map-head"><h2>{t("homeMapTitle")}</h2></div>
                <OnVisible minHeight={420}><Suspense fallback={<div className="mapBox"><div className="map" /></div>}><MapView index={index} onSelect={(a) => go(`/area/${a}`)} /></Suspense></OnVisible>
                <ProvList index={index} />
              </div>
            </section>
            <section className="home-story">
              <div><h2>{t("homeStoryTitle")}</h2><p>{t("homeStoryBody")}</p><a href="#/method">{t("method")} →</a></div>
              <div className="home-proof"><h3>{t("homeProofTitle")}</h3><HomeHero index={index} /><a href="#/surge/indonesia">{t("ctaStep")} →</a></div>
            </section>
            <section className="home-explore">
              <div className="home-explore-head"><h2>{t("homeExploreTitle")}</h2></div>
              <div className="home-links">
                <a href="#/compare/papua-selatan/kalimantan-barat"><span>{t("homeCompareBody")}</span><strong>{t("ctaCompare")} <span aria-hidden="true">↗</span></strong></a>
                <a href="#/custom"><span>{t("homeCustomBody")}</span><strong>{t("homeCustom")} <span aria-hidden="true">↗</span></strong></a>
                <a href="#/enso"><span>{t("homeEnsoBody")}</span><strong>{t("ctaEnso")} <span aria-hidden="true">↗</span></strong></a>
              </div>
            </section>
          </div>
        )}
        </Suspense>
      </main>
      <footer className="noprint">{lang === "id" ? "NASA Space Apps 2026 · Data: NASA FIRMS (MODIS, VIIRS), geoBoundaries · Dibuat dengan bantuan AI (Claude), diungkapkan di halaman proyek." : "NASA Space Apps 2026 · Data: NASA FIRMS (MODIS, VIIRS), geoBoundaries · Built with AI assistance (Claude), disclosed on the project page."}</footer>
    </LangCtx.Provider>
  );
}

function localStorageGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
