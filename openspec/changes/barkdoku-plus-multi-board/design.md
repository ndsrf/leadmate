# Design

## Context

See `proposal.md` for background and motivation.

Barkdoku currently pins the Daily Barkdoku to a single deterministic board per date via `getDailyBoard(dateString)`. When a user completes today's board, `recordDailyBarkdoku` records the first solve in `DogRecord.dailyBarkdoku[dateString]`. Any subsequent visit to the puzzle on that day flags `practice = true`, presenting the exact same board without stars or target evaluation.

In `GLOSSARY.md` and ADR 0027 (amending ADR 0014), we introduce **Plus Boards** (*Tableros Plus*): additional distinct boards available to Plus and Trial members on the same calendar day. Solves of Plus Boards represent genuine deduction and are logged in `DogRecord.activityLog` with Stars and duration for display in the Diary, while preserving the first daily solve as the sole benchmark for `Daily Solve Time` and Streak qualification.

## Goals / Non-Goals

**Goals:**
- Provide an escalating challenge curve (`5x5 → 6x6 → 7x7 → 8x8`) for multiple distinct Barkdoku boards per day for Plus and trial members.
- Expose clear tier-based visual context inside Barkdoku:
  - Users on a 7-day trial see a `Prueba Plus` badge and victory copy clearly stating the perk is included in their trial.
  - Subscribed Plus members see the `Plus` badge and can immediately advance to new boards.
  - Free users are informed upfront in the header (`Práctica · Tablero diario`) and on the completion card that they repeat the same board daily until midnight, with a direct upgrade button to open the Paywall.
- If a free user upgrades or starts the trial from the Barkdoku paywall prompt, seamlessly return them to the puzzle and immediately deal a fresh board (`boardIndex = 1`).
- Derive the active `boardIndex` dynamically from today's Barkdoku count in `DogRecord.activityLog`, avoiding new schema migrations in `DogRecord`.
- Maintain ADR 0014 and dog record streak semantics: the first solve of the calendar date determines the `Daily Solve Time` and streak qualification.

**Non-Goals:**
- Modifying node-based Barkdoku (e.g. World 3 `calm-zone-intro` minigame), which already generates fresh 4x4 boards per attempt.
- Overhauling the core deduction rules, cell interaction mechanics, or grid sizing.
- Altering streak qualification criteria (first solve of the day remains the qualifying milestone).

## Decisions

### 1. Board Generation Strategy: Deterministic Escalating Challenge Curve

**Choice**: Extend daily board resolution with a board index: `getDailyBoard(dateString: string, boardIndex = 0): BarkdokuBoard`.
- For `boardIndex === 0`: Returns the primary curated daily board (identical to current behavior for all users).
- For `boardIndex > 0`: Generates a distinct board cycling sizes deterministically based on `boardIndex`:
  - `boardIndex === 1`: 5x5
  - `boardIndex === 2`: 6x6
  - `boardIndex === 3`: 7x7
  - `boardIndex === 4`: 8x8
  - (Cycles thereafter for higher indices)
- The board is generated using `generateBoard(size, seed)` from `src/shell/puzzle/generator.ts` where `seed = dateSeed(`${dateString}-plus-${boardIndex}`)`.
- **Rationale**: Provides an escalating difficulty progression, maintains 100% offline determinism, and requires zero manual catalog additions.

### 2. State & Flow Routing in `App.tsx` via `activityLog`

**Choice**: Derive `boardIndex` automatically from `DogRecord.activityLog`:
- Count how many Barkdoku activities are logged for today in `DogRecord.activityLog`.
  - 0 solves: Board #0 (`getDailyBoard(dateString, 0)`). First solve records to `dailyBarkdoku[dateString]`, marks streak, and logs to `activityLog`.
  - 1 solve: Board #1 (`getDailyBoard(dateString, 1)`).
  - N solves: Board #N (`getDailyBoard(dateString, N)`).
- When a user enters Barkdoku from the Map Header chip:
  - Free user who already solved today: opens Board #0 in practice mode.
  - Plus/Trial user who already solved today: opens Board #N (where N is today's solve count in `activityLog`).
- When a Plus user taps "Jugar otro tablero" on `SolvedCard`, it navigates to `boardIndex: N + 1`.
- **Rationale**: Eliminates the need for new fields in `DogRecord`, automatically syncing the board state across screen navigation and app restarts.

### 3. SolvedCard & Header Tier Indicators

**Choice**:
- **Header**:
  - Free replaying: `Práctica · Tablero diario` badge with explanatory caption under title: *"Los usuarios de la versión gratuita juegan el mismo tablero cada día"*.
  - Plus member playing `boardIndex > 0`: `Plus · Tablero #{boardIndex + 1}`.
  - Trial user playing `boardIndex > 0`: `Prueba Plus · Tablero #{boardIndex + 1}`.
- **SolvedCard**:
  - Free user replaying: Displays practice time with copy *"Los usuarios de la versión gratuita juegan el mismo tablero cada día. Pasa a Plus para desbloquear tableros nuevos ilimitados."* and a prominent button *"Desbloquear con Plus"*.
  - Plus subscriber: Displays solve metrics and stars earned, with copy *"LeadMate Plus: ¡Puedes jugar tantos tableros nuevos como quieras hoy!"* and button *"Jugar otro tablero"*.
  - Trial user: Displays solve metrics and stars earned, with copy *"Incluido en tu prueba de LeadMate Plus: puedes jugar tableros nuevos ilimitados hoy."* and button *"Jugar otro tablero"*.

### 4. Pending Action on Paywall Conversion

**Choice**: Introduce `{ kind: 'barkdoku' }` into `PendingPlusAction`.
- When a free user taps *"Desbloquear con Plus"* from Barkdoku, `setFlow({ name: 'paywall', then: { kind: 'barkdoku' } })` is triggered.
- If they start the trial or subscribe, the app automatically transitions to `{ name: 'puzzle', date: todayString(), boardIndex: 1 }`, instantly rewarding them with a fresh board.

### 5. Diary & Activity Log Integration (ADR 0027)

**Choice**:
- When a Plus user solves a Plus Board (`boardIndex > 0`), call a helper `recordPlusBarkdoku(record, board.id, summary, metrics.stars, now)`.
- It appends an activity entry `{ kind: 'barkdoku', id: board.id, stars, puzzle: summary }` to `record.activityLog`, but does NOT overwrite `record.dailyBarkdoku[dateString]`.
- This ensures all cognitive training appears in the user's Diary without violating ADR 0014.

## Risks / Trade-offs

- **[Board generation performance on low-end devices]** → `generateBoard` runs a solver check with fallback to curated boards within ~10-20ms for sizes 5x5-8x8. This is lightweight and already used in Node runs.
- **[Confusion around Streak counting]** → The SolvedCard for Plus Boards clearly indicates that the daily streak was qualified by today's first solve.
- **[Trial expiration mid-play]** → `isPlus` is evaluated live; if a trial expires, subsequent new boards are gated, but the currently active board attempt can be completed.
