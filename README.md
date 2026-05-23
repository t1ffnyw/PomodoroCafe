# Café Pomodoro

A cozy café-themed Pomodoro timer app with a matcha aesthetic.

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
  components/       UI components
    App.tsx            Main layout
    CafeScene.tsx      Background wrapper with gingham pattern
    DrinkDisplay.tsx   Layered pixel-art drink renderer
    Timer.tsx          Countdown ring + time display
    Controls.tsx       Start / Pause / Reset buttons
    TodoList.tsx       Task list with add/toggle/delete
    SettingsBar.tsx    Top bar (title + future settings)
  hooks/             State logic
    useTimer.ts        Pomodoro countdown state machine
    useTodos.ts        Todo CRUD with localStorage persistence
  config/            Scene & drink configurations
    drinks.ts          Layered drink definitions
    scenes.ts          Background + drink combos
  types/             TypeScript types
    scene.ts           DrinkConfig, BackgroundConfig, SceneConfig
    timer.ts           TimerMode, TimerState, TimerConfig
    todo.ts            Todo type

public/assets/
  drinks/matcha/     Layered PNGs: cup, liquid, foam, coaster, steam
  drinks/coffee/     (V2) Future drink option
  backgrounds/       Background images
  decorations/       (V2) Notebook, pastry, lamp, etc.
  sounds/            Chime for timer completion
```

## Tech Stack

- React + TypeScript (Vite)
- Tailwind CSS v4
- Framer Motion
- localStorage for persistence
