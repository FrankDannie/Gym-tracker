import { CARDIO_GROUPS, NUTRITION, RECOVERY_GROUPS, SCHEDULE, STRENGTH, type Exercise, type SessionId, type StrengthId } from "../data/plan";
import { diffDays, startOfWeek, weekdayIndex, type ISODate } from "./dates";
import type { AppState, SetLog } from "./store";

/* ---------- tunable thresholds (the plan itself gives no numbers for these) ---------- */

/** Weekly averages within this many kg of the previous week count as "not increased". */
export const STALL_TOLERANCE_KG = 0.05;
/** A waist rise of at least this many cm across recent weekly averages counts as "increasing quickly". */
export const WAIST_RISE_CM = 1.5;

/* ---------- sessions ---------- */

export function sessionFor(date: ISODate, state: AppState): SessionId {
  return state.days[date]?.sessionId ?? SCHEDULE[weekdayIndex(date)].session;
}

export const isStrength = (id: SessionId): id is StrengthId => id in STRENGTH;

export function checklistKeys(id: SessionId): string[] {
  const groups = id === "cardio" ? CARDIO_GROUPS : id === "recovery" ? RECOVERY_GROUPS : [];
  return groups.flatMap((g) => g.items.map((i) => i.key));
}

export interface DayProgress {
  done: number;
  total: number;
  complete: boolean;
  started: boolean;
}

export function dayProgress(date: ISODate, state: AppState): DayProgress {
  const id = sessionFor(date, state);
  const log = state.days[date];
  if (isStrength(id)) {
    const total = STRENGTH[id].reduce((n, e) => n + e.sets, 0);
    const done = STRENGTH[id].reduce((n, e) => n + (log?.sets[e.key]?.slice(0, e.sets).filter((s) => s?.done).length ?? 0), 0);
    return { done, total, complete: Boolean(log?.finishedAt) || (total > 0 && done === total), started: done > 0 };
  }
  const keys = checklistKeys(id);
  const done = keys.filter((k) => log?.checks[k]).length;
  return { done, total: keys.length, complete: keys.length > 0 && done === keys.length, started: done > 0 };
}

/* ---------- strength history ---------- */

export interface LastTime {
  date: ISODate;
  sets: SetLog[];
}

/** Most recent earlier day on which at least one set of this exercise was completed. */
export function lastTime(key: string, before: ISODate, state: AppState): LastTime | null {
  const dates = Object.keys(state.days)
    .filter((d) => d < before)
    .sort()
    .reverse();
  for (const date of dates) {
    const sets = state.days[date].sets[key]?.filter((s) => s?.done);
    if (sets && sets.length > 0) return { date, sets };
  }
  return null;
}

/** True when every completed set last time reached the top of the rep range. */
export function readyToProgress(exercise: Exercise, last: LastTime | null): boolean {
  if (!last || exercise.implement === "bodyweight") return false;
  const needed = Math.min(exercise.sets, last.sets.length);
  if (last.sets.length < Math.min(2, exercise.sets)) return false;
  const topped = last.sets.filter((s) => (s.reps ?? 0) >= exercise.repMax).length;
  return topped >= needed;
}

/* ---------- body weight ---------- */

export interface WeekAvg {
  weekStart: ISODate;
  avg: number;
  n: number;
}

export function weeklyAverages<T extends { date: ISODate }>(entries: T[], pick: (e: T) => number): WeekAvg[] {
  const buckets = new Map<ISODate, number[]>();
  for (const e of entries) {
    const k = startOfWeek(e.date);
    buckets.set(k, [...(buckets.get(k) ?? []), pick(e)]);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, vals]) => ({ weekStart, avg: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length }));
}

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Average of entries in the last 7 days; falls back to the latest entry. */
export function currentWeight(state: AppState, today: ISODate): number | null {
  const ws = state.weights;
  if (ws.length === 0) return null;
  const recent = ws.filter((w) => diffDays(today, w.date) >= 0 && diffDays(today, w.date) < 7);
  if (recent.length > 0) return mean(recent.map((w) => w.kg));
  return ws[ws.length - 1].kg;
}

/** kg per week from a least-squares line through weekly averages (needs 2+ weeks). */
export function gainRate(weeks: WeekAvg[], maxWeeks = 4): number | null {
  const pts = weeks.slice(-maxWeeks);
  if (pts.length < 2) return null;
  const xs = pts.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(pts.map((p) => p.avg));
  const num = xs.reduce((a, x, i) => a + (x - mx) * (pts[i].avg - my), 0);
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  return den === 0 ? null : num / den;
}

export type NoteTone = "good" | "watch" | "info";
export interface CoachNote {
  id: string;
  tone: NoteTone;
  title: string;
  body: string;
}

export function coachNotes(state: AppState, today: ISODate): CoachNote[] {
  const notes: CoachNote[] = [];
  const weeks = weeklyAverages(state.weights, (w) => w.kg).filter((w) => w.n >= 2);
  const rate = gainRate(weeks);
  const { gainMin, gainMax } = NUTRITION;

  // Plan: "If weight has not increased for 2 consecutive weeks, add about 100–150 kcal/day."
  const last3 = weeks.slice(-3);
  const stalled =
    last3.length === 3 &&
    last3[1].avg - last3[0].avg <= STALL_TOLERANCE_KG &&
    last3[2].avg - last3[1].avg <= STALL_TOLERANCE_KG;

  if (stalled) {
    notes.push({
      id: "stalled",
      tone: "watch",
      title: "Weight hasn’t increased for 2 weeks",
      body: "The plan suggests adding about 100–150 kcal/day. Make the change, then give it a couple of weeks before judging.",
    });
  } else if (rate !== null) {
    if (rate > gainMax + 0.02) {
      notes.push({
        id: "fast",
        tone: "info",
        title: `Gaining about ${rate.toFixed(2)} kg/week`,
        body: "That’s faster than the planned 0.15–0.25 kg/week. A slower gain helps limit unnecessary fat gain, so keep an eye on your waist.",
      });
    } else if (rate < gainMin - 0.02) {
      notes.push({
        id: "slow",
        tone: "info",
        title: `Gaining about ${Math.max(rate, 0).toFixed(2)} kg/week`,
        body: "That’s below the planned 0.15–0.25 kg/week. The plan says to review your weekly average and adjust after 2 weeks.",
      });
    } else {
      notes.push({
        id: "on-track",
        tone: "good",
        title: `On pace: about ${rate.toFixed(2)} kg/week`,
        body: "Right inside the planned 0.15–0.25 kg/week range. Keep your intake and training steady.",
      });
    }
  }

  // Plan: "If your waist is increasing quickly over several weeks, consider reducing intake by about 100–150 kcal/day…"
  const waistWeeks = weeklyAverages(state.waists, (w) => w.cm).slice(-4);
  if (waistWeeks.length >= 3) {
    const rise = waistWeeks[waistWeeks.length - 1].avg - waistWeeks[0].avg;
    if (rise >= WAIST_RISE_CM) {
      notes.push({
        id: "waist",
        tone: "watch",
        title: `Waist is up ${rise.toFixed(1)} cm over ${waistWeeks.length} weeks`,
        body: "If this keeps climbing, the plan suggests reducing intake by about 100–150 kcal/day and reviewing your rate of gain.",
      });
    }
  }

  if (notes.length === 0) {
    const daysIn = Math.max(0, diffDays(today, state.settings.startDate));
    notes.push({
      id: "warming-up",
      tone: "info",
      title: daysIn < 14 ? "Building your baseline" : "Log a few more weigh-ins",
      body: "Weigh in most mornings under similar conditions. After two full weeks the app can compare weekly averages and tell you whether to adjust.",
    });
  }
  return notes;
}

/* ---------- nutrition ---------- */

export function foodTotals(state: AppState, date: ISODate) {
  const entries = state.food.filter((f) => f.date === date);
  return {
    entries,
    kcal: entries.reduce((a, f) => a + f.kcal, 0),
    protein: entries.reduce((a, f) => a + f.protein, 0),
    fat: entries.reduce((a, f) => a + f.fat, 0),
  };
}

/** Average daily calories over the last 7 days, counting only days that have entries. */
export function weeklyKcal(state: AppState, today: ISODate): { avg: number; days: number } | null {
  const perDay = new Map<ISODate, number>();
  for (const f of state.food) {
    const age = diffDays(today, f.date);
    if (age >= 0 && age < 7) perDay.set(f.date, (perDay.get(f.date) ?? 0) + f.kcal);
  }
  if (perDay.size === 0) return null;
  return { avg: mean([...perDay.values()]), days: perDay.size };
}

export function recentFoods(state: AppState, limit = 6) {
  const seen = new Set<string>();
  const out: { label: string; kcal: number; protein: number; fat: number }[] = [];
  for (let i = state.food.length - 1; i >= 0 && out.length < limit; i--) {
    const f = state.food[i];
    const k = `${f.label.toLowerCase()}|${f.kcal}|${f.protein}|${f.fat}`;
    if (!f.label.trim() || seen.has(k)) continue;
    seen.add(k);
    out.push({ label: f.label, kcal: f.kcal, protein: f.protein, fat: f.fat });
  }
  return out;
}

/** Whole months, rounded, for a number of weeks. */
export const weeksToMonths = (w: number) => Math.max(1, Math.round(w / 4.345));

export function weeksBetween(a: ISODate, b: ISODate) {
  return diffDays(a, b) / 7;
}

