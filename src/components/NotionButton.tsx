// NotionButton component to open the Notion sync settings
// from the bottom of the to-do list

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { AppPreferences } from "@/types/preferences";
import type { useNotionConnection } from "@/hooks/useNotionConnection";
import { NotionPopup } from "./NotionPopup";

type NotionButtonProps = {
  preferences: AppPreferences;
  notion: ReturnType<typeof useNotionConnection>;
  onSavePreferences: (preferences: AppPreferences) => void;
};

export function NotionButton({
  preferences,
  notion,
  onSavePreferences,
}: NotionButtonProps) {
  const [isOpen, setIsOpen] = useState(notion.oauthResult !== null);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn btn-sm btn--pink"
        aria-expanded={isOpen}
      >
        Notion
      </button>
      <AnimatePresence>
        {isOpen && (
          <NotionPopup
            preferences={preferences}
            connection={notion.connection}
            oauthResult={notion.oauthResult}
            onConnect={notion.connect}
            onDisconnect={notion.disconnect}
            onRetry={notion.refresh}
            onSessionExpired={notion.markDisconnected}
            onSave={onSavePreferences}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
