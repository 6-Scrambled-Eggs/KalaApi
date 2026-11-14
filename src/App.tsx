import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import AreaPicker from "./AreaPicker";
import type { Mode } from "./Calendar";
import HomeHero from "./HomeHero";
import OnVisible from "./OnVisible";
import { WatchList, WeekCard } from "./HomeWatch";
import { AreaIndex, dateLocale, loadIndex } from "./data";
import ProvList from "./ProvList";
import { Lang, LangCtx, makeT } from "./i18n";

const AreaPage = lazy(() => import("./AreaPage"));
const Brief = lazy(() => import("./Brief"));
const Card = lazy(() => import("./Card"));
const Compare = lazy(() => import("./Compare"));
const EnsoView = lazy(() => import("./EnsoView"));
const Hero = lazy(() => import("./Hero"));
const LiveStrip = lazy(() => import("./LiveStrip"));
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
        <div className="topin">
          <a className="brand" href="#/">
            <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#993404" /><path d="M16 5c1 5 7 8 7 15a7 7 0 0 1-14 0c0-3 2-5 3-7 1 2 2 3 3 3-1-4-1-7 1-11z" fill="#fec44f" /></svg>
            <span className="bt"><b>KalaApi</b><span>{t("tagline")}</span></span>
          </a>
          <nav className="mainnav" aria-label={t("mainNav")}>
            <a href="#/" className={route === "home" ? "on" : ""} aria-current={route === "home" ? "page" : undefined}>{t("home")}</a>
            <a href="#/surge" className={route === "surge" ? "on" : ""} aria-current={route === "surge" ? "page" : undefined}><span className="lg">{t("surge")}</span><span className="sm">{t("surgeShort")}</span></a>
            <a href="#/enso" className={route === "enso" ? "on" : ""} aria-current={route === "enso" ? "page" : undefined}><span className="lg">{t("enso")}</span><span className="sm">{t("ensoShort")}</span></a>
            <a href="#/method" className={route === "method" ? "on" : ""} aria-current={route === "method" ? "page" : undefined}><span className="lg">{t("method")}</span><span className="sm">{t("methodShort")}</span></a>
          </nav>
          <AreaPicker index={index ?? []} onPick={(a) => go(`/area/${a}`)} />
          <div className="lang" role="group" aria-label={t("language")}>
            <button aria-pressed={lang === "en"} onClick={() => setLang("en")} aria-label="EN: English">EN</button>
            <button aria-pressed={lang === "id"} onClick={() => setLang("id")} aria-label="ID: Bahasa Indonesia">ID</button>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Suspense fallback={<p>{t("loading")}</p>}>
        {!index ? (["area","surge","story","card","brief","compare","enso","method"].includes(route) ? <p>{t("loading")}</p> : <section><div className="intro"><h1>{t("tagline")}</h1><p className="lead">{t("lead")}</p></div><HomeHero index={[]} /></section>) : route === "area" ? (
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
            <div className="intro"><h1>{t("tagline")}</h1><p className="lead">{t("lead")}</p></div>
            <HomeHero index={index} />
            <p className="cta-row"><a className="cta primary" href="#/area/indonesia">{t("ctaNational")}</a> <a className="cta" href="#/surge">{t("ctaStep")}</a> <a className="cta" href="#/enso">{t("ctaEnso")}</a> <a className="cta" href="#/compare/papua-selatan/kalimantan-barat">{t("ctaCompare")}</a></p>
            <div className="homegrid">
              <div className="hg-main">
                <OnVisible minHeight={540}><Suspense fallback={<div className="mapBox"><div className="map" /></div>}><MapView index={index} onSelect={(a) => go(`/area/${a}`)} /></Suspense></OnVisible>
                <Suspense fallback={null}><LiveStrip /></Suspense>
              </div>
              <aside className="hg-side">
                <WatchList index={index} />
                <WeekCard index={index} />
              </aside>
            </div>
            <ProvList index={index} />
          </section>
        )}
        </Suspense>
      </main>
      <footer className="noprint"><div className="footin">{lang === "id" ? "NASA Space Apps 2026 · Data: NASA FIRMS (MODIS, VIIRS), geoBoundaries · Dibuat dengan bantuan AI (Claude), diungkapkan di halaman proyek." : "NASA Space Apps 2026 · Data: NASA FIRMS (MODIS, VIIRS), geoBoundaries · Built with AI assistance (Claude), disclosed on the project page."}</div></footer>
    </LangCtx.Provider>
  );
}

function localStorageGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
