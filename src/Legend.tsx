/** Gradient legend with a title, optional value ticks and low/high labels, used under the maps. */
export default function Legend({ title, stops, low, high, extra, ticks }: { title: string; stops: [string, number][]; low: string; high: string; extra?: string; ticks?: [number, string][] }) {
  const bg = `linear-gradient(90deg, ${stops.map(([c, p]) => `${c} ${p}%`).join(", ")})`;
  return (
    <div className="legend">
      <div className="lt">{title}</div>
      <div className="lrow">
        <div className="lscale">
          <div className="lbar" style={{ background: bg }} role="img" aria-label={`${low} to ${high}`} />
          {ticks && <div className="lticks" aria-hidden="true">{ticks.map(([p, l]) => <span key={p} style={{ left: `${p}%` }}>{l}</span>)}</div>}
          <div className="llab"><span>{low}</span><span>{high}</span></div>
        </div>
        {extra && <span className="lnone"><i />{extra}</span>}
      </div>
    </div>
  );
}
