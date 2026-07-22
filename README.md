# Lift 404 🏋️

A minimal workout tracker for iPhone, inspired by Liftoff. Built with
**Expo (React Native) + TypeScript**. All data is stored **locally on your
phone** (AsyncStorage) — no account, no server, no internet needed.

## Features

- **Home** — create reusable **routines** (a named list of exercises) and start
  a workout, empty or from a routine.
- **Live workout** — a big running **timer** starts when you begin. Add
  exercises manually, and log each set with **dropdowns for weight (volume) and
  reps**. Press **End workout** and it saves to today's date and records how
  long you trained.
- **Rest timer** — pick a preset (30s / 1m / 1:30 / 2m / 3m); it **auto-starts
  when you check off a set** and buzzes when rest is over. It's wall-clock based
  so it stays accurate after the app is backgrounded, and it schedules a **local
  notification** so you're alerted even while in another app.
- **Calendar** — a "Memories"-style grid where every day you trained shows a
  **drawn badge of that workout** (a color-coded, hand-authored SVG icon per
  muscle group). Tap a trained day to revisit that session (exercises, sets,
  volume, and duration). See totals for days trained and total time.

Data model lives in `lib/storage.ts`; the running-workout state is in
`context/WorkoutContext.tsx` (it persists, so the timer survives if the app is
backgrounded or restarted).

## Project layout

```
app/
  _layout.tsx            Root navigation + WorkoutProvider
  (tabs)/
    _layout.tsx          Bottom tabs (Home, Calendar)
    index.tsx            Home: routines + start/resume workout
    calendar.tsx         Month calendar + workout history
  workout.tsx            Active workout: timer, exercises, sets, rest timer
  session/[date].tsx     A past session's detail
components/
  ExerciseIcon.tsx       Drawn (SVG) muscle-group badge
  NumberDropdown.tsx     Weight / reps dropdown picker
  NumberPickerCell.tsx   Inline tap-to-edit cell for the sets table
  RestTimer.tsx          Between-sets countdown timer
context/WorkoutContext.tsx
lib/ storage.ts theme.ts time.ts exerciseIcons.ts notifications.ts
```

---

## Run it on YOUR iPhone (free, ~5 minutes)

This is the fastest, zero-cost path — no Apple Developer account required.

1. Install **Node.js 18+** on your computer.
2. In this folder, install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npx expo start
   ```
4. On your iPhone, install **Expo Go** from the App Store.
5. Open the iPhone **Camera** and scan the QR code shown in the terminal. It
   opens Lift 404 inside Expo Go.

Your phone and computer must be on the same Wi-Fi. If that's a problem, run
`npx expo start --tunnel` instead.

> Expo Go is great for daily use and testing. The only catch: the app runs
> "inside" Expo Go rather than as its own home-screen icon.

---

## Get it as a real app / on TestFlight

TestFlight and installing a standalone app icon **require an Apple Developer
account, which costs $99/year** — there is no truly free path to TestFlight,
that's an Apple rule, not a limitation of this app. Once you have the account:

1. Install the build tool and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Configure the project (first time only):
   ```bash
   eas build:configure
   ```
3. Build for iOS in the cloud (no Mac needed):
   ```bash
   eas build --platform ios --profile production
   ```
4. Submit to TestFlight:
   ```bash
   eas submit --platform ios
   ```
   Then invite yourself as a tester in App Store Connect.

`eas.json` in this repo already defines the build profiles.

### Free alternatives to TestFlight

- **Expo Go** (above) — free forever, best for personal use.
- **Free 7-day sideload** — with a plain (free) Apple ID and Xcode on a Mac you
  can install a standalone build directly to your own iPhone, but it expires
  every 7 days and must be re-installed.
- **Android** — Google Play's one-time $25 fee is far cheaper, and you can also
  just build a free APK with `eas build --platform android --profile preview`
  and install it directly.

**Recommendation:** use **Expo Go** now (free, today), and only pay for the
Apple Developer account later if you want the polished home-screen icon and
TestFlight sharing.

---

## CI/CD

GitHub Actions workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on every push to `main` and every pull request. Installs
  dependencies, runs the TypeScript typecheck (`npm run typecheck`), and runs
  `expo-doctor` (informational, non-blocking).
- **`eas-build.yml`** — a **manual** workflow (Actions tab → *EAS Build* → *Run
  workflow*) that builds the app in the cloud with EAS. Pick the platform,
  build profile, and whether to auto-submit to the store. It never runs on a
  push, so it won't consume build minutes unless you trigger it.

  Requires an `EXPO_TOKEN` repository secret: create one at
  <https://expo.dev/settings/access-tokens>, then add it under **Settings →
  Secrets and variables → Actions**.

Handy scripts: `npm run typecheck` and `npm run doctor`.
