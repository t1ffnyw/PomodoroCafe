import { useCallback, useEffect, useState } from "react";
import {
  clearLocalData,
  deleteAccount as apiDeleteAccount,
  getMe,
  reloadPage,
  signIn,
  signOut,
  type AccountUser,
} from "@/lib/account/api";

type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: AccountUser };

/** Reads and strips the ?login=error redirect params, once at module load. */
function readLoginError(): string | null {
  const url = new URL(window.location.href);
  const result = url.searchParams.get("login");
  if (!result) return null;
  const reason = url.searchParams.get("reason");
  url.searchParams.delete("login");
  url.searchParams.delete("reason");
  window.history.replaceState(null, "", url.toString());
  return result === "error" ? (reason ?? "unknown") : null;
}

const initialLoginError = readLoginError();

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const [loginError, setLoginError] = useState<string | null>(initialLoginError);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((user) => {
        if (cancelled) return;
        setState(user ? { status: "signedIn", user } : { status: "signedOut" });
      })
      .catch(() => {
        // Server unreachable: keep working from local data, signed out.
        if (!cancelled) setState({ status: "signedOut" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    clearLocalData();
    reloadPage();
  }, []);

  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    clearLocalData();
    reloadPage();
  }, []);

  return {
    state,
    loginError,
    dismissLoginError: () => setLoginError(null),
    login: signIn,
    logout,
    deleteAccount,
  };
}
