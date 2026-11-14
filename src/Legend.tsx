/** Gradient legend with a title and low/high labels, used under the maps. */
export default function Legend({ title, stops, low, high, extra }: { title: string; stops: [string, number][]; low: string; high: string; extra?: string }) {
  const bg = `linear-gradient(90deg, ${stops.map(([c, p]) => `${c} ${p}%`).join(", ")})`;
  return (
    <div className="legend">
      <div className="lt">{title}</div>
      <div className="lrow"><div className="lbar" style={{ background: bg }} role="img" aria-label={`${low} to ${high}`} />{extra && <span className="lnone"><i />{extra}</span>}</div>
      <div className="llab"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}
