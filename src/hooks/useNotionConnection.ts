import { useCallback, useEffect, useState } from "react";
import * as notionClient from "@/lib/notion/client";
import { NotionApiError } from "@/lib/notion/client";

export type NotionConnection =
  | { status: "loading" }
  | { status: "unavailable"; error: string }
  | { status: "disconnected" }
  | { status: "connected"; workspaceName: string | null };

/** Result of the OAuth round-trip, read once from the callback redirect URL. */
export type NotionOAuthResult =
  | { status: "connected" }
  | { status: "error"; message: string };

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Notion access was cancelled.",
  invalid_state: "That sign-in link expired. Please try connecting again.",
  token_exchange_failed: "Couldn't finish connecting to Notion. Please try again.",
};

function readOAuthResult(): NotionOAuthResult | null {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("notion");
  if (status === "connected") return { status: "connected" };
  if (status !== "error") return null;
  return {
    status: "error",
    message:
      OAUTH_ERROR_MESSAGES[params.get("reason") ?? ""] ??
      "Couldn't connect to Notion.",
  };
}

function clearOAuthParams() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("notion")) return;
  url.searchParams.delete("notion");
  url.searchParams.delete("reason");
  window.history.replaceState(null, "", url.toString());
}

// Read at module load: the redirect params are only present on the first page load.
const initialOAuthResult = readOAuthResult();

export function useNotionConnection() {
  const [connection, setConnection] = useState<NotionConnection>({
    status: "loading",
  });
  const oauthResult = initialOAuthResult;

  useEffect(clearOAuthParams, []);

  const refresh = useCallback(async () => {
    setConnection({ status: "loading" });
    try {
      const status = await notionClient.getStatus();
      setConnection(
        status.connected
          ? { status: "connected", workspaceName: status.workspaceName }
          : { status: "disconnected" },
      );
    } catch (error) {
      setConnection({
        status: "unavailable",
        error:
          error instanceof NotionApiError
            ? error.message
            : "Couldn't check the Notion connection.",
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const disconnect = useCallback(async () => {
    await notionClient.logout();
    setConnection({ status: "disconnected" });
  }, []);

  /** Call when an API request reports the session is gone (HTTP 401). */
  const markDisconnected = useCallback(() => {
    setConnection({ status: "disconnected" });
  }, []);

  return {
    connection,
    oauthResult,
    connect: notionClient.connect,
    disconnect,
    refresh,
    markDisconnected,
  };
}
