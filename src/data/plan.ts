// Everything in this file is transcribed from "Muscle & Weight-Gain Plan".
// Edit here to change the plan; the rest of the app reads from it.

export type Implement = "dumbbell" | "machine" | "bodyweight";
export type RepUnit = "reps" | "reps per side" | "sec per side";

export interface Exercise {
  /** Storage key. Shared between sessions so history carries over (e.g. lat pulldown). */
  key: string;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  unit: RepUnit;
  implement: Implement;
  note: string;
}

export type StrengthId = "upperA" | "legsA" | "upperB" | "legsB";
export type SessionId = StrengthId | "cardio" | "recovery";
export type SessionKind = "upper" | "legs" | "cardio" | "recovery";

export interface Session {
  id: SessionId;
  kind: SessionKind;
  title: string;
  /** Letter or glyph shown on the plate */
  mark: string;
  duration: string;
  summary: string;
}

export const PROFILE = {
  startWeight: 61.5,
  goalWeight: 70,
  heightCm: 167,
  intro:
    "Aim to build muscle steadily while keeping an eye on waist measurements and posture. This is a starting plan; adjust based on recovery, strength progress and your weekly average weight.",
};

export const SESSIONS: Record<SessionId, Session> = {
  upperA: { id: "upperA", kind: "upper", title: "Upper body A", mark: "A", duration: "45–60 min", summary: "Strength session" },
  legsA: { id: "legsA", kind: "legs", title: "Legs + core A", mark: "A", duration: "45–60 min", summary: "Strength session" },
  upperB: { id: "upperB", kind: "upper", title: "Upper body B", mark: "B", duration: "45–60 min", summary: "Strength session" },
  legsB: { id: "legsB", kind: "legs", title: "Legs + core B", mark: "B", duration: "45–60 min", summary: "Strength session" },
  cardio: { id: "cardio", kind: "cardio", title: "Treadmill + posture", mark: "T", duration: "30–40 min", summary: "20–30 min cardio, then the 8-minute posture routine" },
  recovery: { id: "recovery", kind: "recovery", title: "Recovery", mark: "R", duration: "Easy", summary: "Easy walk or gentle mobility; no hard workout required" },
};

export interface ScheduleDay {
  day: string;
  short: string;
  office: boolean;
  session: SessionId;
}

/** Monday first. */
export const SCHEDULE: ScheduleDay[] = [
  { day: "Monday", short: "Mon", office: true, session: "cardio" },
  { day: "Tuesday", short: "Tue", office: true, session: "recovery" },
  { day: "Wednesday", short: "Wed", office: false, session: "upperA" },
  { day: "Thursday", short: "Thu", office: false, session: "legsA" },
  { day: "Friday", short: "Fri", office: true, session: "cardio" },
  { day: "Saturday", short: "Sat", office: false, session: "upperB" },
  { day: "Sunday", short: "Sun", office: false, session: "legsB" },
];

const ex = (
  key: string,
  name: string,
  sets: number,
  repMin: number,
  repMax: number,
  unit: RepUnit,
  implement: Implement,
  note: string,
): Exercise => ({ key, name, sets, repMin, repMax, unit, implement, note });

export const STRENGTH: Record<StrengthId, Exercise[]> = {
  upperA: [
    ex("db-bench-press", "Dumbbell bench press", 3, 8, 12, "reps", "dumbbell", "Controlled reps; stop with 1–3 good reps left"),
    ex("lat-pulldown", "Lat pulldown", 3, 8, 12, "reps", "machine", "Pull towards upper chest without swinging"),
    ex("one-arm-row", "One-arm dumbbell row", 3, 10, 15, "reps per side", "dumbbell", "Keep back supported and torso steady"),
    ex("seated-shoulder-press", "Seated dumbbell shoulder press", 2, 8, 12, "reps", "dumbbell", "Use a comfortable range"),
    ex("lateral-raise", "Dumbbell lateral raise", 3, 12, 20, "reps", "dumbbell", "Light weight; avoid swinging"),
    ex("db-curl", "Dumbbell curl", 2, 10, 15, "reps", "dumbbell", "Keep elbows close to sides"),
    ex("triceps-extension", "Dumbbell triceps extension", 2, 10, 15, "reps", "dumbbell", "Choose a pain-free variation"),
  ],
  legsA: [
    ex("goblet-squat", "Goblet squat", 3, 10, 15, "reps", "dumbbell", "Keep feet stable and move within a comfortable range"),
    ex("db-rdl", "Dumbbell Romanian deadlift", 3, 10, 12, "reps", "dumbbell", "Hinge at hips; keep weights close to legs"),
    ex("bulgarian-split-squat", "Bulgarian split squat", 2, 8, 12, "reps per side", "dumbbell", "Use the bench only if stable and safe"),
    ex("db-glute-bridge", "Dumbbell glute bridge", 3, 12, 15, "reps", "dumbbell", "Pause briefly at the top"),
    ex("calf-raise", "Standing calf raise", 3, 15, 20, "reps", "dumbbell", "Hold dumbbells if appropriate"),
    ex("dead-bug", "Dead bug", 2, 8, 10, "reps per side", "bodyweight", "Keep lower back controlled"),
    ex("side-plank", "Side plank", 2, 20, 40, "sec per side", "bodyweight", "Stop if you feel pain"),
  ],
  upperB: [
    ex("incline-bench-press", "Incline dumbbell bench press", 3, 8, 12, "reps", "dumbbell", "Use flat press if the bench does not incline"),
    ex("lat-pulldown", "Lat pulldown", 3, 10, 12, "reps", "machine", "Avoid using momentum"),
    ex("chest-supported-row", "Chest-supported dumbbell row", 3, 10, 15, "reps", "dumbbell", "Use incline bench if available; otherwise do a supported row"),
    ex("db-fly", "Dumbbell fly", 2, 10, 15, "reps", "dumbbell", "Use a controlled, comfortable range"),
    ex("lateral-raise", "Dumbbell lateral raise", 3, 12, 20, "reps", "dumbbell", "Light weight; avoid swinging"),
    ex("rear-delt-raise", "Rear-delt raise", 2, 12, 20, "reps", "dumbbell", "Keep neck relaxed"),
    ex("hammer-curl", "Hammer curl", 2, 10, 15, "reps", "dumbbell", "Controlled reps"),
    ex("triceps-extension", "Dumbbell triceps extension", 2, 10, 15, "reps", "dumbbell", "Choose a comfortable variation"),
  ],
  legsB: [
    ex("db-split-squat", "Dumbbell split squat", 3, 8, 12, "reps per side", "dumbbell", "Use support for balance if needed"),
    ex("db-rdl", "Dumbbell Romanian deadlift", 3, 10, 12, "reps", "dumbbell", "Keep the movement controlled"),
    ex("step-up-lunge", "Step-up or reverse lunge", 2, 8, 12, "reps per side", "dumbbell", "Only step onto a stable, suitable platform; reverse lunge is an alternative"),
    ex("db-hip-thrust", "Dumbbell hip thrust", 3, 10, 15, "reps", "dumbbell", "Pause briefly at the top"),
    ex("calf-raise", "Calf raise", 3, 15, 20, "reps", "dumbbell", "Use full, controlled range"),
    ex("bird-dog", "Bird dog", 2, 8, 10, "reps per side", "bodyweight", "Keep hips level"),
    ex("reverse-crunch", "Reverse crunch", 2, 10, 15, "reps", "bodyweight", "Move slowly; avoid swinging"),
  ],
};

export interface ChecklistItem {
  key: string;
  title: string;
  detail: string;
}

export interface ChecklistGroup {
  title: string;
  intro?: string;
  items: ChecklistItem[];
}

export const CARDIO_GROUPS: ChecklistGroup[] = [
  {
    title: "Treadmill",
    intro: "20–30 minutes in total.",
    items: [
      { key: "tm-warm", title: "Easy warm-up", detail: "5 minutes" },
      { key: "tm-main", title: "Moderate pace", detail: "15–20 minutes. You can still speak in full sentences." },
      { key: "tm-cool", title: "Easy cool-down", detail: "5 minutes" },
    ],
  },
  {
    title: "Posture routine",
    intro: "About 8 minutes.",
    items: [
      { key: "p-hipflexor", title: "Half-kneeling hip-flexor stretch", detail: "2 × 30 seconds per side" },
      { key: "p-bridge", title: "Glute bridges", detail: "2 × 12–15" },
      { key: "p-deadbug", title: "Dead bugs", detail: "2 × 8 per side" },
      { key: "p-birddog", title: "Bird dogs", detail: "2 × 8 per side" },
      { key: "p-tilt", title: "Gentle pelvic tilts", detail: "2 × 10" },
    ],
  },
];

export const RECOVERY_GROUPS: ChecklistGroup[] = [
  {
    title: "Recovery",
    items: [{ key: "rec-move", title: "Easy walk or gentle mobility", detail: "No hard workout required." }],
  },
];

export const POSTURE_DISCLAIMER =
  "These exercises may help strength and movement control, but they do not guarantee correction of anterior pelvic tilt. If you have persistent pain or a pronounced posture concern, consider an assessment by a physiotherapist.";

export const NUTRITION = {
  kcal: 2300,
  proteinMin: 110,
  proteinMax: 130,
  fatMin: 60,
  fatMax: 75,
  gainMin: 0.15,
  gainMax: 0.25,
  rows: [
    { target: "Calories", start: "Start around 2,300 kcal/day", use: "Track your weekly average weight and adjust after 2 weeks. Individual needs vary." },
    { target: "Protein", start: "110–130 g/day", use: "Spread across meals; roughly 25–35 g at main meals is a useful guide." },
    { target: "Fat", start: "60–75 g/day", use: "Include nuts, eggs, dairy, olive oil and other preferred sources." },
    { target: "Rate of gain", start: "About 0.15–0.25 kg/week", use: "A slow gain can help limit unnecessary fat gain." },
  ],
  meals: [
    { meal: "Breakfast", idea: "Oats with milk, banana and eggs." },
    { meal: "Lunch", idea: "Rice with chicken or fish, vegetables and yoghurt." },
    { meal: "Snack", idea: "Milk or yoghurt, fruit and nuts; protein powder is optional." },
    { meal: "Dinner", idea: "Rice or chapati with paneer, tofu, dal, chicken or fish." },
  ],
};

export const PROGRESSION: string[] = [
  "Weigh yourself in the morning under similar conditions and compare weekly averages rather than single readings.",
  "If weight has not increased for 2 consecutive weeks, add about 100–150 kcal/day.",
  "If your waist is increasing quickly over several weeks, consider reducing intake by about 100–150 kcal/day and review your rate of gain.",
  "When you can complete the top of the rep range with good form, increase the dumbbell weight slightly. Keep about 1–3 reps in reserve.",
  "If the available dumbbells become too light, especially for legs and back, use a harder safe variation or heavier weights when available.",
  "Aim for 7–9 hours of sleep. You do not need to train hard every day; recovery is part of progress.",
];

export const EXPECTATIONS: string[] = [
  "Moving from 61.5 kg to 70 kg is an increase of 8.5 kg. At a gradual pace, this may take roughly 9–15 months or longer, and not all gained weight will be muscle. Your actual timeline will depend on training consistency, food intake, recovery and genetics.",
  "After travel, your abdomen can look temporarily fuller because of food volume, bloating, water and glycogen changes. A week away from training does not erase your progress; return to your normal routine rather than trying to compensate with excessive exercise.",
];

export const FOOTER = "Personal training guide • Adjust to comfort, recovery and available equipment";

export const SESSION_ORDER: SessionId[] = ["upperA", "legsA", "upperB", "legsB", "cardio", "recovery"];
