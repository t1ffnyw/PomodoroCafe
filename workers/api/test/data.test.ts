import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { call, createUser, day, hours, newSession, todo, type TestUser } from "./helpers";

type TodoRow = {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  deleted: boolean;
  updatedAt: number;
  notionPageId?: string;
  notionDue?: string;
};

const getTodos = async (user: TestUser) =>
  ((await (await call("/api/todos", { user })).json()) as { todos: TodoRow[] }).todos;

const putTodos = (user: TestUser, todos: unknown[]) =>
  call("/api/todos", { user, method: "PUT", body: { todos } });

describe("authentication required", () => {
  const routes: [string, string][] = [
    ["GET", "/api/todos"],
    ["PUT", "/api/todos"],
    ["GET", "/api/settings"],
    ["PUT", "/api/settings"],
    ["GET", "/api/progress"],
    ["PUT", "/api/progress"],
    ["DELETE", "/api/account"],
  ];

  it.each(routes)("%s %s returns 401 when signed out", async (method, path) => {
    const response = await call(path, { method, body: method === "PUT" ? {} : undefined });
    expect(response.status).toBe(401);
  });

  it("rejects a forged session cookie", async () => {
    const response = await call("/api/todos", {
      headers: { Cookie: "cp_session=forged.signature" },
    });
    expect(response.status).toBe(401);
  });
});

describe("todos", () => {
  it("stores todos and returns them ordered by position", async () => {
    const user = await createUser();
    const first = todo({ text: "first", position: 0 });
    const second = todo({ text: "second", position: 1 });
    await putTodos(user, [second, first]);

    expect((await getTodos(user)).map((t) => t.text)).toEqual(["first", "second"]);
  });

  it("keeps Notion links and completion state", async () => {
    const user = await createUser();
    await putTodos(user, [todo({ completed: true, notionPageId: "page-1", notionDue: "2026-12-01" })]);

    expect((await getTodos(user))[0]).toMatchObject({
      completed: true,
      notionPageId: "page-1",
      notionDue: "2026-12-01",
    });
  });

  it("lets a newer write replace an older one", async () => {
    const user = await createUser();
    const item = todo({ text: "old", updatedAt: 1_000 });
    await putTodos(user, [item]);
    await putTodos(user, [{ ...item, text: "new", updatedAt: 2_000 }]);

    expect((await getTodos(user))[0]?.text).toBe("new");
  });

  it("ignores a stale write (last write wins)", async () => {
    const user = await createUser();
    const item = todo({ text: "new", updatedAt: 2_000 });
    await putTodos(user, [item]);
    await putTodos(user, [{ ...item, text: "stale", updatedAt: 1_500 }]);

    expect((await getTodos(user))[0]?.text).toBe("new");
  });

  it("keeps a deleted todo as a tombstone instead of removing the row", async () => {
    const user = await createUser();
    const item = todo();
    await putTodos(user, [item]);
    await putTodos(user, [{ ...item, deleted: true, updatedAt: 2_000 }]);

    const todos = await getTodos(user);
    expect(todos).toHaveLength(1);
    expect(todos[0]).toMatchObject({ id: item.id, deleted: true });
  });

  it("does not let a stale device resurrect a deleted todo", async () => {
    const user = await createUser();
    const item = todo();
    await putTodos(user, [{ ...item, deleted: true, updatedAt: 2_000 }]);
    // Another device that never saw the deletion pushes its older copy.
    await putTodos(user, [{ ...item, deleted: false, updatedAt: 1_500 }]);

    expect((await getTodos(user))[0]?.deleted).toBe(true);
  });

  it("applies a new order when positions and timestamps change", async () => {
    const user = await createUser();
    const a = todo({ text: "a", position: 0 });
    const b = todo({ text: "b", position: 1 });
    await putTodos(user, [a, b]);
    await putTodos(user, [
      { ...a, position: 1, updatedAt: 2_000 },
      { ...b, position: 0, updatedAt: 2_000 },
    ]);

    expect((await getTodos(user)).map((t) => t.text)).toEqual(["b", "a"]);
  });

  it.each([
    ["a non-array body", "nope"],
    ["a todo without an id", [{ ...todo(), id: undefined }]],
    ["a non-numeric timestamp", [{ ...todo(), updatedAt: "yesterday" }]],
    ["text over the length limit", [todo({ text: "x".repeat(2_001) })]],
    ["more than 1000 todos", Array.from({ length: 1_001 }, () => todo())],
  ])("rejects %s", async (_label, todos) => {
    const user = await createUser();
    expect((await call("/api/todos", { user, method: "PUT", body: { todos } })).status).toBe(400);
  });

  it("requires a JSON content type", async () => {
    const user = await createUser();
    const response = await call("/api/todos", {
      user,
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
    });
    expect(response.status).toBe(415);
  });

  it("keeps each user's todos private", async () => {
    const alice = await createUser("alice@example.com");
    const bob = await createUser("bob@example.com");
    const shared = todo({ text: "alice todo", updatedAt: 1_000 });
    await putTodos(alice, [shared]);

    expect(await getTodos(bob)).toEqual([]);

    // Bob reusing Alice's todo id writes his own row and never touches hers.
    await putTodos(bob, [{ ...shared, text: "bob todo", updatedAt: 9_000 }]);
    expect((await getTodos(alice))[0]?.text).toBe("alice todo");
    expect((await getTodos(bob))[0]?.text).toBe("bob todo");
  });

  it("shows the same data to a second device signed in to the same account", async () => {
    const laptop = await createUser();
    await putTodos(laptop, [todo({ text: "synced" })]);

    const phone = await newSession(laptop);
    expect((await getTodos(phone)).map((t) => t.text)).toEqual(["synced"]);
  });
});

describe("settings", () => {
  const settings = {
    timerConfig: {
      focusMinutes: 30,
      breakMinutes: 7,
      longBreakMinutes: 20,
      cyclesBeforeLongBreak: 3,
    },
    preferences: { chimeEnabled: false, ambientSound: "lofi", ambientVolume: 40 },
    theme: "coffee",
    updatedAt: 1_000,
  };

  const getSettings = async (user: TestUser) =>
    ((await (await call("/api/settings", { user })).json()) as {
      settings: { theme: string } | null;
    }).settings;

  it("returns null before anything is saved", async () => {
    const user = await createUser();
    expect(await getSettings(user)).toBeNull();
  });

  it("round-trips timer config, preferences and theme", async () => {
    const user = await createUser();
    await call("/api/settings", { user, method: "PUT", body: settings });

    expect(await getSettings(user)).toEqual(settings);
  });

  it("ignores a stale settings write but accepts a newer one", async () => {
    const user = await createUser();
    await call("/api/settings", { user, method: "PUT", body: { ...settings, updatedAt: 2_000 } });
    await call("/api/settings", {
      user,
      method: "PUT",
      body: { ...settings, theme: "matcha", updatedAt: 1_500 },
    });
    expect((await getSettings(user))?.theme).toBe("coffee");

    await call("/api/settings", {
      user,
      method: "PUT",
      body: { ...settings, theme: "matcha", updatedAt: 3_000 },
    });
    expect((await getSettings(user))?.theme).toBe("matcha");
  });

  it("rejects a missing timestamp and oversized preferences", async () => {
    const user = await createUser();
    const noTimestamp = { ...settings, updatedAt: undefined };
    expect(
      (await call("/api/settings", { user, method: "PUT", body: noTimestamp })).status,
    ).toBe(400);

    const huge = { ...settings, preferences: { blob: "x".repeat(25_000) } };
    expect((await call("/api/settings", { user, method: "PUT", body: huge })).status).toBe(400);
  });

  it("keeps each user's settings private", async () => {
    const alice = await createUser("alice@example.com");
    const bob = await createUser("bob@example.com");
    await call("/api/settings", { user: alice, method: "PUT", body: settings });

    expect(await getSettings(bob)).toBeNull();
  });
});

describe("progress", () => {
  type Day = { focusMinutes: number };
  const getDays = async (user: TestUser) =>
    ((await (await call("/api/progress", { user })).json()) as { days: Record<string, Day> }).days;
  const putDays = (user: TestUser, days: Record<string, unknown>) =>
    call("/api/progress", { user, method: "PUT", body: { days } });

  it("starts empty", async () => {
    const user = await createUser();
    expect(await getDays(user)).toEqual({});
  });

  it("round-trips a day of focus stats", async () => {
    const user = await createUser();
    const today = day({ focusMinutes: 42.5, completedSessions: 2, hourlyMinutes: hours(1.5) });
    await putDays(user, { "2026-11-06": today });

    expect((await getDays(user))["2026-11-06"]).toEqual(today);
  });

  it("resolves conflicts per day, not for the whole history", async () => {
    const user = await createUser();
    await putDays(user, { "2026-11-05": day({ focusMinutes: 50, updatedAt: 2_000 }) });
    await putDays(user, {
      "2026-11-05": day({ focusMinutes: 10, updatedAt: 1_000 }), // stale: ignored
      "2026-11-06": day({ focusMinutes: 30, updatedAt: 1_000 }), // new day: stored
    });

    const days = await getDays(user);
    expect(days["2026-11-05"]?.focusMinutes).toBe(50);
    expect(days["2026-11-06"]?.focusMinutes).toBe(30);
  });

  it("clamps negative focus minutes to zero", async () => {
    const user = await createUser();
    await putDays(user, { "2026-11-06": day({ focusMinutes: -5 }) });

    expect((await getDays(user))["2026-11-06"]?.focusMinutes).toBe(0);
  });

  it.each([
    ["a malformed date key", { "06-11-2026": day() }],
    ["hourly minutes with the wrong length", { "2026-11-06": day({ hourlyMinutes: [1, 2, 3] }) }],
    ["a missing completions array", { "2026-11-06": day({ hourlyCompletions: undefined }) }],
    ["a non-numeric timestamp", { "2026-11-06": day({ updatedAt: "now" }) }],
  ])("rejects %s", async (_label, days) => {
    const user = await createUser();
    expect((await putDays(user, days)).status).toBe(400);
  });

  it("keeps each user's stats private", async () => {
    const alice = await createUser("alice@example.com");
    const bob = await createUser("bob@example.com");
    await putDays(alice, { "2026-11-06": day() });

    expect(await getDays(bob)).toEqual({});
  });
});

describe("delete account", () => {
  async function count(table: string, column: string, userId: string): Promise<number> {
    const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column} = ?`)
      .bind(userId)
      .first<{ n: number }>();
    return row?.n ?? -1;
  }

  it("removes every row the user owns, ends the session and leaves other users alone", async () => {
    const alice = await createUser("alice@example.com");
    const bob = await createUser("bob@example.com");
    for (const user of [alice, bob]) {
      await putTodos(user, [todo()]);
      await call("/api/settings", { user, method: "PUT", body: { theme: "coffee", updatedAt: 1_000 } });
      await call("/api/progress", {
        user,
        method: "PUT",
        body: { days: { "2026-11-06": day() } },
      });
    }

    const response = await call("/api/account", { user: alice, method: "DELETE" });
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().join(";")).toMatch(/cp_session=;.*Max-Age=0/);

    expect(await count("users", "id", alice.id)).toBe(0);
    expect(await count("todos", "user_id", alice.id)).toBe(0);
    expect(await count("settings", "user_id", alice.id)).toBe(0);
    expect(await count("daily_progress", "user_id", alice.id)).toBe(0);

    // The old cookie no longer works...
    expect((await call("/api/todos", { user: alice })).status).toBe(401);
    // ...and Bob's data is untouched.
    expect(await count("todos", "user_id", bob.id)).toBe(1);
    expect(await count("settings", "user_id", bob.id)).toBe(1);
    expect(await count("daily_progress", "user_id", bob.id)).toBe(1);
  });
});
