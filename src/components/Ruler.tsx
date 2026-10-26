interface RulerProps {
  start: number;
  goal: number;
  current: number;
}

/** A kg ruler from starting weight to goal: one tick per whole kilogram, filled as weight is gained. */
export function Ruler({ start, goal, current }: RulerProps) {
  const span = Math.max(goal - start, 0.1);
  const pct = Math.max(0, Math.min(1, (current - start) / span));
  const ticks: number[] = [];
  for (let v = Math.ceil(start); v <= goal; v++) ticks.push(v);
  return (
    <div className="ruler" role="img" aria-label={`${current.toFixed(1)} kg of a ${start}–${goal} kg journey, ${Math.round(pct * 100)} percent`}>
      <div className="ruler-bar">
        <span className="ruler-fill" style={{ width: `${pct * 100}%` }} />
        {ticks.map((t) => {
          const at = ((t - start) / span) * 100;
          return <span key={t} className="ruler-tick" data-passed={t <= current} style={{ left: `${at}%` }} />;
        })}
      </div>
      <div className="ruler-ends num">
        <span>{start} kg</span>
        <span>{goal} kg</span>
      </div>
    </div>
  );
}
