import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { useAuth } from "@/hooks/useAuth";
import { AccountButton, PrivacyLink } from "./AccountButton";
import { PrivacyPage } from "./PrivacyPage";

type Auth = ReturnType<typeof useAuth>;

function fakeAuth(overrides: Partial<Auth> = {}): Auth {
  return {
    state: { status: "signedOut" },
    loginError: null,
    dismissLoginError: vi.fn(),
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const signedIn: Auth["state"] = {
  status: "signedIn",
  user: { email: "me@example.com", name: "Tiff" },
};

describe("AccountButton", () => {
  it("renders nothing while the session is loading", () => {
    const { container } = render(
      <AccountButton auth={fakeAuth({ state: { status: "loading" } })} syncStatus="idle" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("is pinned to the top-right corner of the screen", () => {
    render(<AccountButton auth={fakeAuth()} syncStatus="idle" />);

    const corner = screen.getByRole("button", { name: "Sign in with Google" }).closest(".fixed");
    expect(corner?.className).toMatch(/\btop-3\b/);
    expect(corner?.className).toMatch(/\bright-3\b/);
  });

  it("starts Google sign-in when signed out", () => {
    const auth = fakeAuth();
    render(<AccountButton auth={auth} syncStatus="idle" />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(auth.login).toHaveBeenCalled();
  });

  it("shows the user's name and an account menu when signed in", () => {
    const auth = fakeAuth({ state: signedIn });
    render(<AccountButton auth={auth} syncStatus="synced" />);

    fireEvent.click(screen.getByRole("button", { name: "Tiff" }));

    expect(screen.getByText("me@example.com")).toBeTruthy();
    expect(screen.getByText("Synced")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.logout).toHaveBeenCalled();
  });

  it("flags a failed sync on the button", () => {
    render(<AccountButton auth={fakeAuth({ state: signedIn })} syncStatus="error" />);

    expect(screen.getByRole("button", { name: "Tiff ⚠" })).toBeTruthy();
  });

  it("deletes the account only after confirmation", () => {
    const auth = fakeAuth({ state: signedIn });
    const confirm = vi.spyOn(window, "confirm");
    render(<AccountButton auth={auth} syncStatus="synced" />);
    fireEvent.click(screen.getByRole("button", { name: "Tiff" }));

    confirm.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    expect(auth.deleteAccount).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    expect(auth.deleteAccount).toHaveBeenCalled();
  });

  it("explains a failed login and lets the user dismiss it", () => {
    const auth = fakeAuth({ loginError: "access_denied" });
    render(<AccountButton auth={auth} syncStatus="idle" />);

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Sign-in was cancelled.");

    fireEvent.click(alert);
    expect(auth.dismissLoginError).toHaveBeenCalled();
  });
});

describe("privacy", () => {
  it("links to /privacy from the bottom-right corner", () => {
    render(<PrivacyLink />);

    const link = screen.getByRole("link", { name: "Privacy" });
    expect(link.getAttribute("href")).toBe("/privacy");
    expect(link.className).toMatch(/\bbottom-3\b/);
    expect(link.className).toMatch(/\bright-3\b/);
  });

  it("renders the privacy policy with deletion instructions and a way back", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Retention and deletion" })).toBeTruthy();
    expect(screen.getByText(/Delete account/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Back to Cafe Pomodoro/ }).getAttribute("href")).toBe("/");
  });
});
