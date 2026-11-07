// Sign in / account menu, pinned to the top-right corner of the screen.

import { useState } from "react";
import type { useAuth } from "@/hooks/useAuth";
import type { SyncStatus } from "@/hooks/useAccountSync";

type AccountButtonProps = {
  auth: ReturnType<typeof useAuth>;
  syncStatus: SyncStatus;
};

const SYNC_LABEL: Record<SyncStatus, string> = {
  idle: "",
  syncing: "Syncing…",
  synced: "Synced",
  error: "Sync failed – will retry on your next change",
};

const LOGIN_ERRORS: Record<string, string> = {
  access_denied: "Sign-in was cancelled.",
  invalid_state: "Sign-in expired. Please try again.",
  login_failed: "Couldn't sign in with Google. Please try again.",
};

export function AccountButton({ auth, syncStatus }: AccountButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { state } = auth;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (
      window.confirm(
        "Delete your account and all synced data (to-dos, settings, stats)? This can't be undone.",
      )
    ) {
      void run(auth.deleteAccount);
    }
  }

  if (state.status === "loading") return null;

  return (
    <div className="fixed top-3 right-3 z-20 flex flex-col items-end gap-2">
      <div className="relative">
        {state.status === "signedOut" ? (
          <button
            type="button"
            onClick={auth.login}
            className="btn btn-sm btn--cream"
          >
            Sign in with Google
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="btn btn-sm btn--cream"
              aria-expanded={isOpen}
              title={SYNC_LABEL[syncStatus]}
            >
              {state.user.name ?? state.user.email ?? "Account"}
              {syncStatus === "error" ? " ⚠" : ""}
            </button>
            {isOpen && (
              <div className="cafe-card absolute top-full right-0 z-10 mt-2 flex w-56 flex-col gap-2 p-3 text-sm">
                {state.user.email && (
                  <p className="break-all">{state.user.email}</p>
                )}
                <p className="opacity-70">{SYNC_LABEL[syncStatus]}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(auth.logout)}
                  className="btn btn-sm btn--sage"
                >
                  Sign out
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDelete}
                  className="btn btn-sm btn--wood"
                >
                  Delete account
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {auth.loginError && (
        <button
          type="button"
          onClick={auth.dismissLoginError}
          className="text-xs underline"
          role="alert"
        >
          {LOGIN_ERRORS[auth.loginError] ?? "Sign-in failed."} Dismiss
        </button>
      )}
    </div>
  );
}

/** Privacy policy link, pinned to the bottom-right corner of the screen. */
export function PrivacyLink() {
  return (
    <a
      href="/privacy"
      className="fixed right-3 bottom-3 z-20 text-xs text-cafe-text underline opacity-70 hover:opacity-100"
    >
      Privacy
    </a>
  );
}
