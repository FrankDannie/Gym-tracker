import { CARDIO_GROUPS, PROFILE, RECOVERY_GROUPS, SCHEDULE, SESSIONS, SESSION_ORDER, STRENGTH, type ChecklistGroup, type SessionId } from "../data/plan";
import { Plate } from "../components/Plate";
import { useToday } from "../lib/hooks";
import { href, navigate } from "../lib/router";
import { dayProgress, isStrength, sessionFor } from "../lib/stats";
import { actions, useAppState } from "../lib/store";
import { weekdayIndex } from "../lib/dates";

const isSessionId = (s: string | undefined): s is SessionId => typeof s === "string" && s in SESSIONS;

export function PlanScreen({ param }: { param?: string }) {
  const state = useAppState();
  const today = useToday();
  const todaySession = sessionFor(today, state);
  const selected: SessionId = isSessionId(param) ? param : SCHEDULE[weekdayIndex(today)].session;
  const session = SESSIONS[selected];
  const todayIdx = weekdayIndex(today);
  const isTodays = todaySession === selected;

  return (
    <div className="stack-lg">
      <header className="page-head">
        <h1 className="display t-lg">Your plan</h1>
        <p className="muted measure">{PROFILE.intro}</p>
      </header>

      <div className="plan-grid">
        <section className="panel" aria-labelledby="week-title">
          <h2 id="week-title" className="display t-md panel-title">
            Weekly schedule
          </h2>
          <ul className="plan-week">
            {SCHEDULE.map((d, i) => {
              const s = SESSIONS[d.session];
              return (
                <li key={d.day}>
                  <a className="plan-row" href={href("plan", d.session)} aria-current={d.session === selected ? "true" : undefined} data-today={i === todayIdx}>
                    <Plate session={s} />
                    <span className="plan-row-text">
                      <strong>
                        {d.day}
                        {d.office ? <span className="tag">Office</span> : null}
                        {i === todayIdx ? <span className="tag tag-solid">Today</span> : null}
                      </strong>
                      <span className="muted small">
                        {s.title}: {s.summary}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel session-detail" data-kind={session.kind} aria-labelledby="detail-title">
          <div className="seg" role="group" aria-label="Choose a session">
            {SESSION_ORDER.map((id) => (
              <a key={id} className="seg-item" href={href("plan", id)} aria-current={id === selected ? "true" : undefined} data-kind={SESSIONS[id].kind}>
                {SESSIONS[id].title}
              </a>
            ))}
          </div>

          <header className="detail-head">
            <Plate session={session} className="detail-plate" />
            <div>
              <h2 id="detail-title" className="display t-lg">
                {session.title}
              </h2>
              <p className="muted">{session.summary}</p>
            </div>
          </header>

          {isStrength(selected) ? (
            <ul className="plan-ex">
              {STRENGTH[selected].map((ex) => (
                <li key={ex.key} className="plan-ex-row">
                  <div>
                    <strong>{ex.name}</strong>
                    <p className="muted small">{ex.note}</p>
                  </div>
                  <span className="plan-ex-sets num">
                    {ex.sets} × {ex.repMin}–{ex.repMax}
                    <small>{ex.unit === "reps" ? "reps" : ex.unit}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Groups groups={selected === "cardio" ? CARDIO_GROUPS : RECOVERY_GROUPS} />
          )}

          <div className="detail-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!isTodays) actions.setSession(today, selected);
                navigate("today");
              }}
            >
              {isTodays ? `Open today’s session` : "Do this session today"}
            </button>
            {!isTodays && (
              <span className="faint small">
                Today is scheduled as {SESSIONS[todaySession].title}
                {dayProgress(today, state).started ? " and already has progress logged" : ""}.
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Groups({ groups }: { groups: ChecklistGroup[] }) {
  return (
    <div className="stack">
      {groups.map((g) => (
        <div key={g.title}>
          <h3 className="display t-sm">{g.title}</h3>
          {g.intro && <p className="muted small">{g.intro}</p>}
          <ul className="plan-ex">
            {g.items.map((i) => (
              <li key={i.key} className="plan-ex-row">
                <strong>{i.title}</strong>
                <span className="muted small">{i.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
