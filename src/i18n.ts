import { createContext, useContext } from "react";

export type Lang = "en" | "id";
const dict = {
  en: {
    tagline: "One fire record for Indonesia, from MODIS to VIIRS.",
    home: "Map", surge: "Fake surge", method: "Method and data", pick: "Pick an area",
    search: "Search province or kabupaten", harmonized: "Harmonized", rawModis: "Raw MODIS", rawViirs: "Raw VIIRS",
    ytd: "This year vs normal", typicalPeak: "Typical peak weeks", onset: "Onset vs typical",
    calendar: "Burning-activity calendar", profile: "Seasonal profile", anomalies: "Flagged weeks",
    story: "Story mode", card: "Readiness card", print: "Print", extreme: "extreme", elevated: "elevated",
    lowData: "Low data: fewer than 50 fire-days a year on average. Read with care.",
    estimate: "Estimated from MODIS (back-cast)", observed: "Observed VIIRS", loading: "Loading…",
    heroTitle: "In 2012, Indonesia's fire record jumped. Did the fires?",
    asOf: "Data as of", mapHint: "Shaded by this year's fire-days compared with the same weeks in 2001-2025. Click a province.",
    week: "week", year: "Year", fireDays: "fire-days", pctile: "percentile",
  },
  id: {
    tagline: "Satu rekam jejak api untuk Indonesia, dari MODIS ke VIIRS.",
    home: "Peta", surge: "Lonjakan semu", method: "Metode dan data", pick: "Pilih wilayah",
    search: "Cari provinsi atau kabupaten", harmonized: "Harmonisasi", rawModis: "MODIS mentah", rawViirs: "VIIRS mentah",
    ytd: "Tahun ini vs normal", typicalPeak: "Minggu puncak biasanya", onset: "Awal musim vs biasanya",
    calendar: "Kalender aktivitas pembakaran", profile: "Profil musiman", anomalies: "Minggu yang ditandai",
    story: "Mode cerita", card: "Kartu kesiapsiagaan", print: "Cetak", extreme: "ekstrem", elevated: "tinggi",
    lowData: "Data sedikit: rata-rata kurang dari 50 hari-api per tahun. Baca dengan hati-hati.",
    estimate: "Perkiraan dari MODIS (back-cast)", observed: "VIIRS teramati", loading: "Memuat…",
    heroTitle: "Pada 2012, catatan api Indonesia melonjak. Apakah apinya juga?",
    asOf: "Data per", mapHint: "Warna menunjukkan hari-api tahun ini dibanding minggu yang sama 2001-2025. Klik provinsi.",
    week: "minggu", year: "Tahun", fireDays: "hari-api", pctile: "persentil",
  },
};
export type Key = keyof typeof dict.en;
export const LangCtx = createContext<{ lang: Lang; t: (k: Key) => string }>({ lang: "en", t: (k) => dict.en[k] });
export const useT = () => useContext(LangCtx);
export const makeT = (lang: Lang) => (k: Key) => dict[lang][k];
