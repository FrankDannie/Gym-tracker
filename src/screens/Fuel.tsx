import { useState } from "react";
import { NUTRITION } from "../data/plan";
import { Icon } from "../components/Icon";
import { Meter } from "../components/Meter";
import { useToast } from "../components/Toast";
import { addDays, formatLong, type ISODate } from "../lib/dates";
import { parseNumber, useToday } from "../lib/hooks";
import { uid } from "../lib/id";
import { foodTotals, recentFoods, weeklyKcal } from "../lib/stats";
import { actions, useAppState } from "../lib/store";

export function FuelScreen() {
  const state = useAppState();
  const today = useToday();
  const toast = useToast();
  const [date, setDate] = useState<ISODate>(today);
  const s = state.settings;
  const t = foodTotals(state, date);
  const week = weeklyKcal(state, today);
  const recent = recentFoods(state);
  const isToday = date === today;

  const add = (label: string, kcal: number, protein: number, fat: number) => {
    actions.addFood({ id: uid(), date, label: label.trim(), kcal, protein, fat });
    toast("Meal added");
  };

  return (
    <div className="stack-lg">
      <header className="page-head">
        <h1 className="display t-lg">Fuel</h1>
        <p className="muted measure">Calories are a starting point. Judge them by your weekly average weight, then adjust after 2 weeks.</p>
      </header>

      <div className="day-nav" role="group" aria-label="Choose a day">
        <button className="icon-btn" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
          <Icon name="chevronLeft" />
        </button>
        <div className="day-nav-label">
          <strong>{isToday ? "Today" : formatLong(date)}</strong>
          {isToday && <span className="muted small">{formatLong(date)}</span>}
        </div>
        <button className="icon-btn" onClick={() => setDate(addDays(date, 1))} disabled={date >= today} aria-label="Next day">
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className="two-col">
        <section className="panel stack" aria-labelledby="totals-title">
          <h2 id="totals-title" className="display t-md">
            Daily totals
          </h2>
          <Meter label="Calories" value={t.kcal} unit="kcal" target={s.kcal} max={s.kcal * 1.2} />
          <Meter label="Protein" value={t.protein} unit="g" target={[s.proteinMin, s.proteinMax]} />
          <Meter label="Fat" value={t.fat} unit="g" target={[s.fatMin, s.fatMax]} />
          {week && (
            <p className="muted small num">
              Last 7 days: {Math.round(week.avg).toLocaleString()} kcal on average, from {week.days} logged {week.days === 1 ? "day" : "days"}.
            </p>
          )}
        </section>

        <AddMeal onAdd={add} recent={recent} />
      </div>

      <section className="panel" aria-labelledby="meals-title">
        <h2 id="meals-title" className="display t-md panel-title">
          {isToday ? "Logged today" : "Logged this day"}
        </h2>
        {t.entries.length === 0 ? (
          <p className="muted">Nothing logged yet. Add a meal or snack above.</p>
        ) : (
          <ul className="entry-list">
            {t.entries.map((f) => (
              <li key={f.id} className="food-row">
                <span>
                  <strong>{f.label || "Meal"}</strong>
                  <span className="muted small num">
                    {" "}
                    {f.protein} g protein, {f.fat} g fat
                  </span>
                </span>
                <strong className="num">{f.kcal} kcal</strong>
                <button className="icon-btn" aria-label={`Delete ${f.label || "meal"}`} onClick={() => actions.deleteFood(f.id)}>
                  <Icon name="trash" size={20} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" aria-labelledby="targets-title">
        <h2 id="targets-title" className="display t-md panel-title">
          Your targets
        </h2>
        <dl className="targets">
          {NUTRITION.rows.map((r) => (
            <div key={r.target} className="target-row">
              <dt className="display t-sm">{r.target}</dt>
              <dd>
                <strong>{r.start}</strong>
              </dd>
              <dd className="muted">{r.use}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel" aria-labelledby="ideas-title">
        <h2 id="ideas-title" className="display t-md panel-title">
          Simple meal ideas
        </h2>
        <dl className="ideas">
          {NUTRITION.meals.map((m) => (
            <div key={m.meal} className="idea">
              <dt className="display t-sm">{m.meal}</dt>
              <dd className="muted">{m.idea}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function AddMeal({ onAdd, recent }: { onAdd: (label: string, kcal: number, protein: number, fat: number) => void; recent: ReturnType<typeof recentFoods> }) {
  const [label, setLabel] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [error, setError] = useState("");

  return (
    <section className="panel" aria-labelledby="add-title">
      <h2 id="add-title" className="display t-md panel-title">
        Add a meal
      </h2>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          const k = parseNumber(kcal);
          const p = protein.trim() === "" ? 0 : parseNumber(protein);
          const f = fat.trim() === "" ? 0 : parseNumber(fat);
          if (k === undefined || k < 0 || k > 5000) return setError("Calories should be between 0 and 5,000.");
          if (p === undefined || p < 0 || p > 400) return setError("Protein should be between 0 and 400 g.");
          if (f === undefined || f < 0 || f > 400) return setError("Fat should be between 0 and 400 g.");
          onAdd(label, Math.round(k), Math.round(p), Math.round(f));
          setLabel("");
          setKcal("");
          setProtein("");
          setFat("");
          setError("");
        }}
      >
        <div className="field">
          <label htmlFor="meal-label">Name (optional)</label>
          <input id="meal-label" className="input" maxLength={60} placeholder="Oats with milk and banana" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="field-row field-row-3">
          <div className="field">
            <label htmlFor="meal-kcal">Calories</label>
            <input id="meal-kcal" className="input num" inputMode="numeric" placeholder="kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="meal-protein">Protein (g)</label>
            <input id="meal-protein" className="input num" inputMode="numeric" placeholder="0" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="meal-fat">Fat (g)</label>
            <input id="meal-fat" className="input num" inputMode="numeric" placeholder="0" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
        </div>
        {error && (
          <p className="error small" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit">
          Add meal
        </button>
      </form>
      {recent.length > 0 && (
        <div className="recent">
          <p className="muted small">Add again</p>
          <ul className="chips">
            {recent.map((r) => (
              <li key={`${r.label}-${r.kcal}-${r.protein}-${r.fat}`}>
                <button className="chip chip-button" onClick={() => onAdd(r.label, r.kcal, r.protein, r.fat)}>
                  <Icon name="plus" size={16} />
                  {r.label} <span className="num faint">{r.kcal}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
