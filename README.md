# Free HIIT Timer (home_grown_hiit_app)

A fool-proof, fully-configurable, free HIIT/Tabata timer.
Built with **Expo + React Native + TypeScript**.

## What's inside

- **Per-exercise** work + rest durations (longer rest for squats than lunges ✔)
- **Bilingual** ZH / EN (tap the ≡ icon top-left on the Setup screen)
- **4 themed screens** modeled on your reference screenshots
  - Setup (mint header)
  - Prepare — yellow "準備"
  - Work — green "運動"
  - Rest — red "休息"
- **Keep-awake** active during workouts (no auto-lock to remember)
- **Haptic cues** on the last 3 seconds and on phase changes
- **Local save** of the last workout (AsyncStorage)

## First-time setup (Windows)

```cmd
cd /d C:\Users\USER\Desktop\home_grown_hiit_app\home_grown_hiit_app
npm install
npx expo start
```

A QR code will appear in the terminal. On your iPhone:

1. Install **Expo Go** from the App Store (free).
2. Open the iPhone **Camera** app → point at the QR → tap the banner.
3. Expo Go opens and loads the app live.

## Every time after that

Skip the three commands above — just double-click **`start.bat`** in this folder.
It `cd`s into the project and runs the dev server for you. Wait for the QR code,
then scan it from the iPhone Camera app as before.

Requirements for this to work:
- Computer and iPhone must be on the **same Wi-Fi network**.
- `npm install` must have been run at least once already.

Any code change you save in VS Code hot-reloads on the phone instantly.

## Project layout

```
App.tsx                       # Navigation root
src/
├── theme/colors.ts           # All colors / gradients / spacing tokens
├── i18n/strings.ts           # ZH/EN dictionary (single source of truth for text)
├── state/
│   ├── settingsStore.ts      # Language, sound on/off, etc.
│   ├── workoutStore.ts       # Exercises, cycles, rests (+ AsyncStorage)
│   └── timerEngine.ts        # Pure scheduler + drift-free runtime
├── audio/beeps.ts            # Haptic + (future) audio cues
├── components/
│   ├── ProgressRing.tsx      # Dashed circular progress
│   ├── StatCard.tsx          # Rounded info card
│   └── ControlBar.tsx        # Sound / Pause / Skip
├── screens/
│   ├── SetupScreen.tsx       # Config / start
│   ├── ExercisesScreen.tsx   # Edit per-exercise work/rest
│   ├── RuntimeScreen.tsx     # Shared workout view
│   ├── PrepareScreen.tsx     # → RuntimeScreen "prepare"
│   ├── WorkScreen.tsx        # → RuntimeScreen "work"
│   └── RestScreen.tsx        # → RuntimeScreen "rest"
└── utils/format.ts
```

## Useful commands

```cmd
npx expo start          REM start dev server + QR
npm run typecheck       REM TypeScript only check
```

## Adding real sounds (optional, later)

1. Put `beep.mp3` and `ding.mp3` in `assets/sounds/`.
2. Edit `src/audio/beeps.ts` — load them with `Audio.Sound.createAsync(...)`.

## Known MVP simplifications

- "Load last workout" loads whatever was last started; multiple named presets are not yet supported.
- Sound = haptic only until you add audio files.
- No app icon yet (Expo will use a default during development).
