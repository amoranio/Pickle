import React, { useEffect, useRef, useState } from "react";
import {
  correct,
  generate,
  levels,
  shuffle,
  choicesFor,
  type Question,
  type Mode,
} from "./engine";
import { literacy } from "./content";
import {
  readProgress,
  saveProgress,
  finish,
  recommendation,
  type Progress,
  type Result,
} from "./progress";
import { Pickle } from "./Pickle";
import "./styles.css";
type Session = {
  id: string;
  kind: string;
  level: number;
  interaction: string;
  duration: number;
  remaining: number;
  table: number;
  questions: Question[];
  index: number;
  results: Result[];
  missed: Question[];
  done: boolean;
  used: boolean;
  revealed: boolean;
  solved: boolean;
  feedback: string;
  input: string;
};
const decks = [
  {
    id: "spelling",
    icon: "Aa",
    title: "Word wizard",
    tag: "SPELLING",
    description: "Crack the clues. Find the letters. Make tricky words stick.",
    colour: "orange",
  },
  {
    id: "vocabulary",
    icon: "!?",
    title: "Big word energy",
    tag: "VOCABULARY",
    description: "Discover brilliant words and what they really mean.",
    colour: "purple",
  },
  {
    id: "tables",
    icon: "×",
    title: "Table power",
    tag: "TIMES TABLES",
    description: "Small facts. Big brain power. Get your tables flying.",
    colour: "blue",
  },
  {
    id: "numbers",
    icon: "½",
    title: "Number explorer",
    tag: "NUMBER KNOW-HOW",
    description: "Fractions, decimals and clever little number puzzles.",
    colour: "green",
  },
];
const games = [
  {
    id: "tables",
    icon: "×",
    title: "Table Trainer",
    tag: "BUILD YOUR SKILLS",
    description: "Multiply, divide and find the mystery number.",
    colour: "blue",
  },
  {
    id: "sprint",
    icon: "ϟ",
    title: "Pickle Sprint",
    tag: "BEAT YOUR BEST",
    description: "A quick-fire burst of maths. How far can you go?",
    colour: "orange",
  },
  {
    id: "trail",
    icon: "↗",
    title: "Challenge Trail",
    tag: "MIX IT UP",
    description: "Ten questions. A little bit of everything.",
    colour: "green",
  },
  {
    id: "missions",
    icon: "?",
    title: "Puzzle Missions",
    tag: "THINK BIG",
    description: "Help Pickle solve five curious, multi-step missions.",
    colour: "purple",
  },
];
function route() {
  const parts = location.hash.slice(1).split("/");
  return {
    page: parts[0] === "maths" ? "maths" : "flash-cards",
    activity: parts[1] || "",
  };
}
function validQuestion(q: Question) {
  return (
    q &&
    typeof q.id === "string" &&
    typeof q.topic === "string" &&
    typeof q.prompt === "string" &&
    typeof q.answer === "string" &&
    typeof q.hint === "string" &&
    typeof q.explanation === "string" &&
    ["number", "text", "fraction", "remainder"].includes(q.format) &&
    (!q.choices ||
      (Array.isArray(q.choices) &&
        q.choices.every((c) => typeof c === "string")))
  );
}
function loadSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem("pickle-session-v1") || "null");
    return s &&
      typeof s.id === "string" &&
      Array.isArray(s.questions) &&
      s.questions.length &&
      s.questions.every(validQuestion) &&
      Array.isArray(s.results) &&
      s.results.every(
        (r: Result) =>
          r &&
          typeof r.id === "string" &&
          typeof r.topic === "string" &&
          typeof r.first === "boolean" &&
          typeof r.solved === "boolean",
      ) &&
      Array.isArray(s.missed) &&
      s.missed.every(validQuestion) &&
      Number.isInteger(s.level) &&
      s.level >= 0 &&
      s.level <= 3 &&
      typeof s.kind === "string" &&
      ["choose", "type", "reveal"].includes(s.interaction) &&
      [30, 60, 120].includes(s.duration) &&
      typeof s.input === "string" &&
      typeof s.done === "boolean" &&
      Number.isInteger(s.index) &&
      s.index >= 0 &&
      s.index < s.questions.length &&
      Number.isFinite(s.remaining)
      ? s
      : null;
  } catch {
    return null;
  }
}
export function App() {
  const [path, setPath] = useState(route),
    [progress, setProgress] = useState(readProgress),
    [session, setSession] = useState<Session | null>(loadSession),
    [level, setLevel] = useState(() => readProgress().level),
    [interaction, setInteraction] = useState("choose"),
    [duration, setDuration] = useState(60),
    [table, setTable] = useState(0),
    [paused, setPaused] = useState(document.hidden);
  const inputRef = useRef<HTMLInputElement>(null);
  const flash = path.page === "flash-cards";
  const activity = (flash ? decks : games).find((x) => x.id === path.activity);
  const active =
    session && session.kind === `${path.page}/${path.activity}`
      ? session
      : null;
  useEffect(() => {
    const update = () => setPath(route());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);
  useEffect(() => {
    try {
      sessionStorage.setItem("pickle-session-v1", JSON.stringify(session));
    } catch {}
  }, [session]);
  useEffect(() => {
    const update = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (!active || active.done || path.activity !== "sprint" || paused) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(),
        delta = (now - last) / 1000;
      last = now;
      setSession((s) =>
        s && !s.done
          ? {
              ...s,
              remaining: Math.max(0, s.remaining - delta),
              done: s.remaining - delta <= 0,
            }
          : s,
      );
    }, 100);
    return () => clearInterval(timer);
  }, [active?.id, active?.done, path.activity, paused]);
  useEffect(() => {
    if (!active?.done) return;
    setProgress((p) =>
      finish(
        p,
        active.id,
        active.results,
        active.level,
        path.activity === "sprint"
          ? `${active.level}-${active.duration}`
          : undefined,
      ),
    );
  }, [active?.done, active?.id]);
  useEffect(() => {
    inputRef.current?.focus();
  }, [active?.index]);
  function chooseLevel(value: number) {
    setLevel(value);
    setProgress((p) => ({ ...p, level: value }));
  }
  function start(override?: Question[], newLevel = level) {
    const mode = (
      path.activity === "numbers" ? "trail" : path.activity
    ) as Mode;
    let questions: Question[];
    if (override?.length) questions = shuffle(override);
    else if (flash && ["spelling", "vocabulary"].includes(path.activity)) {
      const pool = literacy.filter(
        (q) => q.topic.toLowerCase() === path.activity,
      );
      const weak = progress.mistakes;
      const ordered = (year: number) =>
        shuffle(pool.filter((q) => q.year === year)).sort(
          (a, b) => Number(weak.includes(b.id)) - Number(weak.includes(a.id)),
        );
      const foundation = ordered(4),
        extension = ordered(5);
      const count =
        newLevel === 0 ? 10 : newLevel === 1 ? 8 : newLevel === 2 ? 2 : 0;
      questions = shuffle([
        ...foundation.slice(0, count),
        ...extension.slice(0, 10 - count),
      ]);
    } else
      questions = Array.from(
        {
          length:
            path.activity === "sprint"
              ? 600
              : path.activity === "missions"
                ? 5
                : 10,
        },
        (_, i) => generate(mode, newLevel, i, table),
      );
    const previous = session?.questions[session.index]?.id;
    if (questions.length > 1 && questions[0].id === previous) {
      [questions[0], questions[1]] = [questions[1], questions[0]];
    }
    setSession({
      id: crypto.randomUUID(),
      kind: `${path.page}/${path.activity}`,
      level: newLevel,
      interaction: flash ? interaction : "type",
      duration,
      remaining: duration,
      table,
      questions,
      index: 0,
      results: [],
      missed: [],
      done: false,
      used: false,
      revealed: false,
      solved: false,
      feedback: "",
      input: "",
    });
  }
  function next(s: Session) {
    const done = s.index + 1 >= s.questions.length;
    return {
      ...s,
      index: done ? s.index : s.index + 1,
      done,
      input: "",
      feedback: "",
      used: false,
      revealed: false,
      solved: false,
    };
  }
  function submit(answer: string, self?: boolean) {
    setSession((s) => {
      if (
        !s ||
        s.done ||
        s.solved ||
        s.remaining <= 0 ||
        s.index !== active?.index
      )
        return s;
      const q = s.questions[s.index],
        ok = self ?? correct(answer, q),
        first = ok && !s.used && (!s.revealed || s.interaction === "reveal");
      const sprint = path.activity === "sprint";
      if (sprint) {
        const r = { id: q.id, topic: q.topic, first, solved: ok };
        return next({
          ...s,
          results: [...s.results, r],
          missed: ok ? s.missed : [...s.missed, q],
        });
      }
      if (!ok)
        return {
          ...s,
          used: true,
          feedback: "Not quite yet. Take a look at the method, then try again.",
          missed: s.missed.some((x) => x.id === q.id)
            ? s.missed
            : [...s.missed, q],
        };
      return {
        ...s,
        solved: true,
        feedback: first
          ? "Brilliant thinking!"
          : "You got there. That’s how we learn.",
        results: [
          ...s.results,
          { id: q.id, topic: q.topic, first, solved: true },
        ],
        missed: first
          ? s.missed
          : s.missed.some((x) => x.id === q.id)
            ? s.missed
            : [...s.missed, q],
      };
    });
  }
  function skip() {
    setSession((s) => {
      if (!s || s.done || s.index !== active?.index) return s;
      const q = s.questions[s.index];
      return next({
        ...s,
        results: [
          ...s.results,
          { id: q.id, topic: q.topic, first: false, solved: false },
        ],
        missed: s.missed.some((x) => x.id === q.id)
          ? s.missed
          : [...s.missed, q],
      });
    });
  }
  function changeDifficulty(delta: number) {
    if (!active) return;
    const value = Math.max(0, Math.min(3, active.level + delta));
    chooseLevel(value);
    if (path.activity === "sprint") {
      start(undefined, value);
      return;
    }
    setSession((s) => {
      if (!s) return s;
      const mode = (
        path.activity === "numbers" ? "trail" : path.activity
      ) as Mode;
      return {
        ...s,
        level: value,
        questions: s.questions.map((q, i) => {
          if (i <= s.index) return q;
          if (flash && ["spelling", "vocabulary"].includes(path.activity)) {
            const candidates = literacy.filter(
              (x) =>
                x.topic.toLowerCase() === path.activity &&
                x.year === yearAtLocal(value, i),
            );
            return candidates[i % candidates.length];
          }
          return generate(mode, value, i, s.table);
        }),
      };
    });
  }
  const q = active?.questions[active.index];
  const options = React.useMemo(() => (q ? choicesFor(q) : []), [q?.id]);
  const rec = recommendation(progress, level);
  return (
    <>
      <header className="header">
        <a className="brand" href="#flash-cards">
          <span className="brand-mark">
            p<span>•</span>
          </span>
          pickle<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          <a
            className={flash ? "selected" : ""}
            aria-current={flash ? "page" : undefined}
            href="#flash-cards"
          >
            <span>▣</span> Flash Cards
          </a>
          <a
            className={!flash ? "selected" : ""}
            aria-current={!flash ? "page" : undefined}
            href="#maths"
          >
            <span>✳</span> Maths
          </a>
        </nav>
        <div className="points">
          <span>✦</span> {progress.points} <small>brain points</small>
        </div>
      </header>
      <main>
        {!activity ? (
          <>
            <section className={`hero ${flash ? "" : "math-hero"}`}>
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="live-dot" /> LITTLE DINOSAUR. BIG IDEAS.
                </div>
                <h1>
                  {flash ? (
                    <>
                      A little practice.
                      <br />A <em>big adventure.</em>
                    </>
                  ) : (
                    <>
                      Ready, set.
                      <br />
                      <em>Brain power!</em>
                    </>
                  )}
                </h1>
                <p>
                  {flash
                    ? "Meet your next “I’ve got this!” moment. Pick a pack, stretch your brain and learn something brilliant with Pickle."
                    : "Quick thinking, curious puzzles and a dinosaur on your team. Choose your challenge and make maths your superpower."}
                </p>
                <a
                  className="button primary"
                  href={`#${path.page}/${flash ? "spelling" : "trail"}`}
                >
                  {flash
                    ? "Let’s get those ideas growing"
                    : "Let’s take the challenge"}{" "}
                  <span>↗</span>
                </a>
                <div className="hero-note">
                  <span>✧</span> Your pace. Your challenge. Your adventure.
                </div>
              </div>
              <div className="hero-art">
                <div className="art-circle" />
                <span className="float-label top-label">
                  {flash ? "YOU’VE GOT THIS!" : "LET’S SOLVE IT!"}
                </span>
                <Pickle />
                <span className="float-label name-label">
                  Hi, I’m Pickle! <span>↗</span>
                </span>
                <span className="doodle doodle-one">✳</span>
                <span className="doodle doodle-two">✦</span>
              </div>
            </section>
            <section className="activities">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">
                    {flash
                      ? "SMALL CARDS. GREAT DISCOVERIES."
                      : "A NEW CHALLENGE AWAITS."}
                  </div>
                  <h2>
                    {flash
                      ? "Pick your brain adventure"
                      : "How will you play today?"}
                  </h2>
                </div>
                <span className="pill">
                  {flash ? "4 packs to explore" : "4 ways to level up"}{" "}
                  <span>↙</span>
                </span>
              </div>
              <div className="card-grid">
                {(flash ? decks : games).map((d, i) => (
                  <a
                    className={`activity-card ${d.colour}`}
                    href={`#${path.page}/${d.id}`}
                    key={d.id}
                  >
                    <div className="card-top">
                      <span className="card-icon">{d.icon}</span>
                      <span className="card-number">0{i + 1}</span>
                    </div>
                    <div className="eyebrow">{d.tag}</div>
                    <h3>{d.title}</h3>
                    <p>{d.description}</p>
                    <div className="card-bottom">
                      {flash ? "Explore pack" : "Let’s play"}
                      <span>↗</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
            <section className="progress-strip">
              <div className="strip-icon">✦</div>
              <div>
                <h3>Little steps. Look how far you’ll go.</h3>
                <p>
                  {progress.sessions
                    ? `${progress.sessions} adventures completed · ${Object.values(progress.mastery).filter((n) => n >= 2).length} cards mastered`
                    : "Every curious question is a step forward. Your progress stays right here."}
                </p>
              </div>
              <div className="badges">
                {progress.sessions >= 1 ? (
                  <span>★ First adventure</span>
                ) : (
                  <span>☆ Your first badge awaits</span>
                )}
                {progress.points >= 100 && <span>★ 100-point explorer</span>}
                {progress.sessions >= 10 && <span>★ Trailblazer</span>}
              </div>
            </section>
          </>
        ) : (
          <>
            <a className="back" href={`#${path.page}`}>
              ← All {flash ? "card packs" : "maths games"}
            </a>
            <div className="activity-heading">
              <div>
                <div className="eyebrow">{activity.tag}</div>
                <h1>
                  {activity.title}
                  <span className="green-dot">.</span>
                </h1>
              </div>
              <span className={`mini-icon ${activity.colour}`}>
                {activity.icon}
              </span>
            </div>
            {!active ? (
              <section className="setup">
                <div>
                  <h2>Make it your adventure.</h2>
                  <p>{activity.description} Choose your challenge below.</p>
                  <label htmlFor="level">Your challenge</label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => chooseLevel(Number(e.target.value))}
                  >
                    {levels.map((l, i) => (
                      <option value={i} key={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <p className="help">
                    {level === 1
                      ? "Mostly Year 4, with a taste of Year 5."
                      : level === 3
                        ? "Includes introductory Year 6 challenges."
                        : "A mix of practice and new discoveries."}
                  </p>
                  {flash && (
                    <>
                      <label htmlFor="interaction">
                        How do you want to practise?
                      </label>
                      <select
                        id="interaction"
                        value={interaction}
                        onChange={(e) => setInteraction(e.target.value)}
                      >
                        <option value="choose">Choose the answer</option>
                        <option value="type">Type the answer</option>
                        <option value="reveal">Reveal and self-rate</option>
                      </select>
                    </>
                  )}
                  {path.activity === "tables" && (
                    <>
                      <label htmlFor="table">Choose your tables</label>
                      <select
                        id="table"
                        value={table}
                        onChange={(e) => setTable(Number(e.target.value))}
                      >
                        <option value={0}>Mix all tables</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1} times table
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  {path.activity === "sprint" && (
                    <>
                      <label htmlFor="duration">Round length</label>
                      <select
                        id="duration"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                      >
                        {[30, 60, 120].map((n) => (
                          <option key={n} value={n}>
                            {n} seconds
                          </option>
                        ))}
                      </select>
                      <p className="help">
                        Personal best:{" "}
                        {progress.best[`${level}-${duration}`] || 0} correct.
                        Changing difficulty restarts the timer.
                      </p>
                    </>
                  )}
                  {rec !== null && (
                    <div className="suggestion">
                      Fancy trying {levels[rec]}?{" "}
                      <button onClick={() => chooseLevel(rec)}>
                        Try this level
                      </button>
                    </div>
                  )}
                  <button
                    className="button primary start"
                    onClick={() => start()}
                  >
                    Start adventure <span>→</span>
                  </button>
                </div>
                <div className="setup-art">
                  <Pickle pose="think" />
                  <p>No rush. Big ideas take a little thinking.</p>
                </div>
              </section>
            ) : active.done ? (
              <section className="results">
                <div className="results-copy">
                  <div className="eyebrow">ADVENTURE COMPLETE</div>
                  <h2>Look at you grow!</h2>
                  <p>
                    You answered {active.results.filter((r) => r.first).length}{" "}
                    of {active.results.length} correctly first time.
                  </p>
                  <div className="score-box">
                    +{active.results.filter((r) => r.solved).length * 10 + 20}
                    <span>brain points</span>
                  </div>
                  {path.activity === "sprint" && (
                    <p>
                      Your best at this level:{" "}
                      {progress.best[`${active.level}-${active.duration}`] || 0}{" "}
                      correct
                    </p>
                  )}
                  <div className="result-actions">
                    <button className="button primary" onClick={() => start()}>
                      Play again ↗
                    </button>
                    {active.missed.length > 0 && (
                      <button
                        className="button"
                        onClick={() => {
                          const review = active.missed;
                          setSession({
                            ...active,
                            id: crypto.randomUUID(),
                            kind: active.kind,
                            interaction: "type",
                            questions: review,
                            index: 0,
                            results: [],
                            missed: [],
                            done: false,
                            used: false,
                            revealed: false,
                            solved: false,
                            feedback: "",
                            input: "",
                            remaining: active.duration,
                          });
                          if (path.activity === "sprint")
                            location.hash = `#maths/trail`;
                          if (path.activity === "sprint")
                            setSession((s) =>
                              s ? { ...s, kind: "maths/trail" } : s,
                            );
                        }}
                      >
                        Practise these again
                      </button>
                    )}
                    <button
                      className="text-button"
                      onClick={() => setSession(null)}
                    >
                      Change settings
                    </button>
                  </div>
                  {active.missed.length > 0 && (
                    <div className="review">
                      <h3>A little something to practise</h3>
                      {active.missed.slice(0, 30).map((m, i) => (
                        <details key={`${m.id}-${i}`}>
                          <summary>{m.prompt}</summary>
                          <p>{m.explanation}</p>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
                <Pickle pose="celebrate" />
              </section>
            ) : (
              q && (
                <section className="play">
                  <div className="game-bar">
                    <span>
                      {path.activity === "sprint" ? (
                        <>
                          <strong>{Math.ceil(active.remaining)}s</strong>{" "}
                          {paused ? "Paused" : "on the clock"}
                        </>
                      ) : (
                        <>
                          Question <strong>{active.index + 1}</strong> /{" "}
                          {active.questions.length}
                        </>
                      )}
                    </span>
                    <span>{levels[active.level]}</span>
                    <button
                      className="text-button"
                      onClick={() => {
                        location.hash = `#${path.page}`;
                      }}
                    >
                      Finish later
                    </button>
                  </div>
                  <div className="meter">
                    <span
                      style={{
                        width: `${path.activity === "sprint" ? (100 * active.remaining) / active.duration : (100 * active.index) / active.questions.length}%`,
                      }}
                    />
                  </div>
                  <div className="play-layout">
                    <div className="question-card">
                      <div className="eyebrow">
                        {q.topic} ·{" "}
                        {q.year >= 6 ? "YEAR 6 STRETCH" : `YEAR ${q.year}`}
                      </div>
                      <h2
                        className={q.prompt.length > 60 ? "long-question" : ""}
                      >
                        {q.prompt}
                      </h2>
                      {active.interaction === "reveal" ? (
                        <>
                          {!active.revealed ? (
                            <button
                              className="button primary"
                              onClick={() =>
                                setSession((s) =>
                                  s ? { ...s, revealed: true } : s,
                                )
                              }
                            >
                              Reveal answer
                            </button>
                          ) : (
                            <>
                              <div className="revealed">{q.answer}</div>
                              {!active.solved && (
                                <div className="answer-actions">
                                  <button
                                    className="button primary"
                                    onClick={() => submit(q.answer, true)}
                                  >
                                    I knew it
                                  </button>
                                  <button className="button" onClick={skip}>
                                    Practise again
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      ) : active.interaction === "choose" ? (
                        <div className="answers">
                          {options.map((v, i) => (
                            <button
                              key={`${v}-${i}`}
                              disabled={active.solved}
                              onClick={() => submit(v)}
                            >
                              <span>{String.fromCharCode(65 + i)}</span>
                              {v}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (active.input.trim()) submit(active.input);
                          }}
                        >
                          <label htmlFor="answer">
                            Your answer
                            {q.format === "fraction"
                              ? " (for example, 1/2)"
                              : q.format === "remainder"
                                ? " (for example, 12 r 3)"
                                : ""}
                          </label>
                          <div className="answer-input">
                            <input
                              ref={inputRef}
                              id="answer"
                              value={active.input}
                              autoComplete="off"
                              inputMode={
                                q.format === "number" ? "decimal" : "text"
                              }
                              disabled={active.solved}
                              onChange={(e) =>
                                setSession((s) =>
                                  s ? { ...s, input: e.target.value } : s,
                                )
                              }
                            />
                            <button
                              className="button primary"
                              disabled={active.solved || !active.input.trim()}
                            >
                              Check <span>→</span>
                            </button>
                          </div>
                        </form>
                      )}
                      {active.feedback && (
                        <div
                          className={`feedback ${active.solved ? "success" : ""}`}
                          role="status"
                        >
                          <strong>{active.feedback}</strong>
                          {active.used && <p>{q.explanation}</p>}
                        </div>
                      )}
                      {active.revealed && active.interaction !== "reveal" && (
                        <p className="hint">{q.hint}</p>
                      )}
                      <div className="question-actions">
                        {active.solved ? (
                          <button
                            className="button primary"
                            onClick={() =>
                              setSession((s) =>
                                s && s.index === active.index && s.solved
                                  ? next(s)
                                  : s,
                              )
                            }
                          >
                            {active.index === active.questions.length - 1
                              ? "See how you did"
                              : "Next question"}{" "}
                            →
                          </button>
                        ) : (
                          <>
                            {path.activity !== "sprint" &&
                              active.interaction !== "reveal" && (
                                <button
                                  className="text-button"
                                  onClick={() =>
                                    setSession((s) =>
                                      s
                                        ? { ...s, revealed: true, used: true }
                                        : s,
                                    )
                                  }
                                >
                                  ✧ Give me a hint
                                </button>
                              )}
                            <button className="text-button" onClick={skip}>
                              Skip for now →
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <aside>
                      <Pickle pose={active.solved ? "celebrate" : "think"} />
                      <div className="speech">
                        {active.solved
                          ? "That’s some brilliant brain power!"
                          : "One little step at a time. You’ve got this."}
                      </div>
                      <div className="difficulty">
                        <span>How’s the challenge?</span>
                        <div>
                          <button
                            disabled={active.level === 0}
                            onClick={() => changeDifficulty(-1)}
                          >
                            Easier
                          </button>
                          <span>Just right</span>
                          <button
                            disabled={active.level === 3}
                            onClick={() => changeDifficulty(1)}
                          >
                            Harder
                          </button>
                        </div>
                        <small>
                          {path.activity === "sprint"
                            ? "Changing level starts a fresh sprint."
                            : "Changes start with the next question."}
                        </small>
                      </div>
                    </aside>
                  </div>
                </section>
              )
            )}
          </>
        )}
      </main>
      <footer>
        <a className="footer-brand" href="#flash-cards">
          pickle.
        </a>
        <span>A little curiosity goes a long way.</span>
        <span>
          Made for growing minds <span className="heart">♥</span>
        </span>
      </footer>
    </>
  );
}
function yearAtLocal(level: number, i: number) {
  return level <= 0
    ? 4
    : level === 1
      ? i % 5 === 4
        ? 5
        : 4
      : level === 2
        ? i % 5 === 4
          ? 4
          : 5
        : 5;
}
