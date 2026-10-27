import { describe, it, expect } from "vitest";
import {
  correct,
  generate,
  yearAt,
  shuffle,
  choicesFor,
  type Question,
} from "./engine";
import { literacy } from "./content";
const q = (answer: string, format: Question["format"] = "number") => ({
  ...generate("trail", 1, 0),
  answer,
  format,
});
describe("answer checking", () => {
  it("accepts exact decimal values and equivalent fractions", () => {
    expect(correct("0.30", q("0.3"))).toBe(true);
    expect(correct("2/4", q("1/2", "fraction"))).toBe(true);
    expect(correct("0.5", q("1/2", "fraction"))).toBe(true);
    expect(correct("1/0", q("1"))).toBe(false);
    expect(correct("", q("0"))).toBe(false);
    expect(correct("0.3001", q("0.3"))).toBe(false);
  });
  it("checks spelling and remainders", () => {
    expect(correct(" Ancient ", q("ancient", "text"))).toBe(true);
    expect(correct("12 remainder 3", q("12 r 3", "remainder"))).toBe(true);
    expect(correct("12.3", q("12 r 3", "remainder"))).toBe(false);
  });
});
describe("content and curriculum", () => {
  it("contains 60 unique literacy cards split evenly", () => {
    expect(literacy).toHaveLength(60);
    expect(new Set(literacy.map((q) => q.id)).size).toBe(60);
    for (const topic of ["Spelling", "Vocabulary"]) {
      expect(literacy.filter((q) => q.topic === topic)).toHaveLength(30);
      expect(
        literacy.filter((q) => q.topic === topic && q.year === 4),
      ).toHaveLength(15);
    }
  });
  it("mixes eight foundation and two extension questions", () => {
    expect(
      Array.from({ length: 10 }, (_, i) => yearAt(1, i)).filter((y) => y === 4),
    ).toHaveLength(8);
    expect(
      Array.from({ length: 10 }, (_, i) => yearAt(2, i)).filter((y) => y === 5),
    ).toHaveLength(8);
  });
  it("generates valid answerable questions across all modes and boundaries", () => {
    for (const mode of ["tables", "sprint", "trail", "missions"] as const)
      for (let level = 0; level < 4; level++)
        for (let i = 0; i < 40; i++)
          for (const r of [0, 0.5, 0.99999]) {
            const question = generate(mode, level, i, 0, () => r);
            expect(correct(question.answer, question)).toBe(true);
            expect(question.prompt).not.toMatch(/NaN|undefined/);
            expect(question.explanation).toContain(question.answer);
            expect(choicesFor(question)).toContain(question.answer);
          }
  });
  it("checks numerical results independently", () => {
    for (let i = 0; i < 40; i++) {
      const t = generate("tables", 1, i, 7, () => 0.3);
      expect(t.prompt).toContain("7");
      if (i % 3 === 0) expect(Number(t.answer)).toBe(35);
      else expect(Number(t.answer)).toBe(5);
    }
    expect(generate("missions", 1, 0, 0, () => 0).answer).toBe("10");
    expect(generate("trail", 1, 5, 0, () => 0).answer).toBe("2.0");
  });
  it("shuffles without losing content", () => {
    expect(shuffle([1, 2, 3, 4], () => 0.4).sort()).toEqual([1, 2, 3, 4]);
  });
});
