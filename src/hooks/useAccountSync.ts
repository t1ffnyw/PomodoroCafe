import { useEffect, useRef, useState } from "react";
import * as api from "@/lib/account/api";
import type { RemoteTodo } from "@/lib/account/api";
import type { AppPreferences } from "@/types/preferences";
import { DEFAULT_APP_PREFERENCES } from "@/types/preferences";
import type { DayProgress } from "@/types/progress";
import type { ThemeId } from "@/types/theme";
import type { TimerConfig } from "@/types/timer";
import { DEFAULT_TIMER_CONFIG } from "@/types/timer";
import type { Todo } from "@/types/todo";

/**
 * Keeps the signed-in account's data in sync with localStorage, which stays the
 * instant, offline-capable source the UI reads from.
 *
 * On sign-in: fetch everything, merge with local data (newest `updatedAt` wins per
 * todo / per day / for the settings as a whole) and apply the result locally.
 * Afterwards: push local changes to the server after a short debounce.
 */

const SETTINGS_AT_KEY = "cafe-pomodoro-settings-updated-at";
const PUSH_DELAY_MS = 800;
const CHUNK_SIZE = 100;

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

type SettingsValues = {
  timerConfig: TimerConfig;
  preferences: AppPreferences;
  themeId: ThemeId;
};

type Params = {
  signedIn: boolean;
  todos: { all: Todo[]; replaceAll: (todos: Todo[]) => void };
  settings: SettingsValues & { apply: (values: SettingsValues) => void };
  progress: {
    days: Record<string, DayProgress>;
    replaceDays: (days: Record<string, DayProgress>) => void;
  };
};

function readSettingsAt(): number {
  try {
    return Number(localStorage.getItem(SETTINGS_AT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeSettingsAt(value: number): void {
  try {
    localStorage.setItem(SETTINGS_AT_KEY, String(value));
  } catch {
    /* ignore */
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

const todoStamp = (todo: Todo) => todo.updatedAt ?? todo.createdAt;
const todoSignature = (todo: Todo, index: number) => `${todoStamp(todo)}:${index}`;

type RankedTodo = { todo: Todo; position: number; synced: boolean };

function mergeTodos(local: Todo[], remote: RemoteTodo[]): RankedTodo[] {
  const byId = new Map<string, RankedTodo>();
  local.forEach((todo, position) =>
    byId.set(todo.id, { todo, position, synced: false }),
  );
  for (const { position, ...todo } of remote) {
    const existing = byId.get(todo.id);
    if (!existing || todoStamp(todo) > todoStamp(existing.todo)) {
      byId.set(todo.id, { todo, position, synced: true });
    } else if (todoStamp(todo) === todoStamp(existing.todo)) {
      existing.synced = true;
    }
  }
  return [...byId.values()].sort(
    (a, b) => a.position - b.position || a.todo.createdAt - b.todo.createdAt,
  );
}

const isHourly = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length === 24;

export function useAccountSync(params: Params): SyncStatus {
  const { signedIn } = params;
  const latest = useRef(params);
  latest.current = params;

  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("idle");

  // What the server is known to have, so only changed rows are pushed.
  const sentTodos = useRef(new Map<string, string>());
  const sentDays = useRef(new Map<string, number>());
  const applyingRemoteSettings = useRef(false);

  // ---- Stamp local settings edits -----------------------------------------
  const { timerConfig, preferences, themeId } = params.settings;
  const settingsKey = JSON.stringify([timerConfig, preferences, themeId]);
  const lastSettingsKey = useRef(settingsKey);
  useEffect(() => {
    if (lastSettingsKey.current === settingsKey) return;
    lastSettingsKey.current = settingsKey;
    if (applyingRemoteSettings.current) {
      applyingRemoteSettings.current = false; // a server value, not a user edit
      return;
    }
    writeSettingsAt(Date.now());
  }, [settingsKey]);

  // ---- Initial pull + merge on sign-in --------------------------------------
  useEffect(() => {
    if (!signedIn) {
      setReady(false);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("syncing");

    (async () => {
      try {
        const [remoteTodos, remoteSettings, remoteDays] = await Promise.all([
          api.getTodos(),
          api.getSettings(),
          api.getProgress(),
        ]);
        if (cancelled) return;
        const current = latest.current;

        // Todos
        const mergedTodos = mergeTodos(current.todos.all, remoteTodos);
        sentTodos.current = new Map();
        mergedTodos.forEach(({ todo, synced }, index) => {
          if (synced) sentTodos.current.set(todo.id, todoSignature(todo, index));
        });
        current.todos.replaceAll(mergedTodos.map(({ todo }) => todo));

        // Settings: the newest whole-document wins.
        const { settings } = current;
        const currentKey = JSON.stringify([
          settings.timerConfig,
          settings.preferences,
          settings.themeId,
        ]);
        let localAt = readSettingsAt();
        const defaultsKey = JSON.stringify([
          DEFAULT_TIMER_CONFIG,
          DEFAULT_APP_PREFERENCES,
          "matcha",
        ]);
        if (localAt === 0 && currentKey !== defaultsKey) {
          // Settings customised before accounts existed: treat them as fresh.
          localAt = Date.now();
          writeSettingsAt(localAt);
        }
        if (remoteSettings && remoteSettings.updatedAt > localAt) {
          const nextConfig: TimerConfig = {
            ...DEFAULT_TIMER_CONFIG,
            ...(remoteSettings.timerConfig ?? {}),
          };
          const nextPreferences: AppPreferences = {
            ...DEFAULT_APP_PREFERENCES,
            ...(remoteSettings.preferences ?? {}),
            notion: {
              ...DEFAULT_APP_PREFERENCES.notion,
              ...(remoteSettings.preferences?.notion ?? {}),
            },
          };
          const nextTheme: ThemeId =
            remoteSettings.theme === "matcha" || remoteSettings.theme === "coffee"
              ? remoteSettings.theme
              : settings.themeId;
          writeSettingsAt(remoteSettings.updatedAt);
          const nextKey = JSON.stringify([nextConfig, nextPreferences, nextTheme]);
          if (nextKey !== currentKey) {
            applyingRemoteSettings.current = true;
            settings.apply({
              timerConfig: nextConfig,
              preferences: nextPreferences,
              themeId: nextTheme,
            });
          }
        }

        // Progress: newest per day wins.
        const localDays = current.progress.days;
        const mergedDays: Record<string, DayProgress> = { ...localDays };
        sentDays.current = new Map();
        for (const [date, remote] of Object.entries(remoteDays)) {
          const local = localDays[date];
          const localStamp = local?.updatedAt ?? 0;
          if (!local || remote.updatedAt! > localStamp) {
            if (isHourly(remote.hourlyMinutes) && isHourly(remote.hourlyCompletions)) {
              mergedDays[date] = remote;
              sentDays.current.set(date, remote.updatedAt!);
            }
          } else if (remote.updatedAt === localStamp) {
            sentDays.current.set(date, localStamp);
          }
        }
        current.progress.replaceDays(mergedDays);

        setReady(true);
        setStatus("synced");
      } catch (error) {
        console.warn("Account sync failed", error);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  // ---- Push todos -----------------------------------------------------------
  const allTodos = params.todos.all;
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(async () => {
      const dirty = allTodos
        .map((todo, index) => ({ todo, index, signature: todoSignature(todo, index) }))
        .filter(({ todo, signature }) => sentTodos.current.get(todo.id) !== signature);
      if (dirty.length === 0) return;
      try {
        setStatus("syncing");
        for (const group of chunk(dirty, CHUNK_SIZE)) {
          await api.putTodos(
            group.map(({ todo, index }) => ({
              ...todo,
              position: index,
              updatedAt: todoStamp(todo),
              deleted: todo.deleted === true,
            })),
          );
          for (const { todo, signature } of group) {
            sentTodos.current.set(todo.id, signature);
          }
        }
        setStatus("synced");
      } catch {
        setStatus("error");
      }
    }, PUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, allTodos]);

  // ---- Push settings --------------------------------------------------------
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(async () => {
      const updatedAt = readSettingsAt();
      if (updatedAt === 0) return; // untouched defaults: nothing worth saving
      const { settings } = latest.current;
      try {
        setStatus("syncing");
        await api.putSettings({
          timerConfig: settings.timerConfig,
          preferences: settings.preferences,
          theme: settings.themeId,
          updatedAt,
        });
        setStatus("synced");
      } catch {
        setStatus("error");
      }
    }, PUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, settingsKey]);

  // ---- Push progress --------------------------------------------------------
  const days = params.progress.days;
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(async () => {
      const dirty = Object.entries(days).filter(
        ([date, day]) => sentDays.current.get(date) !== (day.updatedAt ?? 1),
      );
      if (dirty.length === 0) return;
      try {
        setStatus("syncing");
        for (const group of chunk(dirty, CHUNK_SIZE)) {
          await api.putProgress(
            Object.fromEntries(
              group.map(([date, day]) => [date, { ...day, updatedAt: day.updatedAt ?? 1 }]),
            ),
          );
          for (const [date, day] of group) {
            sentDays.current.set(date, day.updatedAt ?? 1);
          }
        }
        setStatus("synced");
      } catch {
        setStatus("error");
      }
    }, PUSH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, days]);

  return status;
}
