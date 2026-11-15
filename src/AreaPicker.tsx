import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AreaIndex } from "./data";
import { useT } from "./i18n";

export default function AreaPicker({ index, onPick }: { index: AreaIndex[]; onPick: (id: string) => void }) {
  const { t } = useT();
  const [v, setV] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const names = useMemo(() => {
    const byId = new Map(index.map((a) => [a.id, a]));
    return index.map((a) => ({ id: a.id, label: a.level === "kabupaten" ? `${a.name} (${byId.get(a.parent || "")?.name ?? ""})` : a.name }));
  }, [index]);
  const matches = useMemo(() => {
    const query = v.trim().toLocaleLowerCase();
    return query ? names.filter((n) => n.label.toLocaleLowerCase().includes(query)) : names;
  }, [names, v]);

  useEffect(() => {
    const list = listRef.current;
    const option = list?.children[active] as HTMLElement | undefined;
    if (!list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
  }, [active]);

  function pick(id: string) {
    setV("");
    setActive(-1);
    setOpen(false);
    inputRef.current?.blur();
    onPick(id);
  }
  return (
    <div className="picker" onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) { setV(""); setOpen(false); setActive(-1); }
    }}>
      <input ref={inputRef} value={v} placeholder={t("search")} aria-label={t("search")}
        role="combobox" aria-autocomplete="list" aria-expanded={open}
        aria-controls={open && matches.length ? listId : undefined}
        aria-activedescendant={open && active >= 0 && matches[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => { setV(e.target.value); setActive(-1); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            if (matches.length) setActive((current) => e.key === "ArrowDown"
              ? Math.min(current + 1, matches.length - 1)
              : current < 0 ? matches.length - 1 : Math.max(current - 1, 0));
          } else if (e.key === "Enter" && open && matches[active]) {
            e.preventDefault();
            pick(matches[active].id);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
            setActive(-1);
          }
        }} />
      {open && (matches.length ? (
        <ul className="picker-results" id={listId} role="listbox" ref={listRef}>
          {matches.map((n, i) => (
            <li key={n.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(n.id)} title={n.label}>
              {n.label}
            </li>
          ))}
        </ul>
      ) : <div className="picker-empty" role="status">{names.length ? t("searchEmpty") : t("loading")}</div>)}
    </div>
  );
}
