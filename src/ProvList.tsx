import { AreaIndex } from "./data";
import { useT } from "./i18n";
import { hlProps, useHighlight } from "./hl";

/** Keyboard- and screen-reader-friendly list of all provinces (the map canvas cannot be focused). */
export default function ProvList({ index }: { index: AreaIndex[] }) {
  const { lang, t } = useT();
  const L = lang === "id";
  const hl = useHighlight();
  const rows = index.filter((a) => a.level === "province").sort((a, b) => a.name.localeCompare(b.name));
  return (
    <details className="provlist">
      <summary>{L ? "Daftar semua provinsi (akses papan ketik)" : "List of all provinces (keyboard access)"}</summary>
      <ul>{rows.map((a) => <li key={a.id} className={hl === a.id ? "hl" : undefined} {...hlProps(a.id)}><a href={`#/area/${a.id}`}>{a.name}</a> <span className="s">{a.ytd_ratio != null ? `×${a.ytd_ratio} · ` : ""}{t("pctile")} {Math.round(a.ytd_pct)}</span></li>)}</ul>
    </details>
  );
}
