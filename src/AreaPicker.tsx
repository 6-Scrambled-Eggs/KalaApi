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
      <input list="areas" value={v} placeholder={t("search")} aria-label={t("search")}
        onChange={(e) => { setV(e.target.value); const m = names.find((n) => n.label === e.target.value); if (m) { onPick(m.id); setV(""); } }} />
      <datalist id="areas">{names.map((n) => <option key={n.id} value={n.label} />)}</datalist>
    </div>
  );
}
