import { useMemo, useState } from "react";
import { addDays, diffDays, formatShort, fromISO, type ISODate } from "../lib/dates";
import { useWidth } from "../lib/hooks";

export interface Point {
  date: ISODate;
  value: number;
}

interface Corridor {
  from: ISODate;
  fromValue: number;
  minRate: number; // per week
  maxRate: number; // per week
}

interface ChartProps {
  points: Point[];
  averages?: Point[];
  corridor?: Corridor;
  goal?: number;
  unit: string;
  decimals?: number;
  height?: number;
  label: string;
}

const PAD = { l: 44, r: 14, t: 14, b: 30 };

function niceStep(range: number, target: number) {
  const raw = range / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * pow;
}

export function LineChart({ points, averages, corridor, goal, unit, decimals = 1, height = 260, label }: ChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<Point | null>(null);

  const model = useMemo(() => {
    if (points.length === 0) return null;
    const first = corridor ? corridor.from : points[0].date;
    const lastData = points[points.length - 1].date;
    const span = Math.max(diffDays(lastData, first), 0);
    // Leave room ahead of the data so the planned-pace corridor stays visible.
    const horizon = corridor ? Math.max(42, Math.ceil((span + 14) / 7) * 7) : Math.max(span, 6);
    const end = addDays(first, horizon);
    const x0 = diffDays(points[0].date, first) < 0 ? points[0].date : first;
    const corridorAt = (rate: number, d: ISODate) => (corridor ? corridor.fromValue + (rate * diffDays(d, corridor.from)) / 7 : 0);

    const ys = points.map((p) => p.value).concat((averages ?? []).map((p) => p.value));
    if (corridor) ys.push(corridorAt(corridor.minRate, end), corridorAt(corridor.maxRate, end), corridor.fromValue);
    if (goal !== undefined && goal <= Math.max(...ys) + 1.5) ys.push(goal);
    let lo = Math.min(...ys);
    let hi = Math.max(...ys);
    if (hi - lo < 1.5) {
      const mid = (hi + lo) / 2;
      lo = mid - 0.75;
      hi = mid + 0.75;
    }
    const step = niceStep(hi - lo, 4);
    const yMin = Math.floor((lo - step * 0.25) / step) * step;
    const yMax = Math.ceil((hi + step * 0.25) / step) * step;
    const ticks: number[] = [];
    for (let v = yMin; v <= yMax + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
    return { x0, end, yMin, yMax, ticks, corridorAt };
  }, [points, averages, corridor, goal]);

  if (!model) return <div ref={ref} className="chart-empty">No entries yet.</div>;

  const w = Math.max(width, 280);
  const innerW = w - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;
  const totalDays = Math.max(diffDays(model.end, model.x0), 1);
  const X = (d: ISODate) => PAD.l + (diffDays(d, model.x0) / totalDays) * innerW;
  const Y = (v: number) => PAD.t + (1 - (v - model.yMin) / (model.yMax - model.yMin)) * innerH;

  const line = (pts: Point[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${X(p.date).toFixed(1)} ${Y(p.value).toFixed(1)}`).join("");

  const labelCount = w < 420 ? 3 : 5;
  const xLabels: ISODate[] = Array.from({ length: labelCount }, (_, i) =>
    addDays(model.x0, Math.round((totalDays * i) / (labelCount - 1))),
  );

  let corridorPath = "";
  if (corridor) {
    const a = corridor.from;
    const b = model.end;
    corridorPath = `M${X(a)} ${Y(model.corridorAt(corridor.maxRate, a))}L${X(b)} ${Y(model.corridorAt(corridor.maxRate, b))}L${X(b)} ${Y(
      model.corridorAt(corridor.minRate, b),
    )}L${X(a)} ${Y(model.corridorAt(corridor.minRate, a))}Z`;
  }

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best: Point | null = null;
    let bestD = Infinity;
    for (const p of points) {
      const d = Math.abs(X(p.date) - px);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    setHover(best);
  };

  const tipLeft = hover ? Math.min(Math.max(X(hover.date), 64), w - 64) : 0;

  return (
    <div ref={ref} className="chart">
      <svg
        width={w}
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        role="img"
        aria-label={label}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {model.ticks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={PAD.l} x2={w - PAD.r} y1={Y(t)} y2={Y(t)} />
            <text className="chart-axis" x={PAD.l - 8} y={Y(t)} textAnchor="end" dominantBaseline="central">
              {t.toFixed(t % 1 === 0 ? 0 : 1)}
            </text>
          </g>
        ))}
        {xLabels.map((d, i) => (
          <text
            key={d}
            className="chart-axis"
            x={X(d)}
            y={height - 8}
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
          >
            {formatShort(d)}
          </text>
        ))}
        {corridorPath && <path className="chart-corridor" d={corridorPath} />}
        {goal !== undefined && goal >= model.yMin && goal <= model.yMax && (
          <g>
            <line className="chart-goal" x1={PAD.l} x2={w - PAD.r} y1={Y(goal)} y2={Y(goal)} />
            <text className="chart-goal-label" x={w - PAD.r - 4} y={Y(goal) - 6} textAnchor="end">
              Goal {goal} {unit}
            </text>
          </g>
        )}
        <path className="chart-daily" d={line(points)} />
        {averages && averages.length > 1 && <path className="chart-avg" d={line(averages)} />}
        {points.map((p) => (
          <circle key={p.date} className="chart-dot" cx={X(p.date)} cy={Y(p.value)} r={points.length > 60 ? 2 : 3.5} />
        ))}
        {hover && (
          <g>
            <line className="chart-cursor" x1={X(hover.date)} x2={X(hover.date)} y1={PAD.t} y2={height - PAD.b} />
            <circle className="chart-dot-active" cx={X(hover.date)} cy={Y(hover.value)} r="6" />
          </g>
        )}
      </svg>
      {hover && (
        <div className="chart-tip num" style={{ left: tipLeft, top: Math.max(Y(hover.value) - 52, 0) }}>
          <strong>
            {hover.value.toFixed(decimals)} {unit}
          </strong>
          <span>{fromISO(hover.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
        </div>
      )}
    </div>
  );
}
