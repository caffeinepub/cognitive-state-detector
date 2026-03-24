# Cognitive State Detector

## Current State
The app has accessibility support for paralytic users via keyboard-only navigation, accessible calibration mode (keyboard reaction tests), screen reader announcements, and an Accessibility Panel with high contrast/large text/reduce motion toggles.

However, users who are deaf, mute, AND unable to move their hands have no usable input channel. Voice commands require speech. Keyboard shortcuts require hand movement. Audio feedback is useless for deaf users.

## Requested Changes (Diff)

### Add
- **Eye Gaze Mode** (new accessibility setting): uses the device webcam to track the user's gaze. When the user looks at an interactive button for 2 seconds (dwell selection), it activates automatically. No hands or voice needed.
- **Blink Detection Mode** (new accessibility setting): uses the webcam to detect deliberate eye blinks (held for ~300ms) as a "click" or "confirm" signal. Works as an alternative to a single button press.
- **Auto-Advance Mode** (new accessibility setting): the entire calibration runs on automatic timers — no input required at all. The user just watches the screen. Each step auto-completes and moves to the next.
- **Gaze Cursor Overlay**: a visible dot on screen showing where the user is currently looking, with a dwell progress ring that fills up as they hold gaze on a button.
- **EyeGazeContext**: new React context that manages webcam stream, MediaPipe FaceMesh / eye landmark processing, current gaze position, and blink detection state.
- **GazeDwellButton**: wrapper component that wraps any button with gaze dwell logic — highlights on gaze entry and auto-clicks after dwell duration.
- **Visual-only feedback**: all existing audio cues must have visual equivalents (flashing/color change). No audio required for deaf users.
- Eye/blink mode toggle added to AccessibilityPanel alongside existing options.
- Auto-advance calibration: step 1 (typing) auto-skips after 20s, step 2 (reaction) completes on timer, step 3 (rest) completes on timer — all without any input.

### Modify
- **AccessibilityContext**: add `eyeGazeMode`, `blinkMode`, `autoAdvanceMode` boolean settings.
- **AccessibilityPanel**: add three new toggle options for Eye Gaze, Blink Detection, and Auto-Advance.
- **Calibration.tsx**: add auto-advance logic — when `autoAdvanceMode` is on, step 1 auto-skips after 20s, steps 2 and 3 auto-advance on their timers (already timer-based, just need to skip typing requirement).
- **Layout.tsx**: render `<GazeCursor />` overlay when eye gaze mode is active.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/hooks/useEyeGaze.ts` — webcam + face landmark detection using MediaPipe FaceMesh via CDN script tag or the `@mediapipe/face_mesh` package loaded dynamically. Exports: `gazePoint {x,y}`, `isBlinking`, `isCameraReady`.
2. Create `src/frontend/src/components/GazeCursor.tsx` — floating dot that follows gaze point, invisible when eye gaze mode is off.
3. Create `src/frontend/src/components/GazeDwellButton.tsx` — wraps children, tracks gaze proximity, shows dwell ring progress, fires `onClick` after 2s dwell.
4. Update `AccessibilityContext.tsx` — add `eyeGazeMode`, `blinkMode`, `autoAdvanceMode`.
5. Update `AccessibilityPanel.tsx` — add three new toggle options.
6. Update `Calibration.tsx` — add `autoAdvanceMode` logic to skip typing and auto-complete.
7. Update `Layout.tsx` — render `<GazeCursor />` overlay.
8. Validate and fix any TypeScript/lint errors.
