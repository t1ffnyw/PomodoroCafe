import { describe, expect, it, vi } from "vitest";
import { AccountApiError, clearLocalData, getMe, putTodos } from "./api";

describe("clearLocalData", () => {
  it("removes only this app's keys", () => {
    localStorage.setItem("cafe-pomodoro-todos", "[]");
    localStorage.setItem("cafe-pomodoro-theme", "coffee");
    localStorage.setItem("someone-elses-key", "keep me");

    clearLocalData();

    expect(localStorage.getItem("cafe-pomodoro-todos")).toBeNull();
    expect(localStorage.getItem("cafe-pomodoro-theme")).toBeNull();
    expect(localStorage.getItem("someone-elses-key")).toBe("keep me");
  });
});

describe("account API client", () => {
  it("sends todos as a JSON PUT to /api/todos", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ todos: [] }));

    await putTodos([]);

    const [path, init] = fetchSpy.mock.calls[0]!;
    expect(path).toBe("/api/todos");
    expect(init).toMatchObject({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todos: [] }),
    });
  });

  it("turns a server error into an AccountApiError with the server's message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ error: "Not signed in" }, { status: 401 }),
    );

    const error = await getMe().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AccountApiError);
    expect(error).toMatchObject({ status: 401, message: "Not signed in" });
  });

  it("reports a network failure as status 0", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getMe()).rejects.toMatchObject({ status: 0 });
  });
});
