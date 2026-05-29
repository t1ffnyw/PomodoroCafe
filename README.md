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
- Completed tasks hidden by default; toggle **Show completed** to reveal them
- All todos saved to `localStorage`

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
```

## Tech stack

| Layer | Tools |
|-------|-------|
| UI | React 19, TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Persistence | `localStorage` (timer config, preferences, theme, todos) |

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
    TodoList.tsx          Task list with inline editing
    SettingsBar.tsx       Title, theme picker, settings, focus mode entry
    SettingsPopup.tsx     Timer duration settings
    ThemePicker.tsx       Matcha / coffee theme previews
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
    todo.ts               Todo type

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
