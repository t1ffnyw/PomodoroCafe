# Pomodoro Cafe

A cozy café-themed Pomodoro timer built with React. Work in focused sprints, take breaks, track your cycles, and manage tasks—all in a warm pixel-art café setting.

## Features

### Pomodoro timer
- **Focus**, **short break**, and **long break** modes with a circular countdown
- Configurable durations and cycle count (defaults: 25 / 5 / 15 min, 4 cycles before long break)
- Start, pause, resume, and reset controls
- Cycle tracker with theme-specific drink icons
- **Tab title countdown** while the timer is running (e.g. `24:32 · Focus · Pomodoro Cafe`)
- **Session celebration** modal when a focus or break session completes
- Optional **auto-start** for breaks and focus sessions

### Focus mode
- Full-screen distraction-free view during focus sessions
- Large timer and minimal controls
- Exit via the close button or **Escape**

### Themes
- **Matcha** — pink gingham and sage green palette with a matcha latte
- **Coffee** — brown and cream palette with a coffee cup
- Switch themes from the paintbrush button on the settings bar
- Theme choice and favicon persist in `localStorage`

### To-do list
- Add, complete, edit (click task text), and delete tasks
- Drag the dotted handle on a task to reorder the list
- Completed tasks hidden by default; toggle **Show completed** to reveal them
- All todos saved to `localStorage`

### Study progress & stats
- Tracks total focus minutes and completed sessions in `localStorage` (`cafe-pomodoro-progress`)
- Automatically records study minutes on pause, reset, completion, and page hide/unload so partial focus time counts
- View Day, Week, and Month breakdowns with totals and daily averages
- Toggle graph view between focus minutes and completed sessions
- Interactive theme-matched bar charts for Day and Week, and a smooth line chart for Month

### Notion connection
- **Connect Notion** from the **Notion** button in the bottom-left of the to-do list (OAuth sign-in, no tokens to paste)
- Pick a task database and map its name, status, and due date properties (auto-detected from the schema)
- Choose which statuses to pull (e.g. Not Started, In Progress), how many tasks, and the due-date window
- Tasks are pulled soonest due first; tasks without a due date are excluded
- The **sync** button (circular arrows, next to Add) pulls tasks into the to-do list. It is one-way and fill-only:
  - Synced tasks look and edit like any other todo; later syncs never change them
  - Only unchecked synced tasks count toward the max (default 5); when you're at the max, Sync does nothing
  - Completing or deleting a synced task frees a slot for the next soonest-due task
  - A Notion task already in the list (checked or not) is never added twice
- Requires the Notion API Worker; see [Notion integration setup](#notion-integration-setup)

### Settings
- Adjust focus, break, long break, and cycle count from the gear icon
- Toggle auto-start breaks / auto-start focus
- Session completion chime
- Ambient sound: None, Café, Typing & writing, or Lo-fi (with volume slider)

### Sound files

Add these MP3 files to `public/assets/sounds/`:

| File | Purpose |
|------|---------|
| `chime.mp3` | Plays when a session completes |
| `ambient-cafe.mp3` | Café ambient loop |
| `ambient-typing.mp3` | Typing ambient loop |
| `ambient-lofi.mp3` | Lo-fi music loop |

Paths are defined in `src/config/sounds.ts`. Audio may require a user click (Start) before the browser allows playback.

Music from #Uppbeat (free for Creators!):
https://uppbeat.io/t/dope-cat/chill-fm
License code: HWXYZIVNWK2DVMML

## Getting started

**Requirements:** Node.js 18+

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

### Other commands

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run dev:api  # Notion API Worker on http://localhost:8787
npm run deploy   # Build and deploy the app + Worker to Cloudflare
```

## Notion integration setup

The app talks to Notion through a small Cloudflare Worker in `workers/api`. The Worker runs the OAuth sign-in, keeps each user's Notion token in Cloudflare KV, and proxies Notion API calls. The browser only ever holds an HttpOnly session cookie; the Notion client secret and access tokens never reach the React bundle.

In production the same Worker also serves the built app, so the site and the API share one URL. The session cookie is first-party and works in every browser, with no CORS setup. Only `/auth/*` and `/api/*` run Worker code; everything else is served as static files from `dist/`.

Notion OAuth, Cloudflare Workers, and KV are free at personal / light usage.

### 1. Create a public Notion integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and create a new integration with type **Public**.
2. Under capabilities, enable **Read content**. Write access is not needed (sync is one-way).
3. Add the OAuth redirect URIs:
   - Local: `http://localhost:8787/auth/notion/callback`
   - Production: `https://cafe-pomodoro.<you>.workers.dev/auth/notion/callback` (shown after your first deploy)
4. Copy the **OAuth client ID** and **OAuth client secret**.

When someone connects, Notion's consent screen asks which pages to share. They must select their task database there (or a page that contains it), otherwise it won't appear in the database picker.

### 2. Run locally

```bash
cd workers/api
npm install
cp .dev.vars.example .dev.vars   # then fill in the client ID, secret, and a random signing secret
cd ../..
npm run dev:api                  # Worker on :8787
npm run dev                      # Vite on :5173, proxies /auth/notion and /api/notion to the Worker
```

Open `http://localhost:5173`, click the Notion button, and choose **Connect Notion**. After approving in Notion you land back in the app with the Notion panel open.

`wrangler dev` simulates KV locally, so no Cloudflare account is needed until you deploy.

### 3. Deploy

One-time setup:

```bash
cd workers/api
npx wrangler login
npx wrangler kv namespace create SESSIONS   # paste the returned id into wrangler.toml
cd ../..
npm run deploy                                     # prints your URL, e.g. https://cafe-pomodoro.<you>.workers.dev
```

Then point the Worker at that URL. In `workers/api/wrangler.toml`, set the `[vars]`:

| Variable | Value |
|----------|-------|
| `APP_ORIGIN` | Your app URL, e.g. `https://cafe-pomodoro.<you>.workers.dev` (OAuth redirects back here) |
| `NOTION_REDIRECT_URI` | Your app URL + `/auth/notion/callback`; add this same URI to your Notion integration |

Add the secrets (each command prompts for the value) and deploy again:

```bash
cd workers/api
npx wrangler secret put NOTION_CLIENT_ID
npx wrangler secret put NOTION_CLIENT_SECRET
npx wrangler secret put SESSION_SIGNING_SECRET     # a new long random string, not the local one
cd ../..
npm run deploy
```

After that, `npm run deploy` is the only command needed to ship updates. It builds the app and uploads it together with the Worker.

### Hosting the app on Vercel instead

The live site is served by Vercel at `https://pomodoro-cafe-one.vercel.app`, with the Worker still on Cloudflare. `vercel.json` rewrites `/auth/notion/*` and `/api/notion/*` to the Worker, so the browser only ever talks to the Vercel domain and the session cookie stays first-party.

- `APP_ORIGIN` is `https://pomodoro-cafe-one.vercel.app`, and `NOTION_REDIRECT_URI` (plus the redirect URI registered in Notion) is `https://pomodoro-cafe-one.vercel.app/auth/notion/callback`
- The site deploys through Vercel as usual; deploy the Worker with `cd workers/api` then `npx wrangler deploy` whenever its code or `wrangler.toml` changes
- If the Worker URL changes, update both destinations in `vercel.json`

### Worker API

| Route | Purpose |
|-------|---------|
| `GET /auth/notion/start` | Starts OAuth (CSRF `state` in KV + cookie), redirects to Notion |
| `GET /auth/notion/callback` | Verifies `state`, exchanges the code, creates the session, redirects to the app |
| `POST /auth/notion/logout` | Deletes the session and clears the cookie |
| `GET /api/notion/me` | `{ connected, workspaceName }` |
| `GET /api/notion/databases` | Databases shared with the integration |
| `GET /api/notion/databases/:id/schema` | Property names, types, and status/select options |
| `POST /api/notion/tasks` | Soonest-due tasks matching the mapped statuses, as `{ pageId, title, due }` |

`POST /api/notion/tasks` takes `databaseId`, `titleProperty`, `statusProperty`, `dueProperty`, `statusValues`, and optionally `maxTasks` (default 5), `dueWindowDays` (default 7), `fillBeyondWindow` (default true), and `excludePageIds` (pages already in the to-do list, skipped so they don't take up slots).

## Tech stack

| Layer | Tools |
|-------|-------|
| UI | React 19, TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Persistence | `localStorage` (timer config, preferences, theme, todos, study progress) |
| Notion + account API | Cloudflare Worker + KV (`workers/api`) |

## Project structure

```
src/
  App.tsx                 Main layout and state wiring
  index.css               Theme tokens, gingham backgrounds, shared UI classes
  components/
    CafeScene.tsx         Themed background wrapper (gingham + scallop borders)
    DrinkDisplay.tsx      Pixel-art drink with optional sprite animation
    Timer.tsx             Countdown ring and time display
    Controls.tsx          Start / pause / reset buttons
    CycleTracker.tsx      Pomodoro cycle progress icons
    ModeSelector.tsx      Focus / break mode tabs
    TodoList.tsx          Task list with inline editing, drag-to-reorder, Sync button
    NotionButton.tsx      Notion button at the bottom of the to-do list
    SettingsBar.tsx       Title, theme picker, settings, focus mode entry
    SettingsPopup.tsx     Timer duration settings
    NotionPopup.tsx       Connect Notion, database + property mapping
    ThemePicker.tsx       Matcha / coffee theme previews
    StatsPopup.tsx        Study progress and stats panel
    StatsBarChart.tsx     SVG bar chart for Day / Week progress
    StatsLineChart.tsx    SVG line chart for Month progress
    SessionCelebration.tsx Celebration modal on session complete
    FocusModeOverlay.tsx  Full-screen focus view
    FocusModeButton.tsx   Enter focus mode
  hooks/
    useTimer.ts           Countdown logic and mode switching
    useTimerConfig.ts     Timer settings + localStorage
    useAppPreferences.ts  Auto-start, chime, ambient sound prefs
    useChime.ts           Session completion chime
    useAmbientSound.ts    Looping ambient audio
    useTabTitle.ts        Live countdown in browser tab title
    useTheme.ts           Active theme + localStorage
    useThemeFavicon.ts    Updates tab icon per theme
    useTodos.ts           Todo CRUD + localStorage
    useStudyProgress.ts   Focus progress persistence and analytics
    useNotionConnection.ts Notion connection status + OAuth redirect result
    useNotionSync.ts      Fill-only Notion → to-do sync
  lib/notion/
    client.ts             Calls to the Notion API Worker
  config/
    drinks.ts             Drink layer definitions and sprite frames
    scenes.ts             Background + drink pairings
    themes.ts             Matcha and coffee theme registry
    sounds.ts             Audio file paths
  types/
    scene.ts              Drink and scene types
    theme.ts              Theme types
    timer.ts              Timer types and defaults
    preferences.ts        App preferences and session events
    notion.ts             Notion sync settings and API response types
    todo.ts               Todo type
    progress.ts           Study progress metrics and chart types

workers/api/       Cloudflare Worker: serves the app, Notion OAuth, sessions (KV), API proxy
  src/index.ts            Router, origin check, error handling
  src/oauth.ts            Connect / callback / logout / me
  src/session.ts          Signed session cookie + KV storage
  src/notion.ts           Notion API client
  src/routes.ts           Databases, schema, and tasks endpoints

public/assets/drinks/
  matcha/                 Matcha drink sprites and mini-matcha icon
  coffee/                 Coffee drink sprites and mini-coffee icon
public/assets/sounds/     Chime and ambient audio (user-supplied MP3s)
```

## Adding a theme

1. Define drink assets under `public/assets/drinks/<name>/`
2. Add a drink in `src/config/drinks.ts` and a background in `src/config/scenes.ts`
3. Register the theme in `src/config/themes.ts` with a `cycleIcon` path
4. Add a `[data-theme="<name>"]` color block in `src/index.css`

## License

Private project.
