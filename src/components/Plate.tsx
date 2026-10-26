import type { Session } from "../data/plan";

interface PlateProps {
  session: Session;
  /** 0–1. When provided, an arc around the rim fills clockwise. */
  progress?: number;
  complete?: boolean;
  className?: string;
  /** Rim arc colours, for use on coloured or neutral backgrounds. */
  tone?: "on-accent" | "on-surface";
  title?: string;
}

const R = 64;
const C = 2 * Math.PI * R;

/** A weight plate. Colour encodes the session type; the rim shows progress. */
export function Plate({ session, progress, complete, className, tone = "on-surface", title }: PlateProps) {
  const p = Math.max(0, Math.min(1, progress ?? 0));
  const showArc = progress !== undefined;
  return (
    <svg
      className={`plate ${className ?? ""}`}
      data-kind={session.kind}
      data-tone={tone}
      viewBox="0 0 144 144"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {showArc && (
        <>
          <circle className="plate-track" cx="72" cy="72" r={R} />
          <circle
            className="plate-arc"
            cx="72"
            cy="72"
            r={R}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - p)}
            transform="rotate(-90 72 72)"
          />
        </>
      )}
      <circle className="plate-rubber" cx="72" cy="72" r="54" />
      <circle className="plate-face" cx="72" cy="72" r="46" />
      <circle className="plate-emboss" cx="72" cy="72" r="37" />
      <circle className="plate-hub" cx="72" cy="72" r="21" />
      {complete ? (
        <path className="plate-check" d="M62 73l7 7 14-15" />
      ) : (
        <text className="plate-mark" x="72" y="72" textAnchor="middle" dominantBaseline="central">
          {session.mark}
        </text>
      )}
    </svg>
  );
}
