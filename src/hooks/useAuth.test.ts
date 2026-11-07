import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "@/lib/account/api";

vi.mock("@/lib/account/api");

/** useAuth reads the ?login= redirect params when it is first imported. */
async function loadUseAuth(url = "/") {
  window.history.replaceState(null, "", url);
  vi.resetModules();
  return (await import("./useAuth")).useAuth;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getMe).mockResolvedValue(null);
  vi.mocked(api.signOut).mockResolvedValue(undefined);
  vi.mocked(api.deleteAccount).mockResolvedValue(undefined);
});

describe("useAuth", () => {
  it("starts loading, then reports the signed-in user", async () => {
    vi.mocked(api.getMe).mockResolvedValue({ email: "me@example.com", name: "Me" });
    const useAuth = await loadUseAuth();

    const { result } = renderHook(() => useAuth());
    expect(result.current.state.status).toBe("loading");

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "signedIn",
        user: { email: "me@example.com", name: "Me" },
      }),
    );
  });

  it("reports signed out when there is no session", async () => {
    const useAuth = await loadUseAuth();
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.state.status).toBe("signedOut"));
  });

  it("falls back to signed out when the server is unreachable", async () => {
    vi.mocked(api.getMe).mockRejectedValue(new Error("offline"));
    const useAuth = await loadUseAuth();
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.state.status).toBe("signedOut"));
  });

  it("surfaces a failed Google login from the redirect and strips it from the URL", async () => {
    const useAuth = await loadUseAuth("/?login=error&reason=access_denied&keep=1");
    const { result } = renderHook(() => useAuth());

    expect(result.current.loginError).toBe("access_denied");
    expect(window.location.search).toBe("?keep=1");

    act(() => result.current.dismissLoginError());
    expect(result.current.loginError).toBeNull();
  });

  it("strips a successful login redirect without showing an error", async () => {
    const useAuth = await loadUseAuth("/?login=success");
    const { result } = renderHook(() => useAuth());

    expect(result.current.loginError).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("signs out, then wipes local data and reloads", async () => {
    const useAuth = await loadUseAuth();
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.logout());

    expect(api.signOut).toHaveBeenCalled();
    expect(api.clearLocalData).toHaveBeenCalled();
    expect(api.reloadPage).toHaveBeenCalled();
    expect(vi.mocked(api.signOut).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(api.clearLocalData).mock.invocationCallOrder[0]!,
    );
  });

  it("keeps local data if signing out fails", async () => {
    vi.mocked(api.signOut).mockRejectedValue(new Error("offline"));
    const useAuth = await loadUseAuth();
    const { result } = renderHook(() => useAuth());

    await expect(act(() => result.current.logout())).rejects.toThrow("offline");
    expect(api.clearLocalData).not.toHaveBeenCalled();
    expect(api.reloadPage).not.toHaveBeenCalled();
  });

  it("deletes the account, then wipes local data and reloads", async () => {
    const useAuth = await loadUseAuth();
    const { result } = renderHook(() => useAuth());

    await act(() => result.current.deleteAccount());

    expect(api.deleteAccount).toHaveBeenCalled();
    expect(api.clearLocalData).toHaveBeenCalled();
    expect(api.reloadPage).toHaveBeenCalled();
  });

  it("keeps local data if deleting the account fails", async () => {
    vi.mocked(api.deleteAccount).mockRejectedValue(new Error("offline"));
    const useAuth = await loadUseAuth();
    const { result } = renderHook(() => useAuth());

    await expect(act(() => result.current.deleteAccount())).rejects.toThrow("offline");
    expect(api.clearLocalData).not.toHaveBeenCalled();
  });
});
