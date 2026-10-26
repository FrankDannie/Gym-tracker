import { useEffect, useState } from "react";
import { CARDIO_GROUPS, RECOVERY_GROUPS, SCHEDULE, SESSIONS, SESSION_ORDER, STRENGTH, type ChecklistGroup, type Exercise, type SessionId } from "../data/plan";
import { Icon } from "../components/Icon";
import { Meter } from "../components/Meter";
import { Plate } from "../components/Plate";
import { useRest } from "../components/RestTimer";
import { useToast } from "../components/Toast";
import { WeekStrip } from "../components/WeekStrip";
import { formatLong, weekdayIndex, type ISODate } from "../lib/dates";
import { parseNumber, useToday } from "../lib/hooks";
import { href } from "../lib/router";
import { currentWeight, dayProgress, foodTotals, isStrength, lastTime, readyToProgress, sessionFor } from "../lib/stats";
import { actions, getState, useAppState } from "../lib/store";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function TodayScreen({ dateParam }: { dateParam?: string }) {
  const state = useAppState();
  const realToday = useToday();
  const date: ISODate = dateParam && DATE_RE.test(dateParam) ? dateParam : realToday;
  const isToday = date === realToday;

  const sessionId = sessionFor(date, state);
  const session = SESSIONS[sessionId];
  const scheduled = SCHEDULE[weekdayIndex(date)];
  const prog = dayProgress(date, state);
  const log = state.days[date];
  const overridden = Boolean(log?.sessionId) && log?.sessionId !== scheduled.session;
  const unit = isStrength(sessionId) ? "sets" : "steps";

  return (
    <>
      {!isToday && (
        <div className="notice notice-info" role="note">
          <Icon name="info" size={20} />
          <span>
            Viewing {formatLong(date)}. <a href={href("today")}>Back to today</a>
          </span>
        </div>
      )}

      <div className="today">
      <section className="hero today-hero" data-kind={session.kind} aria-labelledby="hero-title">
        <Plate
          className="hero-plate"
          session={session}
          progress={prog.total ? prog.done / prog.total : 0}
          complete={prog.complete}
          tone="on-accent"
          title={`${prog.done} of ${prog.total} ${unit} done`}
        />
        <div className="hero-text">
          <p className="hero-day">
            {scheduled.day}
            {scheduled.office ? ", office day" : ""}
          </p>
          <h1 id="hero-title" className="display t-xl">
            {session.title}
          </h1>
          <ul className="hero-facts">
            <li>{session.duration}</li>
            <li className="num">
              {prog.done} of {prog.total} {unit}
            </li>
            {prog.complete && <li className="hero-done">Complete</li>}
          </ul>
        </div>
        <div className="hero-actions">
          <label className="hero-swap">
            <Icon name="swap" size={18} />
            <span className="sr-only">Session for this day</span>
            <select value={sessionId} onChange={(e) => actions.setSession(date, e.target.value as SessionId)}>
              {SESSION_ORDER.map((id) => (
                <option key={id} value={id}>
                  {SESSIONS[id].title}
                </option>
              ))}
            </select>
          </label>
          {overridden && (
            <button className="hero-link" onClick={() => actions.setSession(date, undefined)}>
              Back to schedule
            </button>
          )}
        </div>
      </section>

      <WeekStrip className="week-mobile" state={state} viewing={date} today={realToday} />

      <div className="today-work" data-kind={session.kind}>
        {isStrength(sessionId) ? (
          <StrengthSession sessionId={sessionId} date={date} />
        ) : (
          <ChecklistSession
            date={date}
            groups={sessionId === "cardio" ? CARDIO_GROUPS : RECOVERY_GROUPS}
            complete={prog.complete}
            recovery={sessionId === "recovery"}
          />
        )}
      </div>

      <aside className="today-side" aria-label="Daily tracking">
        <WeekStrip className="week-desktop" state={state} viewing={date} today={realToday} />
        <QuickWeight date={date} />
        <FuelGlance date={date} />
      </aside>
      </div>
    </>
  );
}

/* ---------------- strength ---------------- */

function StrengthSession({ sessionId, date }: { sessionId: keyof typeof STRENGTH; date: ISODate }) {
  const state = useAppState();
  const toast = useToast();
  const exercises = STRENGTH[sessionId];
  const prog = dayProgress(date, state);
  const finished = Boolean(state.days[date]?.finishedAt);

  return (
    <>
      <ol className="exercises">
        {exercises.map((ex) => (
          <ExerciseCard key={`${sessionId}-${ex.key}`} exercise={ex} date={date} />
        ))}
      </ol>
      {finished ? (
        <div className="panel finish finish-done">
          <div>
            <h2 className="display t-sm">Session logged</h2>
            <p className="muted small">
              {prog.done} of {prog.total} sets completed. Recovery is part of progress.
            </p>
          </div>
          <button className="btn btn-quiet" onClick={() => actions.finish(date, false)}>
            Reopen session
          </button>
        </div>
      ) : (
        <div className="finish">
          <button
            className="btn btn-primary btn-wide"
            disabled={prog.done === 0}
            onClick={() => {
              actions.finish(date, true);
              toast("Session logged");
            }}
          >
            Finish session
          </button>
          {prog.done === 0 && <p className="faint small">Mark a set as done to finish the session.</p>}
        </div>
      )}
    </>
  );
}

function ExerciseCard({ exercise: ex, date }: { exercise: Exercise; date: ISODate }) {
  const state = useAppState();
  const rest = useRest();
  const sets = state.days[date]?.sets[ex.key] ?? [];
  const last = lastTime(ex.key, date, state);
  const ready = readyToProgress(ex, last);
  const loadable = ex.implement !== "bodyweight";
  const doneCount = sets.slice(0, ex.sets).filter((s) => s?.done).length;
  const repLabel = ex.unit === "sec per side" ? "Seconds" : "Reps";
  const loadLabel = ex.implement === "dumbbell" ? "kg each" : "kg";

  const toggle = (i: number) => {
    const s = getState();
    const cur = s.days[date]?.sets[ex.key]?.[i];
    if (cur?.done) {
      actions.patchSet(date, ex.key, i, ex.sets, { done: false });
      return;
    }
    const prev = s.days[date]?.sets[ex.key]?.[i - 1];
    const lt = lastTime(ex.key, date, s);
    const kg = loadable ? (cur?.kg ?? lt?.sets[i]?.kg ?? prev?.kg ?? lt?.sets.at(-1)?.kg) : undefined;
    const reps = cur?.reps ?? lt?.sets[i]?.reps ?? prev?.reps ?? lt?.sets.at(-1)?.reps;
    actions.patchSet(date, ex.key, i, ex.sets, { done: true, kg, reps });
    rest.start(s.settings.restSeconds);
  };

  return (
    <li className="exercise panel" data-complete={doneCount === ex.sets}>
      <header className="exercise-head">
        <div>
          <h2 className="display t-sm">{ex.name}</h2>
          <p className="muted small">{ex.note}</p>
        </div>
        <div className="exercise-target num">
          <strong>
            {ex.sets} × {ex.repMin}–{ex.repMax}
          </strong>
          <span>{ex.unit === "reps" ? "reps" : ex.unit}</span>
        </div>
      </header>

      {last && (
        <p className="exercise-last small muted num">
          Last time:{" "}
          {last.sets
            .map((s) => `${loadable && s.kg !== undefined ? `${s.kg} kg × ` : ""}${s.reps ?? "–"}`)
            .join(", ")}
        </p>
      )}
      {ready && (
        <p className="chip chip-good">
          <Icon name="up" size={16} />
          You reached the top of the range last time. Try slightly heavier.
        </p>
      )}

      {ex.unit === "sec per side" && (
        <button className="btn btn-quiet btn-small exercise-timer-btn" onClick={() => rest.openHold(ex.repMin, ex.name)}>
          <Icon name="timer" size={18} /> Open hold timer
        </button>
      )}

      <div className="sets" data-bodyweight={!loadable} role="group" aria-label={`${ex.name} sets`}>
        <div className="set set-head small faint" aria-hidden="true">
          <span />
          <span>Set</span>
          {loadable && <span>{loadLabel}</span>}
          <span>{repLabel}</span>
        </div>
        {Array.from({ length: ex.sets }, (_, i) => {
          const set = sets[i];
          const prev = sets[i - 1];
          const phKg = last?.sets[i]?.kg ?? prev?.kg ?? last?.sets.at(-1)?.kg;
          const phReps = last?.sets[i]?.reps ?? prev?.reps ?? last?.sets.at(-1)?.reps;
          return (
            <div key={i} className="set" data-done={Boolean(set?.done)}>
              <button
                className="set-check"
                role="checkbox"
                aria-checked={Boolean(set?.done)}
                aria-label={`${ex.name}, set ${i + 1}`}
                onClick={() => toggle(i)}
              >
                <Icon name="check" size={20} />
              </button>
              <span className="set-index num">{i + 1}</span>
              {loadable && (
                <NumInput
                  label={`${ex.name}, set ${i + 1}, ${loadLabel}`}
                  value={set?.kg}
                  placeholder={phKg !== undefined ? String(phKg) : "–"}
                  onCommit={(kg) => actions.patchSet(date, ex.key, i, ex.sets, { kg })}
                />
              )}
              <NumInput
                label={`${ex.name}, set ${i + 1}, ${repLabel.toLowerCase()}`}
                value={set?.reps}
                placeholder={phReps !== undefined ? String(phReps) : "–"}
                onCommit={(reps) => actions.patchSet(date, ex.key, i, ex.sets, { reps })}
              />
            </div>
          );
        })}
      </div>
    </li>
  );
}

function NumInput({
  value,
  placeholder,
  label,
  onCommit,
}: {
  value: number | undefined;
  placeholder: string;
  label: string;
  onCommit: (n: number | undefined) => void;
}) {
  const [text, setText] = useState(value === undefined ? "" : String(value));

  // Follow outside changes, but never fight what's being typed ("62." should stay "62.").
  useEffect(() => {
    if (parseNumber(text) !== value) setText(value === undefined ? "" : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      className="input set-input num"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={label}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw.trim() === "") onCommit(undefined);
        else {
          const n = parseNumber(raw);
          if (n !== undefined && n >= 0 && n <= 999) onCommit(n);
        }
      }}
    />
  );
}

/* ---------------- checklist (cardio, posture, recovery) ---------------- */

function ChecklistSession({ date, groups, complete, recovery }: { date: ISODate; groups: ChecklistGroup[]; complete: boolean; recovery: boolean }) {
  const state = useAppState();
  const checks = state.days[date]?.checks ?? {};
  return (
    <>
      {groups.map((g) => (
        <section key={g.title} className="panel checklist" aria-labelledby={`cl-${g.title}`}>
          <header className="checklist-head">
            <h2 id={`cl-${g.title}`} className="display t-sm">
              {g.title}
            </h2>
            {g.intro && <p className="muted small">{g.intro}</p>}
          </header>
          <ul>
            {g.items.map((item) => (
              <li key={item.key}>
                <button
                  className="check-row"
                  role="checkbox"
                  aria-checked={Boolean(checks[item.key])}
                  data-done={Boolean(checks[item.key])}
                  onClick={() => actions.toggleCheck(date, item.key)}
                >
                  <span className="set-check" aria-hidden="true">
                    <Icon name="check" size={20} />
                  </span>
                  <span className="check-text">
                    <strong>{item.title}</strong>
                    <span className="muted small">{item.detail}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {complete && (
        <div className="panel finish finish-done">
          <div>
            <h2 className="display t-sm">{recovery ? "Recovery done" : "Session complete"}</h2>
            <p className="muted small">
              {recovery ? "Easy days are what make the hard days work." : "Posture work is about consistency, not intensity."}
            </p>
          </div>
        </div>
      )}
      {!recovery && (
        <p className="faint small footnote">
          These exercises may help strength and movement control, but they do not guarantee correction of anterior pelvic tilt. If you have persistent pain or a pronounced posture concern, consider an
          assessment by a physiotherapist.
        </p>
      )}
    </>
  );
}

/* ---------------- side cards ---------------- */

function QuickWeight({ date }: { date: ISODate }) {
  const state = useAppState();
  const toast = useToast();
  const entry = state.weights.find((w) => w.date === date);
  const [text, setText] = useState(entry ? String(entry.kg) : "");
  const [error, setError] = useState("");
  const avg = currentWeight(state, date);

  useEffect(() => {
    setText(entry ? String(entry.kg) : "");
    setError("");
  }, [entry?.kg, date]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="panel side-card" aria-labelledby="qw-title">
      <h2 id="qw-title" className="display t-sm">
        Morning weight
      </h2>
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          const kg = parseNumber(text);
          if (kg === undefined || kg < 20 || kg > 300) {
            setError("Enter a weight between 20 and 300 kg.");
            return;
          }
          setError("");
          actions.logWeight(date, kg);
          toast("Weight saved");
        }}
      >
        <label className="field field-grow">
          <span className="sr-only">Weight in kilograms</span>
          <input className="input num" inputMode="decimal" placeholder="kg" value={text} onChange={(e) => setText(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "qw-error" : undefined} />
        </label>
        <button className="btn btn-primary" type="submit">
          {entry ? "Update" : "Save"}
        </button>
      </form>
      {error && (
        <p id="qw-error" className="error small" role="alert">
          {error}
        </p>
      )}
      <p className="muted small num">
        {avg !== null ? `7-day average ${avg.toFixed(1)} kg. ` : ""}
        <a href={href("progress")}>See progress</a>
      </p>
    </section>
  );
}

function FuelGlance({ date }: { date: ISODate }) {
  const state = useAppState();
  const t = foodTotals(state, date);
  const s = state.settings;
  return (
    <section className="panel side-card" aria-labelledby="fg-title">
      <h2 id="fg-title" className="display t-sm">
        Fuel
      </h2>
      <Meter label="Calories" value={t.kcal} unit="kcal" target={s.kcal} max={s.kcal * 1.2} />
      <Meter label="Protein" value={t.protein} unit="g" target={[s.proteinMin, s.proteinMax]} />
      <p className="muted small">
        <a href={href("fuel")}>Log a meal</a>
      </p>
    </section>
  );
}
