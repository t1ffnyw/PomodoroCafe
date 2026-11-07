-- Accounts and per-user app data. Timestamps are epoch milliseconds.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE (provider, provider_id)
);

CREATE TABLE todos (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  notion_page_id TEXT,
  notion_due TEXT,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  timer_config TEXT,
  preferences TEXT,
  theme TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE daily_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  focus_minutes REAL NOT NULL DEFAULT 0,
  completed_sessions INTEGER NOT NULL DEFAULT 0,
  hourly_minutes TEXT NOT NULL,
  hourly_completions TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, date)
);
