# Tasks

## 1. Localization and Tab Definitions

- [x] 1.1 Add i18n keys for Settings area tabs (`settings.tab.dog`: 'Perro', `settings.tab.preferences`: 'Preferencias', `settings.tab.account`: 'Cuenta') in `src/i18n/es.ts` and verify that `npm test src/i18n/catalog-usage.test.ts` passes.
- [x] 1.2 Define the `SettingsTab` type (`'dog' | 'preferences' | 'account'`) and tab list in `src/shell/screens/SettingsScreen.tsx` and verify clean TypeScript compilation.

## 2. Settings Screen Layout and Section Partitioning

- [x] 2.1 Mount the title, lead line, and the area tab bar together in `Screen.header` using natural-width accessible pill buttons (`accessibilityRole="tab"`, `accessibilityState={{ selected }}`), managing `activeTab` state with default `'dog'` and optional `initialTab` prop. Verify header renders pinned with active tab styling.
- [x] 2.2 Partition the existing 15+ sections into their respective tab views: Perro (Equipment, Dog Name, Coat, About, Reactivity Triggers), Preferencias (Checkpoint, Sounds & Haptics, Appearance, Voice Pack, Custom Cue), and Cuenta (Subscription, Account, Reset Progress, Content Channel, Test Tools, Version & Beta unlock). Verify each tab displays only its assigned sections.
- [x] 2.3 Connect `scrollRef` on `Screen` to scroll to top whenever the user switches tabs, ensure the "Cerrar" button is rendered at the bottom of each tab, and pass `initialTab="account"` when returning to Settings from auth in `App.tsx`. Verify tab transitions reset scroll position and login returns to Cuenta.

## 3. Test Coverage and Verification

- [x] 3.1 Update and expand unit tests in `src/shell/screens/SettingsScreen.test.tsx` to cover tab navigation, tab button accessibility states, and section rendering on each respective tab, verifying that `npm test src/shell/screens/SettingsScreen.test.tsx` passes.
- [x] 3.2 Run the full test suite (`npm test`) to confirm no regressions across other screens or shell integration.
