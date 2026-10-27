import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { App } from "./App";
import { generate } from "./engine";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  location.hash = "#maths/tables";
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("completes a ten-question game with keyboard-style form submission", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Start adventure/ }));
  for (let i = 0; i < 10; i++) {
    const s = JSON.parse(sessionStorage.getItem("pickle-session-v1")!);
    fireEvent.change(screen.getByLabelText("Your answer"), {
      target: { value: s.questions[s.index].answer },
    });
    fireEvent.submit(screen.getByLabelText("Your answer").closest("form")!);
    fireEvent.click(
      screen.getByRole("button", {
        name: i === 9 ? /See how you did/ : /Next question/,
      }),
    );
  }
  expect(screen.getByText("Look at you grow!")).toBeTruthy();
  expect(JSON.parse(localStorage.getItem("pickle-progress-v1")!).points).toBe(
    120,
  );
});
it("excludes hinted and retried answers from first-attempt mastery", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Start adventure/ }));
  fireEvent.click(screen.getByRole("button", { name: /Give me a hint/ }));
  const s = JSON.parse(sessionStorage.getItem("pickle-session-v1")!);
  fireEvent.change(screen.getByLabelText("Your answer"), {
    target: { value: s.questions[0].answer },
  });
  fireEvent.submit(screen.getByLabelText("Your answer").closest("form")!);
  expect(
    JSON.parse(sessionStorage.getItem("pickle-session-v1")!).results[0].first,
  ).toBe(false);
});
it("restores a session after refresh", () => {
  const view = render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Start adventure/ }));
  fireEvent.change(screen.getByLabelText("Your answer"), {
    target: { value: "123" },
  });
  view.unmount();
  render(<App />);
  expect((screen.getByLabelText("Your answer") as HTMLInputElement).value).toBe(
    "123",
  );
});
it("pauses the sprint when hidden and restarts on difficulty change", () => {
  vi.useFakeTimers();
  location.hash = "#maths/sprint";
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Start adventure/ }));
  act(() => vi.advanceTimersByTime(1000));
  const before = JSON.parse(
    sessionStorage.getItem("pickle-session-v1")!,
  ).remaining;
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: true,
  });
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  act(() => vi.advanceTimersByTime(5000));
  expect(
    JSON.parse(sessionStorage.getItem("pickle-session-v1")!).remaining,
  ).toBe(before);
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  fireEvent.click(screen.getByRole("button", { name: "Harder" }));
  expect(
    JSON.parse(sessionStorage.getItem("pickle-session-v1")!).remaining,
  ).toBe(60);
  act(() => vi.advanceTimersByTime(61000));
  expect(screen.getByText("Look at you grow!")).toBeTruthy();
});
it("finishes all modes from the last question and supports mistake review", () => {
  for (const mode of ["tables", "trail", "missions", "sprint"]) {
    location.hash = `#maths/${mode}`;
    const question = generate(mode as "tables", 1, 0);
    sessionStorage.setItem(
      "pickle-session-v1",
      JSON.stringify({
        id: `test-${mode}`,
        kind: `maths/${mode}`,
        level: 1,
        interaction: "type",
        duration: 60,
        remaining: 60,
        table: 0,
        questions: [question],
        index: 0,
        results: [],
        missed: [],
        done: false,
        used: false,
        revealed: false,
        solved: false,
        feedback: "",
        input: "",
      }),
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Skip for now/ }));
    expect(
      screen.getByRole("button", { name: "Practise these again" }),
    ).toBeTruthy();
    cleanup();
  }
});

it("completes full trail and mission sessions", () => {
  for (const [mode, length] of [
    ["trail", 10],
    ["missions", 5],
  ] as const) {
    location.hash = `#maths/${mode}`;
    sessionStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Start adventure/ }));
    for (let i = 0; i < length; i++) {
      const s = JSON.parse(sessionStorage.getItem("pickle-session-v1")!);
      const input = screen.getByLabelText(/Your answer/);
      fireEvent.change(input, {
        target: { value: s.questions[s.index].answer },
      });
      fireEvent.submit(input.closest("form")!);
      fireEvent.click(
        screen.getByRole("button", {
          name: i === length - 1 ? /See how you did/ : /Next question/,
        }),
      );
    }
    expect(
      screen.getByText(
        `You answered ${length} of ${length} correctly first time.`,
      ),
    ).toBeTruthy();
    cleanup();
  }
});
it("supports all three flash-card interactions", () => {
  for (const mode of ["choose", "type", "reveal"]) {
    location.hash = "#flash-cards/spelling";
    sessionStorage.clear();
    render(<App />);
    fireEvent.change(screen.getByLabelText("How do you want to practise?"), {
      target: { value: mode },
    });
    fireEvent.click(screen.getByRole("button", { name: /Start adventure/ }));
    for (let i = 0; i < 10; i++) {
      const s = JSON.parse(sessionStorage.getItem("pickle-session-v1")!),
        answer = s.questions[s.index].answer;
      if (mode === "choose")
        fireEvent.click(
          screen.getByRole("button", {
            name: new RegExp(`^[ABCD] ?${answer}$`),
          }),
        );
      if (mode === "type") {
        fireEvent.change(screen.getByLabelText("Your answer"), {
          target: { value: answer },
        });
        fireEvent.submit(screen.getByLabelText("Your answer").closest("form")!);
      }
      if (mode === "reveal") {
        fireEvent.click(screen.getByRole("button", { name: "Reveal answer" }));
        fireEvent.click(screen.getByRole("button", { name: "I knew it" }));
      }
      fireEvent.click(
        screen.getByRole("button", {
          name: i === 9 ? /See how you did/ : /Next question/,
        }),
      );
    }
    expect(
      screen.getByText("You answered 10 of 10 correctly first time."),
    ).toBeTruthy();
    cleanup();
  }
});
