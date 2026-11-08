# Proposal

## Why

The settings screen has accumulated over 15 distinct sections into a single long vertical scroll, requiring extensive scrolling to locate specific options such as account sync, subscription management, audio cues, or appearance. Organizing the settings screen into focused area tabs (Perro, Preferencias, Cuenta) dramatically reduces scroll fatigue, improves discoverability, and creates a clear conceptual separation between dog attributes, user preferences, and account management.

## What Changes

- **Area Navigation Bar**: Introduce an area selector (tabs/chips) at the top of the Settings screen below the title, allowing users to switch between three logical areas:
  - **Perro** (Dog): Identity, physical traits, equipment, and behavioral training profile.
  - **Preferencias** (Preferences): App-level interactions, simulation timing, sound/haptic feedback, voice pack, and custom cue audio.
  - **Cuenta** (Account): Subscription status, cloud sync/login, progress reset, developer diagnostics (when unlocked), and app version.
- **Section Grouping**:
  - Group **Perro**: Equipment, Dog Name, Coat Swatch, About Your Dog (Main Concerns, Home Concerns, Age and Sex), Reactivity Triggers.
  - Group **Preferencias**: Checkpoint Quiz Timer, Sound & Haptics Feedback, Appearance (System, Light, Dark), Voice Pack selection, Custom Cue recording.
  - Group **Cuenta**: LeadMate Plus Subscription status & Restore Purchases, Account synchronization & auth session, Reset Progress, Content Channel switcher (dev/unlocked), Test Tools (dev/unlocked), and App Version / Beta unlock tap target.
- **Persistent Actions**: Ensure the "Cerrar" (Close) button remains immediately accessible without requiring deep scrolling in any tab.
- **Accessibility & Interaction**: Tabs use standard accessible roles (`accessibilityRole="tab"` or `accessibilityRole="button"`) and indicate selection state (`accessibilityState={{ selected }}`).
- **Localization**: Add translations for the tab labels (`settings.tab.dog`, `settings.tab.preferences`, `settings.tab.account`) in `src/i18n/es.ts`.

## Capabilities

### New Capabilities
- `settings-screen`: Defines the layout, area tab organization, section assignment, tab switching, and accessibility of the Settings screen.

### Modified Capabilities
*(None)*

## Impact

- `src/shell/screens/SettingsScreen.tsx`: Introduces tab navigation state and partitions sections into the active tab view.
- `src/shell/screens/SettingsScreen.test.tsx`: Updates existing tests and adds tests for tab switching and tab content rendering.
- `src/i18n/es.ts`: Adds localized strings for tab labels.
