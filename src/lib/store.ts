import { useSyncExternalStore } from "react";
import { PROFILE, NUTRITION, type SessionId } from "../data/plan";
import { todayISO, type ISODate } from "./dates";

export type ThemeSetting = "system" | "light" | "dark";

export interface Settings {
  startWeight: number;
  goalWeight: number;
  heightCm: number;
  startDate: ISODate;
  kcal: number;
  proteinMin: number;
  proteinMax: number;
  fatMin: number;
  fatMax: number;
  restSeconds: number;
  theme: ThemeSetting;
}

export interface SetLog {
  kg?: number;
  reps?: number;
  done: boolean;
}

export interface DayLog {
  /** Overrides the scheduled session for this date. */
  sessionId?: SessionId;
  /** Strength sets keyed by exercise key. */
  sets: Record<string, SetLog[]>;
  /** Checklist items (cardio, posture, recovery). */
  checks: Record<string, boolean>;
  finishedAt?: string;
}

export interface WeightEntry {
  date: ISODate;
  kg: number;
}
export interface WaistEntry {
  date: ISODate;
  cm: number;
}
export interface FoodEntry {
  id: string;
  date: ISODate;
  label: string;
  kcal: number;
  protein: number;
  fat: number;
}

export interface AppState {
  v: 1;
  settings: Settings;
  days: Record<ISODate, DayLog>;
  weights: WeightEntry[];
  waists: WaistEntry[];
  food: FoodEntry[];
}

const KEY = "iron-plan:v1";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function defaults(): AppState {
  const today = todayISO();
  return {
    v: 1,
    settings: {
      startWeight: PROFILE.startWeight,
      goalWeight: PROFILE.goalWeight,
      heightCm: PROFILE.heightCm,
      startDate: today,
      kcal: NUTRITION.kcal,
      proteinMin: NUTRITION.proteinMin,
      proteinMax: NUTRITION.proteinMax,
      fatMin: NUTRITION.fatMin,
      fatMax: NUTRITION.fatMax,
      restSeconds: 90,
      theme: "system",
    },
    days: {},
    weights: [{ date: today, kg: PROFILE.startWeight }],
    waists: [],
    food: [],
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const isDate = (x: unknown): x is string => typeof x === "string" && DATE_RE.test(x);

/** Merges untrusted data (storage or file import) over defaults, dropping anything malformed. */
export function sanitize(raw: unknown): AppState | null {
  if (!isObj(raw)) return null;
  const base = defaults();
  const s = isObj(raw.settings) ? raw.settings : {};
  const num = (v: unknown, d: number) => (isNum(v) ? v : d);

  const settings: Settings = {
    startWeight: num(s.startWeight, base.settings.startWeight),
    goalWeight: num(s.goalWeight, base.settings.goalWeight),
    heightCm: num(s.heightCm, base.settings.heightCm),
    startDate: isDate(s.startDate) ? s.startDate : base.settings.startDate,
    kcal: num(s.kcal, base.settings.kcal),
    proteinMin: num(s.proteinMin, base.settings.proteinMin),
    proteinMax: num(s.proteinMax, base.settings.proteinMax),
    fatMin: num(s.fatMin, base.settings.fatMin),
    fatMax: num(s.fatMax, base.settings.fatMax),
    restSeconds: num(s.restSeconds, base.settings.restSeconds),
    theme: s.theme === "light" || s.theme === "dark" || s.theme === "system" ? s.theme : "system",
  };

  const weights = Array.isArray(raw.weights)
    ? raw.weights.filter((w): w is WeightEntry => isObj(w) && isDate(w.date) && isNum(w.kg))
    : base.weights;
  const waists = Array.isArray(raw.waists)
    ? raw.waists.filter((w): w is WaistEntry => isObj(w) && isDate(w.date) && isNum(w.cm))
    : [];
  const food = Array.isArray(raw.food)
    ? raw.food.filter(
        (f): f is FoodEntry =>
          isObj(f) &&
          typeof f.id === "string" &&
          isDate(f.date) &&
          typeof f.label === "string" &&
          isNum(f.kcal) &&
          isNum(f.protein) &&
          isNum(f.fat),
      )
    : [];

  const days: Record<string, DayLog> = {};
  if (isObj(raw.days)) {
    for (const [date, v] of Object.entries(raw.days)) {
      if (!isDate(date) || !isObj(v)) continue;
      days[date] = {
        sessionId: typeof v.sessionId === "string" ? (v.sessionId as SessionId) : undefined,
        sets: isObj(v.sets) ? (v.sets as DayLog["sets"]) : {},
        checks: isObj(v.checks) ? (v.checks as DayLog["checks"]) : {},
        finishedAt: typeof v.finishedAt === "string" ? v.finishedAt : undefined,
      };
    }
  }
  return { v: 1, settings, days, weights, waists, food };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = sanitize(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    /* storage unavailable or corrupted: start fresh */
  }
  return defaults();
}

let state: AppState = load();
const listeners = new Set<() => void>();
let persistFailed = false;

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    persistFailed = false;
  } catch {
    persistFailed = true;
  }
}

export function update(fn: (draft: AppState) => AppState) {
  state = fn(state);
  persist();
  listeners.forEach((l) => l());
}

export const replaceAll = (next: AppState) => update(() => next);
export const resetAll = () => update(() => defaults());
export const getState = () => state;
export const didPersistFail = () => persistFailed;

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* ---------- actions ---------- */

const emptyDay = (): DayLog => ({ sets: {}, checks: {} });

function withDay(s: AppState, date: ISODate, fn: (d: DayLog) => DayLog): AppState {
  const cur = s.days[date] ?? emptyDay();
  return { ...s, days: { ...s.days, [date]: fn(cur) } };
}

const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date);

export const actions = {
  setSession(date: ISODate, sessionId: SessionId | undefined) {
    update((s) => withDay(s, date, (d) => ({ ...d, sessionId })));
  },
  patchSet(date: ISODate, key: string, index: number, count: number, patch: Partial<SetLog>) {
    update((s) =>
      withDay(s, date, (d) => {
        const existing = d.sets[key] ?? [];
        const sets: SetLog[] = Array.from({ length: count }, (_, i) => existing[i] ?? { done: false });
        sets[index] = { ...sets[index], ...patch };
        return { ...d, sets: { ...d.sets, [key]: sets }, finishedAt: undefined };
      }),
    );
  },
  toggleCheck(date: ISODate, key: string) {
    update((s) => withDay(s, date, (d) => ({ ...d, checks: { ...d.checks, [key]: !d.checks[key] } })));
  },
  finish(date: ISODate, finished: boolean) {
    update((s) => withDay(s, date, (d) => ({ ...d, finishedAt: finished ? new Date().toISOString() : undefined })));
  },
  logWeight(date: ISODate, kg: number) {
    update((s) => ({ ...s, weights: [...s.weights.filter((w) => w.date !== date), { date, kg }].sort(byDate) }));
  },
  deleteWeight(date: ISODate) {
    update((s) => ({ ...s, weights: s.weights.filter((w) => w.date !== date) }));
  },
  logWaist(date: ISODate, cm: number) {
    update((s) => ({ ...s, waists: [...s.waists.filter((w) => w.date !== date), { date, cm }].sort(byDate) }));
  },
  deleteWaist(date: ISODate) {
    update((s) => ({ ...s, waists: s.waists.filter((w) => w.date !== date) }));
  },
  addFood(entry: FoodEntry) {
    update((s) => ({ ...s, food: [...s.food, entry] }));
  },
  deleteFood(id: string) {
    update((s) => ({ ...s, food: s.food.filter((f) => f.id !== id) }));
  },
  patchSettings(patch: Partial<Settings>) {
    update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
};
