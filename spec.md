# Cognitive State Detector

## Current State
Fully functional 5-page app: Dashboard, Live Session, Calibration, Analytics, Explanations. Navigation via sidebar with mouse-click buttons. Calibration requires typing and mouse movement. Live session tracks mouse, keyboard, and click events. No accessibility accommodations for paralytic/motor-impaired users.

## Requested Changes (Diff)

### Add
- **Skip to main content** link at top of page for keyboard users
- **Keyboard shortcuts** for all primary actions (Start/Stop session, navigate pages, Start Calibration)
- **Keyboard Shortcuts Help Panel** (press `?` or click a help button to view shortcuts)
- **Accessible Calibration Mode** — an alternative calibration path for users who cannot type or use a mouse. Uses simple timed reaction prompts (press Space/Enter) and scroll-based rest detection instead of mouse movement
- **Accessibility Settings Panel** — toggle for High Contrast Mode, toggle for Reduce Motion, toggle for Large Text, toggle for Accessible Calibration Mode
- **aria-live announcements** for cognitive state changes, alerts, and session status so screen readers are informed
- **Visible focus ring styles** (enhanced `focus-visible` outline) across all interactive elements
- **ARIA labels** on all icon-only buttons, progress bars, charts, and status indicators
- **Accessible Calibration Mode indicator** in the Calibration page when the mode is active
- **Voice command hint bar** (informational banner) on Live Session explaining keyboard/switch alternatives

### Modify
- **Layout.tsx** — add skip-to-content link, keyboard navigation for sidebar (arrow keys), add aria-current on active nav item, add `aria-label` to nav element, add Accessibility Settings button in sidebar bottom utilities
- **Calibration.tsx** — when Accessible Mode is on, replace mouse-movement step with keyboard reaction step and skip or simulate mouse baseline with a default value
- **LiveSession.tsx** — add keyboard shortcut (Space) for Start/Stop, aria-live region for cognitive state, hint banner for keyboard alternatives
- **Dashboard.tsx** — add aria-labels to gauge, badges, sparklines, and charts; aria-live for dominant state
- **index.css** — add enhanced focus-visible styles, high-contrast CSS class, large-text CSS class, reduce-motion media query

### Remove
- Nothing removed

## Implementation Plan
1. Create `AccessibilityContext.tsx` — React context for accessibility settings (highContrast, reduceMotion, largeText, accessibleCalibration)
2. Create `AccessibilityPanel.tsx` — settings drawer/panel with toggles for each option
3. Create `KeyboardShortcutsHelp.tsx` — modal/panel listing all shortcuts
4. Update `index.css` — enhanced focus rings, high-contrast overrides, large-text overrides, reduce-motion
5. Update `Layout.tsx` — skip link, keyboard nav, aria attributes, Accessibility button in sidebar
6. Update `LiveSession.tsx` — Space key shortcut for start/stop, aria-live cognitive state region, keyboard hint banner
7. Update `Calibration.tsx` — accessible mode alternative path (reaction test instead of mouse movement step)
8. Update `Dashboard.tsx` — aria-labels on charts, live regions, badge labels
9. Wrap App in AccessibilityProvider
