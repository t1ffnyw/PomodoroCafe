import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/account/api";
import { DEFAULT_APP_PREFERENCES } from "@/types/preferences";
import { DEFAULT_TIMER_CONFIG } from "@/types/timer";
import type { DayProgress } from "@/types/progress";
import type { Todo } from "@/types/todo";
import { useAccountSync } from "./useAccountSync";

vi.mock("@/lib/account/api");

type Params = Parameters<typeof useAccountSync>[0];

const SETTINGS_AT_KEY = "cafe-pomodoro-settings-updated-at";
const SLOW = { timeout: 3_000 };

const hours = () => Array<number>(24).fill(0);
const day = (focusMinutes: number, updatedAt?: number): DayProgress => ({
  focusMinutes,
  completedSessions: 0,
  hourlyMinutes: hours(),
  hourlyCompletions: hours(),
  ...(updatedAt === undefined ? {} : { updatedAt }),
});
const todo = (id: string, text: string, updatedAt: number, extra: Partial<Todo> = {}): Todo => ({
  id,
  text,
  completed: false,
  createdAt: 100,
  updatedAt,
  ...extra,
});
const remoteTodo = (t: Todo, position: number) => ({ ...t, position, deleted: t.deleted === true });

function setup(overrides: Partial<Params> = {}) {
  const replaceAll = vi.fn();
  const apply = vi.fn();
  const replaceDays = vi.fn();
  const base: Params = {
    signedIn: true,
    todos: { all: [], replaceAll },
    settings: {
      timerConfig: DEFAULT_TIMER_CONFIG,
      preferences: DEFAULT_APP_PREFERENCES,
      themeId: "matcha",
      apply,
    },
    progress: { days: {}, replaceDays },
    ...overrides,
  };
  const hook = renderHook((props: Params) => useAccountSync(props), { initialProps: base });
  return { ...hook, base, replaceAll, apply, replaceDays };
}

const sentTodos = () => vi.mocked(api.putTodos).mock.calls.flatMap(([todos]) => todos);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getTodos).mockResolvedValue([]);
  vi.mocked(api.getSettings).mockResolvedValue(null);
  vi.mocked(api.getProgress).mockResolvedValue({});
  vi.mocked(api.putTodos).mockResolvedValue(undefined);
  vi.mocked(api.putSettings).mockResolvedValue(undefined);
  vi.mocked(api.putProgress).mockResolvedValue(undefined);
});

describe("signed out", () => {
  it("never talks to the server", async () => {
    const { result } = setup({ signedIn: false });
    await sleep(100);

    expect(result.current).toBe("idle");
    expect(api.getTodos).not.toHaveBeenCalled();
    expect(api.putTodos).not.toHaveBeenCalled();
  });
});

describe("restoring data after local storage was cleared", () => {
  it("applies the account's todos, settings and stats", async () => {
    vi.mocked(api.getTodos).mockResolvedValue([remoteTodo(todo("s1", "from server", 1_000), 0)]);
    vi.mocked(api.getSettings).mockResolvedValue({
      timerConfig: { focusMinutes: 50 },
      preferences: { chimeEnabled: false },
      theme: "coffee",
      updatedAt: 5_000,
    });
    vi.mocked(api.getProgress).mockResolvedValue({ "2026-11-05": day(42, 5_000) });

    const { result, replaceAll, apply, replaceDays } = setup();
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    expect(replaceAll).toHaveBeenCalledWith([expect.objectContaining({ id: "s1", text: "from server" })]);
    expect(apply).toHaveBeenCalledWith({
      timerConfig: { ...DEFAULT_TIMER_CONFIG, focusMinutes: 50 },
      preferences: { ...DEFAULT_APP_PREFERENCES, chimeEnabled: false },
      themeId: "coffee",
    });
    expect(replaceDays).toHaveBeenCalledWith({
      "2026-11-05": expect.objectContaining({ focusMinutes: 42 }),
    });
    expect(localStorage.getItem(SETTINGS_AT_KEY)).toBe("5000");
  });

  it("does not echo the data it just received back to the server", async () => {
    vi.mocked(api.getTodos).mockResolvedValue([remoteTodo(todo("s1", "from server", 1_000), 0)]);
    vi.mocked(api.getProgress).mockResolvedValue({ "2026-11-05": day(42, 5_000) });

    // The hook's owner applies the merge result, so feed it back like the app would.
    const { result, rerender, base } = setup();
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);
    rerender({
      ...base,
      todos: { ...base.todos, all: [todo("s1", "from server", 1_000)] },
      progress: { ...base.progress, days: { "2026-11-05": day(42, 5_000) } },
    });
    await sleep(1_200);

    expect(api.putTodos).not.toHaveBeenCalled();
    expect(api.putProgress).not.toHaveBeenCalled();
  });
});

describe("first sign-in with data already on this device", () => {
  it("uploads local todos, customised settings and stats to the empty account", async () => {
    localStorage.removeItem(SETTINGS_AT_KEY); // never synced, so no timestamp yet
    const local = [todo("a", "first", 1_000), todo("b", "second", 2_000)];
    const before = Date.now();

    const { replaceAll, result } = setup({
      todos: { all: local, replaceAll: vi.fn() },
      settings: {
        timerConfig: { ...DEFAULT_TIMER_CONFIG, focusMinutes: 30 },
        preferences: DEFAULT_APP_PREFERENCES,
        themeId: "coffee",
        apply: vi.fn(),
      },
      progress: { days: { "2026-11-04": day(20) }, replaceDays: vi.fn() }, // legacy: no updatedAt
    });
    void replaceAll;
    await waitFor(() => expect(api.putProgress).toHaveBeenCalled(), SLOW);
    await waitFor(() => expect(api.putSettings).toHaveBeenCalled(), SLOW);
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    expect(sentTodos().map((t) => [t.id, t.position])).toEqual([
      ["a", 0],
      ["b", 1],
    ]);
    const settings = vi.mocked(api.putSettings).mock.calls[0]![0];
    expect(settings).toMatchObject({ theme: "coffee", timerConfig: { focusMinutes: 30 } });
    expect(settings.updatedAt).toBeGreaterThanOrEqual(before);
    expect(vi.mocked(api.putProgress).mock.calls[0]![0]).toEqual({
      "2026-11-04": expect.objectContaining({ focusMinutes: 20, updatedAt: 1 }),
    });
  });

  it("does not upload untouched default settings", async () => {
    setup();
    await sleep(1_200);

    expect(api.putSettings).not.toHaveBeenCalled();
  });

  it("treats settings customised before accounts existed as newer than older server settings", async () => {
    vi.mocked(api.getSettings).mockResolvedValue({
      timerConfig: { focusMinutes: 99 },
      preferences: null,
      theme: "matcha",
      updatedAt: 5_000,
    });

    const { apply, result } = setup({
      settings: {
        timerConfig: { ...DEFAULT_TIMER_CONFIG, focusMinutes: 30 },
        preferences: DEFAULT_APP_PREFERENCES,
        themeId: "matcha",
        apply: vi.fn(),
      },
    });
    await waitFor(() => expect(api.putSettings).toHaveBeenCalled(), SLOW);
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    expect(apply).not.toHaveBeenCalled();
    expect(vi.mocked(api.putSettings).mock.calls[0]![0].timerConfig.focusMinutes).toBe(30);
  });
});

describe("merging todos", () => {
  it("keeps the newer version of each todo and sends only this device's winners", async () => {
    vi.mocked(api.getTodos).mockResolvedValue([
      remoteTodo(todo("t1", "server old", 1_000), 0),
      remoteTodo(todo("t2", "server new", 3_000), 1),
      remoteTodo(todo("t3", "server only", 1_500), 2),
    ]);
    const replaceAll = vi.fn();

    const { result, rerender, base } = setup({
      todos: {
        all: [todo("t1", "local new", 2_000), todo("t2", "local old", 1_000)],
        replaceAll,
      },
    });
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    const merged = replaceAll.mock.calls[0]![0] as Todo[];
    expect(merged.map((t) => [t.id, t.text])).toEqual([
      ["t1", "local new"],
      ["t2", "server new"],
      ["t3", "server only"],
    ]);

    // The app stores the merge result; feed it back as the new todo state.
    rerender({ ...base, todos: { ...base.todos, all: merged } });
    await waitFor(() => expect(api.putTodos).toHaveBeenCalled(), SLOW);
    expect(sentTodos().map((t) => t.id)).toEqual(["t1"]);
  });

  it("applies a deletion made on another device", async () => {
    vi.mocked(api.getTodos).mockResolvedValue([
      remoteTodo(todo("t1", "gone", 2_000, { deleted: true }), 0),
    ]);
    const replaceAll = vi.fn();

    const { result } = setup({
      todos: { all: [todo("t1", "gone", 1_000)], replaceAll },
    });
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    expect(replaceAll.mock.calls[0]![0]).toEqual([expect.objectContaining({ id: "t1", deleted: true })]);
  });

  it("keeps a newer local edit over an older remote deletion and pushes it back", async () => {
    vi.mocked(api.getTodos).mockResolvedValue([
      remoteTodo(todo("t1", "old", 2_000, { deleted: true }), 0),
    ]);
    const replaceAll = vi.fn();

    setup({ todos: { all: [todo("t1", "edited again", 3_000)], replaceAll } });
    await waitFor(() => expect(api.putTodos).toHaveBeenCalled(), SLOW);

    expect(replaceAll.mock.calls[0]![0]).toEqual([expect.objectContaining({ text: "edited again" })]);
    expect(sentTodos()[0]).toMatchObject({ id: "t1", deleted: false, updatedAt: 3_000 });
  });
});

describe("merging settings and stats", () => {
  it("keeps newer local settings and pushes them instead of applying older server ones", async () => {
    localStorage.setItem(SETTINGS_AT_KEY, "9000");
    vi.mocked(api.getSettings).mockResolvedValue({
      timerConfig: { focusMinutes: 99 },
      preferences: null,
      theme: "coffee",
      updatedAt: 5_000,
    });

    const { apply, result } = setup();
    await waitFor(() => expect(api.putSettings).toHaveBeenCalled(), SLOW);
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    expect(apply).not.toHaveBeenCalled();
    expect(vi.mocked(api.putSettings).mock.calls[0]![0].updatedAt).toBe(9_000);
  });

  it("resolves stats per day and sends only the days this device won", async () => {
    vi.mocked(api.getProgress).mockResolvedValue({
      "2026-11-05": day(10, 1_000),
      "2026-11-06": day(30, 3_000),
    });
    const replaceDays = vi.fn();

    const { result } = setup({
      progress: {
        days: { "2026-11-05": day(50, 2_000), "2026-11-04": day(20) },
        replaceDays,
      },
    });
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    const merged = replaceDays.mock.calls[0]![0] as Record<string, DayProgress>;
    expect(merged["2026-11-05"]?.focusMinutes).toBe(50); // local is newer
    expect(merged["2026-11-06"]?.focusMinutes).toBe(30); // only on the server
    expect(merged["2026-11-04"]?.focusMinutes).toBe(20); // only on this device

    await waitFor(() => expect(api.putProgress).toHaveBeenCalled(), SLOW);
    expect(Object.keys(vi.mocked(api.putProgress).mock.calls[0]![0]).sort()).toEqual([
      "2026-11-04",
      "2026-11-05",
    ]);
  });
});

describe("pushing changes after the first sync", () => {
  it("sends only the todos that changed", async () => {
    const t1 = todo("t1", "one", 1_000);
    const t2 = todo("t2", "two", 2_000);
    const { result, rerender, base } = setup({ todos: { all: [t1], replaceAll: vi.fn() } });
    await waitFor(() => expect(sentTodos().map((t) => t.id)).toEqual(["t1"]), SLOW);
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    rerender({ ...base, todos: { ...base.todos, all: [t1, t2] } });
    await waitFor(() => expect(sentTodos().map((t) => t.id)).toEqual(["t1", "t2"]), SLOW);

    expect(sentTodos()[1]).toMatchObject({ id: "t2", position: 1 });
  });

  it("reports an error when a push fails and re-sends the missed todo on the next change", async () => {
    vi.mocked(api.putTodos).mockRejectedValueOnce(new Error("offline"));
    const t1 = todo("t1", "one", 1_000);
    const t2 = todo("t2", "two", 2_000);
    const { result, rerender, base } = setup({ todos: { all: [t1], replaceAll: vi.fn() } });

    await waitFor(() => expect(result.current).toBe("error"), SLOW);

    rerender({ ...base, todos: { ...base.todos, all: [t1, t2] } });
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    const calls = vi.mocked(api.putTodos).mock.calls;
    const lastCall = calls[calls.length - 1]![0];
    expect(lastCall.map((t: { id: string }) => t.id)).toEqual(["t1", "t2"]);
  });

  it("stamps and pushes a settings edit", async () => {
    const { result, rerender, base } = setup();
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);
    const before = Date.now();

    rerender({ ...base, settings: { ...base.settings, themeId: "coffee" } });
    await waitFor(() => expect(api.putSettings).toHaveBeenCalled(), SLOW);

    const sent = vi.mocked(api.putSettings).mock.calls[0]![0];
    expect(sent.theme).toBe("coffee");
    expect(sent.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("does not treat applying server settings as a local edit", async () => {
    vi.mocked(api.getSettings).mockResolvedValue({
      timerConfig: { focusMinutes: 50 },
      preferences: null,
      theme: "coffee",
      updatedAt: 5_000,
    });
    const { result, apply, rerender, base } = setup();
    await waitFor(() => expect(apply).toHaveBeenCalled(), SLOW);
    await waitFor(() => expect(result.current).toBe("synced"), SLOW);

    // The app applies the values; the hook must not re-stamp them as a fresh edit.
    const applied = apply.mock.calls[0]![0];
    rerender({ ...base, settings: { ...applied, apply } });
    await sleep(100);

    expect(localStorage.getItem(SETTINGS_AT_KEY)).toBe("5000");
  });
});

describe("when the server cannot be reached", () => {
  it("reports an error and leaves local data alone", async () => {
    vi.mocked(api.getTodos).mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result, replaceAll, replaceDays } = setup();
    await waitFor(() => expect(result.current).toBe("error"), SLOW);
    await sleep(1_000);

    expect(replaceAll).not.toHaveBeenCalled();
    expect(replaceDays).not.toHaveBeenCalled();
    expect(api.putTodos).not.toHaveBeenCalled();
  });
});
