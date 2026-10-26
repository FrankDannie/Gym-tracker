import { useMemo, useState } from "react";
import { NUTRITION } from "../data/plan";
import { Icon } from "../components/Icon";
import { LineChart, type Point } from "../components/Chart";
import { Ruler } from "../components/Ruler";
import { useToast } from "../components/Toast";
import { addDays, diffDays, formatShort, formatWithYear, startOfWeek, type ISODate } from "../lib/dates";
import { parseNumber, useToday } from "../lib/hooks";
import { coachNotes, currentWeight, gainRate, weeklyAverages, weeksToMonths, type NoteTone } from "../lib/stats";
import { actions, useAppState } from "../lib/store";

const TONE_ICON: Record<NoteTone, "check" | "alert" | "info"> = { good: "check", watch: "alert", info: "info" };

export function ProgressScreen() {
  const state = useAppState();
  const today = useToday();
  const toast = useToast();
  const { startWeight, goalWeight, startDate } = state.settings;

  const current = currentWeight(state, today) ?? startWeight;
  const gained = current - startWeight;
  const remaining = Math.max(0, goalWeight - current);
  const weeks = useMemo(() => weeklyAverages(state.weights, (w) => w.kg), [state.weights]);
  const rate = gainRate(weeks.filter((w) => w.n >= 2));
  const notes = coachNotes(state, today);

  const points: Point[] = state.weights.map((w) => ({ date: w.date, value: w.kg }));
  const averages: Point[] = weeks
    .filter((w) => w.n >= 2)
    .map((w) => {
      const entries = state.weights.filter((e) => startOfWeek(e.date) === w.weekStart);
      const meanOffset = Math.round(entries.reduce((a, e) => a + diffDays(e.date, w.weekStart), 0) / entries.length);
      return { date: addDays(w.weekStart, meanOffset), value: w.avg };
    });

  const thisWeek = startOfWeek(today);
  const waistWeeks = weeklyAverages(state.waists, (w) => w.cm);
  const waistByWeek = new Map(waistWeeks.map((w) => [w.weekStart, w.avg]));

  const slowMonths = remaining > 0 ? weeksToMonths(remaining / NUTRITION.gainMin) : 0;
  const fastMonths = remaining > 0 ? weeksToMonths(remaining / NUTRITION.gainMax) : 0;

  return (
    <div className="stack-lg">
      <header className="page-head">
        <h1 className="display t-lg">Progress</h1>
        <p className="muted measure">Compare weekly averages, not single readings. Daily weight moves with food, water and sleep.</p>
      </header>

      <section className="panel journey" aria-labelledby="journey-title">
        <div className="journey-main">
          <h2 id="journey-title" className="sr-only">
            Journey to goal weight
          </h2>
          <p className="journey-label muted">7-day average</p>
          <p className="journey-figure">
            <span className="display t-xl num">{current.toFixed(1)}</span>
            <span className="journey-unit muted">kg</span>
          </p>
          <p className="num">
            {gained >= 0 ? "+" : "−"}
            {Math.abs(gained).toFixed(1)} kg since the start at {startWeight} kg
          </p>
        </div>
        <div className="journey-ruler">
          <Ruler start={startWeight} goal={goalWeight} current={current} />
          <p className="muted small num">
            {remaining > 0 ? (
              <>
                <strong>{remaining.toFixed(1)} kg</strong> to your {goalWeight} kg goal. At the planned {NUTRITION.gainMin}–{NUTRITION.gainMax} kg/week that’s roughly {fastMonths === slowMonths ? fastMonths : `${fastMonths}–${slowMonths}`}{" "}
                {slowMonths === 1 ? "month" : "months"}.
              </>
            ) : (
              <strong>You’ve reached your goal weight.</strong>
            )}
          </p>
        </div>
      </section>

      <section aria-labelledby="notes-title" className="stack">
        <h2 id="notes-title" className="sr-only">
          What the numbers suggest
        </h2>
        <ul className="notes">
          {notes.map((n) => (
            <li key={n.id} className="note" data-tone={n.tone}>
              <Icon name={TONE_ICON[n.tone]} size={22} />
              <div>
                <strong>{n.title}</strong>
                <p className="small">{n.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="chart-title">
        <header className="panel-head">
          <h2 id="chart-title" className="display t-md">
            Body weight
          </h2>
          <ul className="legend small muted">
            <li>
              <span className="swatch swatch-dot" /> Daily
            </li>
            <li>
              <span className="swatch swatch-avg" /> Weekly average
            </li>
            <li>
              <span className="swatch swatch-band" /> Planned pace
            </li>
          </ul>
        </header>
        <LineChart
          points={points}
          averages={averages}
          corridor={{ from: startDate, fromValue: startWeight, minRate: NUTRITION.gainMin, maxRate: NUTRITION.gainMax }}
          goal={goalWeight}
          unit="kg"
          label={`Body weight from ${startWeight} kg. Latest 7-day average ${current.toFixed(1)} kg.`}
        />
        {rate !== null && (
          <p className="muted small num">
            Recent trend: {rate >= 0 ? "+" : "−"}
            {Math.abs(rate).toFixed(2)} kg/week across your last {Math.min(4, weeks.filter((w) => w.n >= 2).length)} weekly averages.
          </p>
        )}
      </section>

      <div className="two-col">
        <LogForm today={today} onSaved={() => toast("Entry saved")} />
        <section className="panel" aria-labelledby="waist-title">
          <h2 id="waist-title" className="display t-md panel-title">
            Waist
          </h2>
          {state.waists.length >= 2 ? (
            <LineChart
              points={state.waists.map((w) => ({ date: w.date, value: w.cm }))}
              unit="cm"
              height={200}
              label={`Waist measurements, latest ${state.waists[state.waists.length - 1].cm} cm`}
            />
          ) : (
            <p className="muted">
              {state.waists.length === 1
                ? `Latest: ${state.waists[0].cm} cm. Add another measurement to see a trend.`
                : "Measure at the same point each time, ideally weekly. Add your first measurement to start the trend."}
            </p>
          )}
        </section>
      </div>

      <section className="panel" aria-labelledby="weeks-title">
        <h2 id="weeks-title" className="display t-md panel-title">
          Weekly averages
        </h2>
        {weeks.length === 0 ? (
          <p className="muted">Log a few weigh-ins to see weekly averages.</p>
        ) : (
          <div className="table-wrap">
            <table className="table num">
              <thead>
                <tr>
                  <th scope="col">Week of</th>
                  <th scope="col">Average</th>
                  <th scope="col">Change</th>
                  <th scope="col">Weigh-ins</th>
                  <th scope="col">Waist</th>
                </tr>
              </thead>
              <tbody>
                {weeks
                  .map((w, i) => ({ w, delta: i > 0 ? w.avg - weeks[i - 1].avg : null }))
                  .slice(-10)
                  .reverse()
                  .map(({ w, delta }) => (
                    <tr key={w.weekStart}>
                      <th scope="row">{formatShort(w.weekStart)}</th>
                      <td>{w.avg.toFixed(1)} kg</td>
                      {w.weekStart === thisWeek && w.n < 3 ? (
                        <td className="faint">So far</td>
                      ) : (
                        <td data-sign={delta === null ? "none" : delta > 0.005 ? "up" : delta < -0.005 ? "down" : "flat"}>
                          {delta === null ? "–" : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta).toFixed(2)}`}
                        </td>
                      )}
                      <td>{w.n}</td>
                      <td>{waistByWeek.has(w.weekStart) ? `${waistByWeek.get(w.weekStart)!.toFixed(1)} cm` : "–"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <details className="panel entries">
        <summary>
          <span className="display t-md">All entries</span>
          <span className="muted small">
            {state.weights.length} weight, {state.waists.length} waist
          </span>
        </summary>
        <ul className="entry-list">
          {[...state.weights].reverse().map((w) => (
            <li key={`w-${w.date}`}>
              <span>{formatWithYear(w.date)}</span>
              <strong className="num">{w.kg} kg</strong>
              <button
                className="icon-btn"
                aria-label={`Delete weight entry for ${formatWithYear(w.date)}`}
                onClick={() => {
                  actions.deleteWeight(w.date);
                  toast("Entry deleted");
                }}
              >
                <Icon name="trash" size={20} />
              </button>
            </li>
          ))}
          {[...state.waists].reverse().map((w) => (
            <li key={`c-${w.date}`}>
              <span>{formatWithYear(w.date)}</span>
              <strong className="num">{w.cm} cm waist</strong>
              <button
                className="icon-btn"
                aria-label={`Delete waist entry for ${formatWithYear(w.date)}`}
                onClick={() => {
                  actions.deleteWaist(w.date);
                  toast("Entry deleted");
                }}
              >
                <Icon name="trash" size={20} />
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function LogForm({ today, onSaved }: { today: ISODate; onSaved: () => void }) {
  const state = useAppState();
  const [date, setDate] = useState<ISODate>(today);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [error, setError] = useState("");
  const existing = state.weights.find((w) => w.date === date);

  return (
    <section className="panel" aria-labelledby="log-title">
      <h2 id="log-title" className="display t-md panel-title">
        Add an entry
      </h2>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const kg = parseNumber(weight);
          const cm = parseNumber(waist);
          if (weight.trim() === "" && waist.trim() === "") {
            setError("Enter a weight, a waist measurement, or both.");
            return;
          }
          if (weight.trim() !== "" && (kg === undefined || kg < 20 || kg > 300)) {
            setError("Weight should be between 20 and 300 kg.");
            return;
          }
          if (waist.trim() !== "" && (cm === undefined || cm < 30 || cm > 250)) {
            setError("Waist should be between 30 and 250 cm.");
            return;
          }
          if (kg !== undefined) actions.logWeight(date, kg);
          if (cm !== undefined) actions.logWaist(date, cm);
          setWeight("");
          setWaist("");
          setError("");
          onSaved();
        }}
      >
        <div className="field">
          <label htmlFor="log-date">Date</label>
          <input id="log-date" className="input" type="date" value={date} max={today} min={addDays(today, -400)} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="log-weight">Weight (kg)</label>
            <input id="log-weight" className="input num" inputMode="decimal" placeholder={existing ? String(existing.kg) : "e.g. 62.4"} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="log-waist">Waist (cm)</label>
            <input id="log-waist" className="input num" inputMode="decimal" placeholder="optional" value={waist} onChange={(e) => setWaist(e.target.value)} />
          </div>
        </div>
        {error && (
          <p className="error small" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit">
          Save entry
        </button>
        {existing && weight.trim() !== "" && <p className="faint small">This replaces the {existing.kg} kg already logged for this date.</p>}
      </form>
    </section>
  );
}

