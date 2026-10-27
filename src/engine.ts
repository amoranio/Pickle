export const levels = [
  "Warm-up",
  "Year 4 Mix",
  "Year 5 Mix",
  "Stretch",
] as const;
export type Question = {
  id: string;
  topic: string;
  year: number;
  prompt: string;
  answer: string;
  format: "number" | "text" | "fraction" | "remainder";
  choices?: string[];
  hint: string;
  explanation: string;
};
export type Mode = "tables" | "sprint" | "trail" | "missions";
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function rational(raw: string): [number, number] | null {
  const s = raw.trim();
  if (/^[+-]?\d+\s*\/\s*\d+$/.test(s)) {
    const [a, b] = s.split("/").map(Number);
    return b ? [a, b] : null;
  }
  if (/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) {
    const places = (s.split(".")[1] || "").length;
    return [Math.round(Number(s) * 10 ** places), 10 ** places];
  }
  return null;
}
export function correct(input: string, q: Question) {
  if (q.format === "text")
    return input.trim().toLowerCase() === q.answer.toLowerCase();
  if (q.format === "remainder")
    return (
      input.toLowerCase().replace(/\s+/g, "").replace("remainder", "r") ===
      q.answer.replace(/\s+/g, "")
    );
  const a = rational(input),
    b = rational(q.answer);
  return !!a && !!b && Math.abs(a[0] * b[1] - b[0] * a[1]) < 1e-7;
}
export function yearAt(level: number, index: number) {
  return level === 0
    ? 3
    : level === 1
      ? index % 5 === 4
        ? 5
        : 4
      : level === 2
        ? index % 5 === 4
          ? 4
          : 5
        : 6;
}
export function generate(
  mode: Mode,
  level: number,
  index: number,
  table = 0,
  random = Math.random,
): Question {
  const n = (lo: number, hi: number) =>
    lo + Math.floor(random() * (hi - lo + 1));
  const year = yearAt(level, index);
  const a = n(2, level === 0 ? 6 : 12),
    b = table || (level === 0 ? [2, 5, 10][n(0, 2)] : n(2, 12));
  let prompt = "",
    answer = "",
    hint = "",
    topic = "",
    format: Question["format"] = "number";
  const set = (
    p: string,
    v: string | number,
    h: string,
    t: string,
    f: Question["format"] = "number",
  ) => {
    prompt = p;
    answer = String(v);
    hint = h;
    topic = t;
    format = f;
  };
  if (mode === "tables") {
    switch (index % 3) {
      case 0:
        set(
          `${a} × ${b}`,
          a * b,
          `Think of ${a} groups of ${b}.`,
          "Times tables",
        );
        break;
      case 1:
        set(
          `${a * b} ÷ ${b}`,
          a,
          `Which number multiplied by ${b} makes ${a * b}?`,
          "Division facts",
        );
        break;
      default:
        set(
          `□ × ${b} = ${a * b}`,
          a,
          `Divide ${a * b} by ${b}.`,
          "Missing numbers",
        );
    }
  } else if (mode === "sprint") {
    const x = n(2, year === 3 ? 20 : year === 4 ? 50 : 100),
      y = n(2, 20);
    switch (index % 4) {
      case 0:
        set(
          `${a} × ${b}`,
          a * b,
          "Split one factor into easier parts.",
          "Times tables",
        );
        break;
      case 1:
        set(`${x} + ${y}`, x + y, "Add the tens, then the ones.", "Addition");
        break;
      case 2:
        set(`${x + y} − ${y}`, x, "Use addition to check.", "Subtraction");
        break;
      default:
        set(
          `${a * b} ÷ ${b}`,
          a,
          "Use the matching multiplication fact.",
          "Division",
        );
    }
  } else if (mode === "missions") {
    const packs = n(3, year >= 5 ? 15 : 8),
      per = n(4, 12),
      used = n(2, 10);
    switch (index % 5) {
      case 0:
        set(
          `Pickle packs ${packs} boxes with ${per} berries each. He eats ${used} berries. How many are left?`,
          packs * per - used,
          `First multiply ${packs} × ${per}, then subtract ${used}.`,
          "Multi-step problems",
        );
        break;
      case 1:
        set(
          `A trail starts at ${a}. Each step adds ${b}. What is the number after 4 steps?`,
          a + 4 * b,
          `Add ${b} four times to ${a}.`,
          "Number patterns",
        );
        break;
      case 2:
        set(
          `Pickle buys ${packs} maps for £${per} each. He pays £${packs * per + 20}. How much change does he get, in pounds?`,
          20,
          `Find the total price, then subtract it from £${packs * per + 20}.`,
          "Money problems",
        );
        break;
      case 3:
        set(
          `Pickle shares ${a * b + b} stones equally between ${b} nests. Each nest already has 3 stones. How many stones are now in each nest?`,
          a + 4,
          `Divide ${a * b + b} by ${b}, then add 3.`,
          "Multi-step problems",
        );
        break;
      default:
        set(
          `A mystery number multiplied by ${b}, then increased by ${a}, makes ${a * b + a}. What is the number?`,
          a,
          `Subtract ${a}, then divide by ${b}.`,
          "Missing numbers",
        );
    }
  } else {
    const kind = index % 10;
    const x = n(
        year >= 5 ? 10000 : 100,
        year >= 5 ? 99999 : year === 3 ? 999 : 9999,
      ),
      y = n(100, 999);
    switch (kind) {
      case 0:
        set(
          `${x} + ${y}`,
          x + y,
          "Line up the place values and add each column.",
          "Addition",
        );
        break;
      case 1:
        set(
          `${x + y} − ${y}`,
          x,
          "Subtract each column, exchanging where needed.",
          "Subtraction",
        );
        break;
      case 2: {
        const m = n(12, year >= 5 ? 9999 : 999),
          f = n(2, year >= 5 ? 25 : 9);
        set(
          `${m} × ${f}`,
          m * f,
          `Split ${m} into place-value parts, multiply each by ${f}, then add.`,
          "Multiplication",
        );
        break;
      }
      case 3: {
        const d = n(2, 9),
          quot = n(12, year >= 5 ? 999 : 99),
          rem = year >= 5 ? n(1, d - 1) : 0;
        set(
          `${quot * d + rem} ÷ ${d}${rem ? " — give a remainder" : ""}`,
          rem ? `${quot} r ${rem}` : quot,
          `Find the largest multiple of ${d} that fits. Any left over is the remainder.`,
          "Division",
          rem ? "remainder" : "number",
        );
        break;
      }
      case 4: {
        const den = year >= 5 ? 8 : 6,
          num = n(1, den - 2);
        set(
          `${num}/${den} + 1/${den}`,
          `${num + 1}/${den}`,
          "The denominators match: add the numerators.",
          "Fractions",
          "fraction",
        );
        break;
      }
      case 5: {
        const p = n(10, 99),
          q = n(10, 99);
        set(
          `${(p / 10).toFixed(1)} + ${(q / 10).toFixed(1)}`,
          ((p + q) / 10).toFixed(1),
          "Add in tenths, then convert back.",
          "Decimals",
        );
        break;
      }
      case 6:
        set(
          `What is ${year >= 5 ? "25%" : "half"} of ${a * 4}?`,
          year >= 5 ? a : a * 2,
          year >= 5 ? "25% is one quarter. Divide by 4." : "Divide by 2.",
          "Fractions and percentages",
        );
        break;
      case 7: {
        const variant = n(0, 2);
        if (year <= 4)
          set(
            `Find the missing factor: ${a} × □ = ${a * b}`,
            b,
            `Divide ${a * b} by ${a}.`,
            "Factor pairs",
          );
        else if (variant === 0)
          set(
            `What is the smallest prime factor of ${a * 2}?`,
            2,
            "A prime has exactly two factors. This number is even.",
            "Prime numbers",
          );
        else if (variant === 1)
          set(
            `What is the largest common factor of ${a * 2} and ${a * 3}?`,
            a,
            `List the factors of both numbers. Look for the largest shared factor.`,
            "Factors",
          );
        else
          set(
            `What is ${a} squared?`,
            a * a,
            `Multiply ${a} by itself.`,
            "Square numbers",
          );
        break;
      }
      case 8:
        set(
          `□ + ${b * 10} = ${a * 100 + b * 10}`,
          a * 100,
          `Subtract ${b * 10} from both sides.`,
          "Missing numbers",
        );
        break;
      default:
        set(
          year >= 6 ? `(${a} + ${b}) × 3` : `${a * 10} × 10`,
          year >= 6 ? (a + b) * 3 : a * 100,
          year >= 6
            ? "Work out the brackets first."
            : "Each digit moves one place to the left.",
          "Place value",
        );
    }
  }
  return {
    id: `${mode}-${level}-${index}-${prompt}`,
    year,
    topic,
    prompt,
    answer,
    format,
    hint,
    explanation: `${hint} The answer is ${answer}.`,
  };
}
export function choicesFor(q: Question) {
  if (q.choices) return shuffle(q.choices);
  const v = rational(q.answer);
  if (!v) return shuffle([q.answer, "1", "2", "3"]);
  const value = v[0] / v[1];
  return shuffle([
    q.answer,
    ...[1, 2, 3].map((d) => String(Number((value + d).toFixed(3)))),
  ]);
}
