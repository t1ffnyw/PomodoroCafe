// NotionPopup component to connect a Notion workspace and map a task database
// (title, status, due date) for the to-do list sync

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { AppPreferences } from "@/types/preferences";
import type {
  NotionDatabaseSchema,
  NotionDatabaseSummary,
  NotionPropertySchema,
  NotionSyncSettings,
} from "@/types/notion";
import type {
  NotionConnection,
  NotionOAuthResult,
} from "@/hooks/useNotionConnection";
import * as notionClient from "@/lib/notion/client";
import { NotionApiError } from "@/lib/notion/client";

type NotionPopupProps = {
  preferences: AppPreferences;
  connection: NotionConnection;
  oauthResult: NotionOAuthResult | null;
  onConnect: () => void;
  onDisconnect: () => Promise<void>;
  onRetry: () => void;
  onSessionExpired: () => void;
  onSave: (preferences: AppPreferences) => void;
  onClose: () => void;
};

const STATUS_PROPERTY_TYPES = ["status", "select"];
const SELECT_CLASS =
  "w-full rounded-lg border border-cafe-sage-dark/60 bg-white px-3 py-1.5 font-body text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-matcha/40 disabled:opacity-60";
const ACTIVE_STATUS_PATTERN = /not started|to ?do|in progress|doing/i;
const DONE_STATUS_PATTERN = /done|complete|cancel|archiv/i;

function propertiesOfType(
  schema: NotionDatabaseSchema | null,
  types: string[],
): NotionPropertySchema[] {
  return schema?.properties.filter((p) => types.includes(p.type)) ?? [];
}

function pickProperty(
  candidates: NotionPropertySchema[],
  current: string,
  preferredName: RegExp,
): string {
  if (candidates.some((p) => p.name === current)) return current;
  return (
    candidates.find((p) => preferredName.test(p.name))?.name ??
    candidates[0]?.name ??
    ""
  );
}

function defaultStatusValues(options: string[]): string[] {
  const active = options.filter((o) => ACTIVE_STATUS_PATTERN.test(o));
  return active.length > 0
    ? active
    : options.filter((o) => !DONE_STATUS_PATTERN.test(o));
}

/** Fills in any mapping the saved settings don't cover from the database schema. */
function applySchemaDefaults(
  settings: NotionSyncSettings,
  schema: NotionDatabaseSchema,
): NotionSyncSettings {
  const titleProperty = pickProperty(
    propertiesOfType(schema, ["title"]),
    settings.titleProperty,
    /name|title|task/i,
  );
  const statusCandidates = propertiesOfType(schema, STATUS_PROPERTY_TYPES);
  const statusProperty = pickProperty(
    [
      ...statusCandidates.filter((p) => p.type === "status"),
      ...statusCandidates.filter((p) => p.type === "select"),
    ],
    settings.statusProperty,
    /status|stage/i,
  );
  const dueProperty = pickProperty(
    propertiesOfType(schema, ["date"]),
    settings.dueProperty,
    /due|deadline|date/i,
  );

  const options =
    schema.properties.find((p) => p.name === statusProperty)?.options ?? [];
  const keptValues = settings.statusValues.filter((v) => options.includes(v));
  const statusValues =
    statusProperty === settings.statusProperty && keptValues.length > 0
      ? keptValues
      : defaultStatusValues(options);

  return {
    ...settings,
    databaseId: schema.id,
    databaseTitle: schema.title,
    titleProperty,
    statusProperty,
    dueProperty,
    statusValues,
  };
}

function PropertySelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: NotionPropertySchema[];
  onChange: (name: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-sm text-cafe-text">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
        disabled={options.length === 0}
      >
        {options.length === 0 && <option value="">No matching property</option>}
        {options.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function NotionPopup({
  preferences,
  connection,
  oauthResult,
  onConnect,
  onDisconnect,
  onRetry,
  onSessionExpired,
  onSave,
  onClose,
}: NotionPopupProps) {
  const [draft, setDraft] = useState<NotionSyncSettings>(preferences.notion);
  const [databases, setDatabases] = useState<NotionDatabaseSummary[] | null>(
    null,
  );
  const [schema, setSchema] = useState<NotionDatabaseSchema | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthResult?.status === "error" ? oauthResult.message : null,
  );

  const isConnected = connection.status === "connected";

  function handleApiError(err: unknown) {
    if (err instanceof NotionApiError && err.status === 401) {
      onSessionExpired();
    }
    setError(err instanceof Error ? err.message : "Something went wrong.");
  }

  useEffect(() => {
    if (!isConnected) return;
    let cancelled = false;
    notionClient
      .listDatabases()
      .then((list) => {
        if (!cancelled) setDatabases(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) handleApiError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [isConnected]);

  const selectedDatabaseId = draft.databaseId;
  useEffect(() => {
    if (!isConnected || !selectedDatabaseId) {
      setSchema(null);
      return;
    }
    let cancelled = false;
    setIsLoadingSchema(true);
    notionClient
      .getSchema(selectedDatabaseId)
      .then((loaded) => {
        if (cancelled) return;
        setSchema(loaded);
        setDraft((prev) => applySchemaDefaults(prev, loaded));
      })
      .catch((err: unknown) => {
        if (!cancelled) handleApiError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSchema(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isConnected, selectedDatabaseId]);

  function updateDraft(changes: Partial<NotionSyncSettings>) {
    setDraft((prev) => ({ ...prev, ...changes }));
  }

  function handleDatabaseChange(databaseId: string) {
    setError(null);
    updateDraft({
      databaseId: databaseId || null,
      databaseTitle:
        databases?.find((db) => db.id === databaseId)?.title ?? null,
      titleProperty: "",
      statusProperty: "",
      dueProperty: "",
      statusValues: [],
    });
  }

  function handleStatusPropertyChange(name: string) {
    const options =
      schema?.properties.find((p) => p.name === name)?.options ?? [];
    updateDraft({
      statusProperty: name,
      statusValues: defaultStatusValues(options),
    });
  }

  function toggleStatusValue(value: string) {
    updateDraft({
      statusValues: draft.statusValues.includes(value)
        ? draft.statusValues.filter((v) => v !== value)
        : [...draft.statusValues, value],
    });
  }

  async function handleDisconnect() {
    setError(null);
    try {
      await onDisconnect();
      setDatabases(null);
      setSchema(null);
    } catch (err) {
      handleApiError(err);
    }
  }

  function handleSave() {
    onSave({
      ...preferences,
      notion: {
        ...draft,
        maxTasks: Math.min(20, Math.max(1, draft.maxTasks)),
        dueWindowDays: Math.min(365, Math.max(0, draft.dueWindowDays)),
      },
    });
    onClose();
  }

  const statusOptions =
    schema?.properties.find((p) => p.name === draft.statusProperty)?.options ??
    [];
  const isMappingComplete =
    Boolean(draft.databaseId) &&
    Boolean(draft.titleProperty) &&
    Boolean(draft.statusProperty) &&
    Boolean(draft.dueProperty) &&
    draft.statusValues.length > 0;
  const showMapping = isConnected && schema !== null && !isLoadingSchema;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={`cafe-scrollbar absolute bottom-full right-0 z-50 mb-2 max-h-[80vh] overflow-y-auto rounded-xl bg-white/95 p-5 shadow-lg backdrop-blur-sm ${
        showMapping ? "w-[34rem]" : "w-80"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-semibold text-cafe-text">
          Notion Sync
        </h3>
        {connection.status === "connected" && (
          <span className="flex min-w-0 items-center gap-2 font-body text-xs text-cafe-text">
            <span className="min-w-0 truncate">
              Connected to{" "}
              <span className="font-semibold">
                {connection.workspaceName ?? "Notion"}
              </span>
            </span>
            <button
              type="button"
              onClick={handleDisconnect}
              className="shrink-0 font-semibold text-cafe-matcha hover:underline"
            >
              Disconnect
            </button>
          </span>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-cafe-pink-light px-3 py-2 font-body text-xs text-cafe-text">
          {error}
        </p>
      )}

      {connection.status === "loading" && (
        <p className="text-muted font-body text-sm">Checking connection...</p>
      )}

      {connection.status === "unavailable" && (
        <div className="flex flex-col gap-3">
          <p className="font-body text-sm text-cafe-text">{connection.error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-sm btn--cream"
          >
            Retry
          </button>
        </div>
      )}

      {connection.status === "disconnected" && (
        <div className="flex flex-col gap-3">
          <p className="font-body text-sm text-cafe-text">
            Connect your Notion workspace to pull your soonest-due tasks into
            the to-do list. On Notion's screen, choose the page that contains
            your task board.
          </p>
          <button
            type="button"
            onClick={onConnect}
            className="btn btn-sm btn--matcha"
          >
            Connect Notion
          </button>
        </div>
      )}

      {connection.status === "connected" && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 rounded-lg bg-cafe-cream p-3">
            <span className="font-display text-sm font-semibold text-cafe-text">
              Database
            </span>
            <select
              value={draft.databaseId ?? ""}
              onChange={(e) => handleDatabaseChange(e.target.value)}
              className={SELECT_CLASS}
              disabled={databases === null}
            >
              <option value="">
                {databases === null ? "Loading..." : "Choose a database"}
              </option>
              {databases?.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.title}
                </option>
              ))}
            </select>
          </label>
          {databases?.length === 0 && (
            <p className="text-muted-xs">
              No databases are shared yet. Disconnect, connect again, and pick
              the page that contains your task board on Notion's screen.
            </p>
          )}

          {isLoadingSchema && (
            <p className="text-muted font-body text-sm">Loading properties...</p>
          )}

          {showMapping && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-3 rounded-lg bg-cafe-sage-light p-3">
                <span className="font-display text-sm font-semibold text-cafe-text">
                  Columns
                </span>
                <PropertySelect
                  label="Task name"
                  value={draft.titleProperty}
                  options={propertiesOfType(schema, ["title"])}
                  onChange={(name) => updateDraft({ titleProperty: name })}
                />
                <PropertySelect
                  label="Status"
                  value={draft.statusProperty}
                  options={propertiesOfType(schema, STATUS_PROPERTY_TYPES)}
                  onChange={handleStatusPropertyChange}
                />
                <PropertySelect
                  label="Due date"
                  value={draft.dueProperty}
                  options={propertiesOfType(schema, ["date"])}
                  onChange={(name) => updateDraft({ dueProperty: name })}
                />
              </div>

              <div className="flex flex-col gap-3 rounded-lg bg-cafe-pink-light p-3">
                <span className="font-display text-sm font-semibold text-cafe-text">
                  What to pull
                </span>
                {statusOptions.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-body text-sm text-cafe-text">
                      Statuses
                    </span>
                    <div className="cafe-scrollbar flex max-h-24 flex-col gap-1 overflow-y-auto">
                      {statusOptions.map((option) => (
                        <label
                          key={option}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={draft.statusValues.includes(option)}
                            onChange={() => toggleStatusValue(option)}
                            className="h-4 w-4 accent-cafe-matcha"
                          />
                          <span className="font-body text-sm text-cafe-text">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-[1fr_4rem] items-center gap-x-3 gap-y-2">
                  <label className="contents">
                    <span className="font-body text-sm text-cafe-text">
                      Max tasks
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={draft.maxTasks}
                      onChange={(e) =>
                        updateDraft({ maxTasks: Number(e.target.value) })
                      }
                      className="input-number"
                    />
                  </label>
                  <label className="contents">
                    <span className="font-body text-sm text-cafe-text">
                      Due within (days)
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={draft.dueWindowDays}
                      onChange={(e) =>
                        updateDraft({ dueWindowDays: Number(e.target.value) })
                      }
                      className="input-number"
                    />
                  </label>
                </div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.fillBeyondWindow}
                    onChange={(e) =>
                      updateDraft({ fillBeyondWindow: e.target.checked })
                    }
                    className="h-4 w-4 accent-cafe-matcha"
                  />
                  <span className="font-body text-sm text-cafe-text">
                    Fill with later tasks
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isConnected && Boolean(draft.databaseId) && !isMappingComplete}
          className="btn btn-sm btn--matcha flex-1 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn--pink-contrast flex-1"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
