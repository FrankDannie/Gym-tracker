interface MeterProps {
  label: string;
  value: number;
  unit: string;
  /** Target as a single value, or a range shown as a shaded zone. */
  target: number | [number, number];
  max?: number;
}

/** Progress toward a daily target. A range target is drawn as a band, so "in range" reads at a glance. */
export function Meter({ label, value, unit, target, max }: MeterProps) {
  const [lo, hi] = Array.isArray(target) ? target : [target, target];
  const top = max ?? hi * 1.25;
  const pct = (n: number) => `${Math.min(100, (n / top) * 100)}%`;
  const state = value >= lo ? (value <= hi * 1.08 ? "in" : "over") : "under";
  const range = Array.isArray(target) ? `${lo}–${hi}` : `about ${lo.toLocaleString()}`;
  return (
    <div className="meter" data-state={state}>
      <div className="meter-row">
        <span className="meter-label">{label}</span>
        <span className="meter-value num">
          <strong>{Math.round(value).toLocaleString()}</strong> of {range} {unit}
        </span>
      </div>
      <div className="meter-track" role="img" aria-label={`${label}: ${Math.round(value)} ${unit}, target ${range}`}>
        {Array.isArray(target) ? (
          <span className="meter-zone" style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
        ) : (
          <span className="meter-mark" style={{ left: pct(lo) }} />
        )}
        <span className="meter-fill" style={{ width: pct(value) }} />
      </div>
    </div>
  );
}
