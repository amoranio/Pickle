export type Progress = {
  version: 1;
  points: number;
  sessions: number;
  level: number;
  mastery: Record<string, number>;
  mistakes: string[];
  best: Record<string, number>;
  history: { level: number; accuracy: number }[];
  topics: Record<string, { correct: number; total: number }>;
  completed: string[];
};
export const fresh = (): Progress => ({
  version: 1,
  points: 0,
  sessions: 0,
  level: 1,
  mastery: {},
  mistakes: [],
  best: {},
  history: [],
  topics: {},
  completed: [],
});
const dictionary = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const count = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
export function readProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem("pickle-progress-v1") || "null");
    if (
      !p ||
      p.version !== 1 ||
      !count(p.points) ||
      !Number.isInteger(p.sessions) ||
      p.sessions < 0 ||
      !Number.isInteger(p.level) ||
      p.level < 0 ||
      p.level > 3 ||
      !Array.isArray(p.mistakes) ||
      !p.mistakes.every((x: unknown) => typeof x === "string") ||
      !Array.isArray(p.history) ||
      !p.history.every(
        (h: Record<string, unknown>) =>
          h && count(h.level) && count(h.accuracy) && Number(h.accuracy) <= 1,
      ) ||
      !Array.isArray(p.completed) ||
      !p.completed.every((x: unknown) => typeof x === "string") ||
      !dictionary(p.mastery) ||
      !Object.values(p.mastery).every(count) ||
      !dictionary(p.best) ||
      !Object.values(p.best).every(count) ||
      !dictionary(p.topics) ||
      !Object.values(p.topics).every(
        (t) => dictionary(t) && count(t.correct) && count(t.total),
      )
    )
      return fresh();
    return p;
  } catch {
    return fresh();
  }
}
export function saveProgress(p: Progress) {
  try {
    localStorage.setItem("pickle-progress-v1", JSON.stringify(p));
  } catch {
    /* Play remains available. */
  }
}
export function recommendation(p: Progress, level: number) {
  const h = p.history.filter((s) => s.level === level).slice(-2);
  if (h.length && h.at(-1)!.accuracy < 0.5 && level > 0) return level - 1;
  if (h.length === 2 && h.every((s) => s.accuracy >= 0.9) && level < 3)
    return level + 1;
  return null;
}
export type Result = {
  id: string;
  topic: string;
  first: boolean;
  solved: boolean;
};
export function finish(
  p: Progress,
  id: string,
  results: Result[],
  level: number,
  bestKey?: string,
) {
  if (p.completed.includes(id)) return p;
  const next = structuredClone(p);
  next.sessions++;
  next.completed = [...next.completed, id].slice(-100);
  next.points += results.filter((r) => r.solved).length * 10 + 20;
  next.history = [
    ...next.history,
    {
      level,
      accuracy: results.length
        ? results.filter((r) => r.first).length / results.length
        : 0,
    },
  ].slice(-20);
  for (const r of results) {
    next.mastery[r.id] = (next.mastery[r.id] || 0) + (r.first ? 1 : 0);
    const t = next.topics[r.topic] || { correct: 0, total: 0 };
    next.topics[r.topic] = {
      correct: t.correct + Number(r.first),
      total: t.total + 1,
    };
    next.mistakes = next.mistakes.filter((x) => x !== r.id);
    if (!r.first) next.mistakes.push(r.id);
  }
  if (bestKey)
    next.best[bestKey] = Math.max(
      next.best[bestKey] || 0,
      results.filter((r) => r.first).length,
    );
  return next;
}
