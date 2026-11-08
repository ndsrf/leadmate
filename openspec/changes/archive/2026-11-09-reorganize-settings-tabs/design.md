# Design

## Context

The `SettingsScreen` in `src/shell/screens/SettingsScreen.tsx` currently renders 15 distinct sections in a single continuous vertical `ScrollView`. Users looking to adjust sound feedback, appearance, cloud sync, or subscription status must scroll through unrelated dog behavioral and physical attributes.

See `proposal.md` for user motivation and goals.

## Goals / Non-Goals

**Goals:**
- Partition all existing configuration sections into three distinct tabs: **Perro** (Dog), **Preferencias** (Preferences), and **Cuenta** (Account).
- Provide a pinned top area selector (`Screen.header`) with the "Ajustes" title and tactile raised pill tabs (`Choice` style with brand highlight).
- Maintain 100% backwards compatibility with existing props, state handlers, and sub-components (`AppearanceSection`, `CHECKPOINT_OPTIONS`, `ResetConfirmText`, etc.).
- Reset scroll position to top when switching tabs so the user lands cleanly at the start of each area.
- Reopen on the **Cuenta** tab when returning from authentication to provide a seamless login experience.
- Keep the Close button easily accessible at the foot of each tab.
- Preserve the 7-tap beta unlock interaction on the version label within the Cuenta tab.

**Non-Goals:**
- Modifying the underlying data models (`DogRecord`, `UiSettings`, `Account`, etc.).
- Adding persistent multi-screen navigation or routes (Settings remains an overlay screen managed by `app-shell`).
- Implementing a horizontal swipe pager (which would conflict with Android/iOS system back edge-swipes).
- Changing individual section internals or controls (e.g., concern pickers, slider choices, audio recorder logic).

## Decisions

### 1. Pinned Header Composition & Tab Bar Style
- **Decision**: Render the "Ajustes" title, lead line, and the Area Tabs together inside `Screen.header`.
- **Styling**: Use natural-width raised pill tabs following the `Choice` styling (`Raised` with `color.brand` when selected, neutral surface when unselected) rather than forced equal-width `flex: 1` columns. This guarantees that longer words like "Preferencias" never truncate on narrow mobile viewports (320–360pt).
- **Alternatives considered**:
  - *In-scroll tabs*: Rejected because users would lose access to the area selector after scrolling down.
  - *Full-width segmented control*: Rejected because asymmetrical label lengths ("Perro" vs "Preferencias") cause awkward text wrapping.

### 2. Tab Transition Behavior
- **Decision**: Instant content switch with a subtle entrance fade respecting the device's `useMotion` setting, without gesture-based horizontal swiping.
- **Rationale**: LeadMate relies heavily on system back gestures (edge swipes on mobile) to dismiss overlays and return to the World Map. A horizontal swipe gesture container inside Settings would conflict with back navigation.

### 3. Tab Categorization
- **Perro (`dog`)**:
  - `EquipmentSection` (Collar vs Harness)
  - `DogNameField`
  - Coat selection (`DOG_COAT_NAMES`)
  - About your dog (`MainConcernChips`, `HomeConcernChips`, `AgeSexChips`)
  - Reactivity triggers (`DISTRACTOR_KINDS` with 0-3 levels)
- **Preferencias (`preferences`)**:
  - Checkpoint timer (`CHECKPOINT_OPTIONS`)
  - Feedback toggles (Sounds and Haptics)
  - Appearance theme (`AppearanceSection`: System, Light, Dark)
  - Voice pack selection (`VOICE_PACKS`)
  - Custom cue audio recording and playback (`CustomCueSection`)
- **Cuenta (`account`)**:
  - LeadMate Plus subscription status and restore purchases
  - Account sync and auth (`AccountSection`)
  - Reset progress section and modal (`shouldShowResetSection`)
  - Content channel switcher (beta/stable, when unlocked or in dev)
  - Test tools (expire/reset trial, when unlocked or in dev)
  - App version and content version display (with 7-tap beta unlock trigger)

### 4. Authentication Return Flow Continuity
- **Decision**: Support an `initialTab?: 'dog' | 'preferences' | 'account'` prop on `SettingsScreen` (defaulting to `'dog'`). In `App.tsx`, when `returnTo === 'settings'`, reopen with `initialTab="account"`.
- **Rationale**: When users tap "Iniciar sesión" on the Cuenta tab and finish or dismiss auth, returning to Settings lands directly on the Cuenta tab where they left off.

### 5. Scroll Management
- **Decision**: Attach a `ScrollView` ref via `Screen`'s `scrollRef` prop and call `scrollTo({ y: 0, animated: false })` whenever the active tab changes.
- **Rationale**: Prevents awkward view jumps where switching to a shorter tab leaves the scroll position at the bottom of the page.

### 6. Close Action Placement
- **Decision**: Render the "Cerrar" button at the end of each tab's scroll content.
- **Rationale**: Because each tab contains only 3–5 compact sections (under 2 viewports of scrolling), keeping "Cerrar" in the scroll container maximizes vertical screen real estate on mobile devices without needing a permanent sticky footer.

## Risks / Trade-offs

- **[Risk] Existing unit tests expecting all sections in static HTML**: Existing tests in `SettingsScreen.test.tsx` (like checkpoint timer) render `SettingsScreen` and expect `es['settings.checkpoint']` to be in static HTML.
  - *Mitigation*: Update `SettingsScreen.test.tsx` so tests either switch to the relevant tab via clicking the tab button, or supply `initialTab="preferences"` / `initialTab="account"` where appropriate.
- **[Risk] Header height on small screens**: Pinned header with title + tabs takes ~100–110pt of vertical space.
  - *Mitigation*: `Screen` header spacing is compact (`paddingTop: insets.top + space[2]`, `paddingBottom: space[2]`), leaving ample vertical space for scrolling content.
