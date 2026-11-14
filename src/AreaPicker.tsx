import { useMemo, useState } from "react";
import { AreaIndex } from "./data";
import { useT } from "./i18n";

export default function AreaPicker({ index, onPick }: { index: AreaIndex[]; onPick: (id: string) => void }) {
  const { t } = useT();
  const [v, setV] = useState("");
  const names = useMemo(() => {
    const byId = new Map(index.map((a) => [a.id, a]));
    return index.map((a) => ({ id: a.id, label: a.level === "kabupaten" ? `${a.name} (${byId.get(a.parent || "")?.name ?? ""})` : a.name }));
  }, [index]);
  return (
    <div className="picker">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="7" cy="7" r="4.75" /><path d="M10.5 10.5L14 14" strokeLinecap="round" /></svg>
      <input type="search" list="areas" value={v} placeholder={t("search")} aria-label={t("search")}
        onChange={(e) => { setV(e.target.value); const m = names.find((n) => n.label === e.target.value); if (m) { onPick(m.id); setV(""); } }} />
      <datalist id="areas">{names.map((n) => <option key={n.id} value={n.label} />)}</datalist>
    </div>
  );
}
