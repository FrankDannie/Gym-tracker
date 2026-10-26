import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { useAppState } from "../lib/store";

type Kind = "rest" | "hold";
interface Running {
  kind: Kind;
  endsAt: number;
  total: number;
  label: string;
}

interface TimerApi {
  /** Starts a rest countdown. */
  start: (seconds: number) => void;
  /** Opens the timer panel set up for a timed hold (plank etc.). */
  openHold: (seconds: number, label: string) => void;
}

const TimerContext = createContext<TimerApi>({ start: () => {}, openHold: () => {} });
export const useRest = () => useContext(TimerContext);

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const REST_PRESETS = [60, 90, 120, 180];
const HOLD_PRESETS = [20, 30, 40, 60];

function beep(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    [0, 0.28].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
  } catch {
    /* sound is optional */
  }
}

export function RestProvider({ children }: { children: ReactNode }) {
  const state = useAppState();
  const [timer, setTimer] = useState<Running | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const [holdSecs, setHoldSecs] = useState(30);
  const [holdLabel, setHoldLabel] = useState("Hold");
  const audio = useRef<AudioContext | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Audio must be created from a user gesture, so do it when a timer is started.
  const prime = () => {
    try {
      audio.current ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      void audio.current.resume();
    } catch {
      /* no audio support */
    }
  };

  const run = useCallback((kind: Kind, seconds: number, label: string) => {
    if (seconds <= 0) return;
    prime();
    const t = Date.now();
    setNow(t);
    setTimer({ kind, endsAt: t + seconds * 1000, total: seconds, label });
  }, []);

  const api: TimerApi = {
    start: (seconds) => run("rest", seconds, "Rest"),
    openHold: (seconds, label) => {
      setHoldSecs(seconds);
      setHoldLabel(label);
      setOpen(true);
    },
  };

  useEffect(() => {
    if (!timer) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer]);

  const remaining = timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0;
  const finished = timer !== null && remaining === 0;

  useEffect(() => {
    if (!finished) return;
    beep(audio.current);
    if ("vibrate" in navigator) navigator.vibrate?.([150, 90, 150]);
    const id = window.setTimeout(() => setTimer(null), 8000);
    return () => window.clearTimeout(id);
  }, [finished]);

  // Esc closes the panel and returns focus to the button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const adjust = (delta: number) =>
    setTimer((t) => (t ? { ...t, endsAt: Math.max(Date.now() + 1000, t.endsAt + delta * 1000), total: Math.max(1, t.total + delta) } : t));

  const pct = timer ? Math.min(100, Math.max(0, ((timer.total - remaining) / timer.total) * 100)) : 0;
  const fabText = timer ? (finished ? "Done" : fmt(remaining)) : null;

  return (
    <TimerContext.Provider value={api}>
      {children}

      {open && (
        <div ref={panelRef} className="timer-panel" role="dialog" aria-label="Timers" tabIndex={-1}>
          <div className="timer-panel-head">
            <h2 className="display t-sm">Timers</h2>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close timers">
              <Icon name="close" />
            </button>
          </div>

          <div className="timer-display" data-finished={finished} data-active={Boolean(timer)}>
            {timer ? (
              <>
                <p className="timer-label small">{finished ? `${timer.label} finished` : timer.label}</p>
                <p className="timer-big num" role="timer">
                  {finished ? "Time" : fmt(remaining)}
                </p>
                <div className="timer-bar" aria-hidden="true">
                  <span style={{ width: `${finished ? 100 : pct}%` }} />
                </div>
                <div className="timer-controls">
                  <button className="btn btn-quiet btn-small" onClick={() => adjust(-15)} disabled={finished}>
                    −15s
                  </button>
                  <button className="btn btn-quiet btn-small" onClick={() => adjust(15)} disabled={finished}>
                    +15s
                  </button>
                  <button className="btn btn-primary btn-small" onClick={() => setTimer(null)}>
                    {finished ? "Dismiss" : "Stop"}
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">No timer running. Pick a rest time or start an exercise timer below.</p>
            )}
          </div>

          <section className="timer-section" aria-labelledby="t-rest">
            <h3 id="t-rest" className="small timer-heading">
              Rest between sets
            </h3>
            <div className="timer-presets">
              {REST_PRESETS.map((s) => (
                <button key={s} className="chip chip-button" onClick={() => run("rest", s, "Rest")}>
                  {fmt(s)}
                </button>
              ))}
              {!REST_PRESETS.includes(state.settings.restSeconds) && state.settings.restSeconds > 0 && (
                <button className="chip chip-button" onClick={() => run("rest", state.settings.restSeconds, "Rest")}>
                  {fmt(state.settings.restSeconds)} (yours)
                </button>
              )}
            </div>
          </section>

          <section className="timer-section" aria-labelledby="t-hold">
            <h3 id="t-hold" className="small timer-heading">
              Exercise timer (planks, holds)
            </h3>
            <div className="field">
              <label htmlFor="hold-label" className="sr-only">
                Exercise name
              </label>
              <input id="hold-label" className="input" maxLength={40} value={holdLabel} onChange={(e) => setHoldLabel(e.target.value)} placeholder="Exercise name" />
            </div>
            <div className="timer-stepper">
              <button className="icon-btn" onClick={() => setHoldSecs((s) => Math.max(5, s - 5))} aria-label="5 seconds less">
                <Icon name="minus" />
              </button>
              <span className="timer-stepper-value num" aria-live="polite">
                {holdSecs} sec
              </span>
              <button className="icon-btn" onClick={() => setHoldSecs((s) => Math.min(600, s + 5))} aria-label="5 seconds more">
                <Icon name="plus" />
              </button>
            </div>
            <div className="timer-presets">
              {HOLD_PRESETS.map((s) => (
                <button key={s} className="chip chip-button" onClick={() => setHoldSecs(s)} aria-pressed={holdSecs === s}>
                  {s}s
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-wide" onClick={() => run("hold", holdSecs, holdLabel.trim() || "Hold")}>
              Start {holdSecs}s timer
            </button>
          </section>
        </div>
      )}

      <button
        ref={fabRef}
        className="timer-fab"
        data-running={Boolean(timer) && !finished}
        data-finished={finished}
        aria-expanded={open}
        aria-label={timer ? `Timers, ${finished ? "finished" : `${fmt(remaining)} left`}` : "Timers"}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="timer" size={24} />
        {fabText && <span className="timer-fab-time num">{fabText}</span>}
      </button>
    </TimerContext.Provider>
  );
}
