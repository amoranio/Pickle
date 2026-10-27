import { beforeEach, it, expect, vi } from "vitest";
import {
  fresh,
  finish,
  readProgress,
  saveProgress,
  recommendation,
} from "./progress";
beforeEach(() => localStorage.clear());
it("awards rewards once and records mistakes and topic accuracy", () => {
  const results = [
    { id: "a", topic: "Spelling", first: true, solved: true },
    { id: "b", topic: "Spelling", first: false, solved: true },
  ];
  const p = finish(fresh(), "session", results, 1);
  expect(p.points).toBe(40);
  expect(p.topics.Spelling).toEqual({ correct: 1, total: 2 });
  expect(p.mistakes).toEqual(["b"]);
  expect(finish(p, "session", results, 1)).toEqual(p);
  const next = finish(p, "session2", [{ ...results[1], first: true }], 1);
  expect(next.mistakes).toEqual([]);
});
it("separates sprint records and recommends only from the selected level", () => {
  let p = fresh();
  const r = Array.from({ length: 10 }, (_, i) => ({
    id: String(i),
    topic: "Tables",
    first: true,
    solved: true,
  }));
  p = finish(p, "1", r, 1, "1-60");
  expect(recommendation(p, 1)).toBe(null);
  p = finish(p, "2", r, 1, "1-60");
  expect(recommendation(p, 1)).toBe(2);
  expect(p.best["1-30"]).toBeUndefined();
  expect(recommendation(p, 2)).toBe(null);
});
it("survives corrupt and unavailable storage", () => {
  localStorage.setItem("pickle-progress-v1", "{oops");
  expect(readProgress()).toEqual(fresh());
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(() => saveProgress(fresh())).not.toThrow();
  spy.mockRestore();
});
