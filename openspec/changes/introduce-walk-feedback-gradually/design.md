# Design

## Context

See proposal.md (Why). The relevant current state:

- **Feedback kinds.** Every Feedback kind is listed once in `FEEDBACK_ACTION_KINDS` (`src/sim/feedbackKinds.ts`), with its polarity, and `feedbackKindOf` maps sim events to kinds. The sim uses the same kinds for Stage Meter points and for the scent-Stage `timeline` in the payload.
- **Stage start.**
  - `App.tsx` `startStage` builds the `start` message: scenario, `seenKinds` (from the Dog record's `seenHints`, `feedback:` prefix), `isTasteStage`, reduced motion and the telegraph fields.
  - In the bundle, `StageScene` creates `FeedbackDecider({ seenKinds, isTasteStage })` (`src/hud/feedback.ts`). The decider already filters by Stage (Taste: right only), merges Combos and picks Hint or short form.
- **Shell-side Hints and Coach marks.** The event Hints (leash colours, Marker, Poste, leash first Taut / Rigid Pull) and the walking Coach marks (`src/hud/coach.ts`: move and Marker; close view: Gather, Poste, Marker) are driven by the shell around the Stage view.
- **Debrief timeline.** `DebriefTimeline.tsx` draws the scent-Stage `timeline` from the payload.
- **Trail order.**
  - Worlds are ordered by `worldNumber` and carry `unlockedBy`.
  - Within a World, Stretches and their Stops are ordered lists (`stopsOf`, `nodeIdsOf` in `src/shell/world.ts`).
  - A Node appears at most once across all trails (world-progression spec).
  - The guided first Stage (`INTRO_NODE`, `intro-node`) and the Taste Stage are not on the trail. The Daily Stage (`generateDailyStage`) has no Node.
- **Existing precedent.** "Theory and how-to-play precede the Node that uses them" (world-progression) already sequences *controls* by trail order. Cues are already per scenario (`scenario.cues`).
- **Where the kinds are taught.** On the beta trail, a followed turn is taught by `theory-unpredictable-walks` before `park-unpredictable` (World 6, `recall`), and the Poste by `theory-poste` before `poste-practice` (World 2, `home`). Existing Stage Meters in World 6 give Meter Points for `granted-sniff`, `check-in-after-change`, `fresh-move`, `chain`, `waited-plant`, `waited-marking`, `check-in-hit`, `leave-it-food` and `smart-jackpot`.

## Goals / Non-Goals

**Goals:**
- One pure function decides the Introduced set, from content plus (for the Daily Stage only) completed Nodes, and is table-tested.
- The sim and its payloads stay byte-identical (ADR 0002). The gate lives in the HUD and the shell.
- Adding a new action kind later forces a decision: the starting set or a Node that Introduces it. Validation and the format-guide drift test catch omissions.

**Non-Goals:**
- Hiding Cue buttons, the Jackpot button (it already follows the Stage's Jackpot budget, which only World 6 Nodes have) or the telegraph pieces.
- Hiding the Dog's eye contact after a followed turn: in the sim it is a real Check-in the player may mark, so hiding it would score an unseen moment.
- A separate "new feedback unlocked" announcement: the first-time Hint of a newly Introduced kind is the announcement.
- Per-player reading history (Lessons read) as the source.
- Changing which kinds exist, their texts, tiers or icons.

## Decisions

### 1. Content declares `introduces` on Nodes, cumulative in trail order

`node.yaml` gains an optional `introduces: [<kind>, ...]`. For a trail Node, the Introduced set is:

- `STARTING_KINDS`;
- plus the `introduces` lists of every Node at or before it in (worldNumber, Stretch, Stop) order.

This is the user's choice, made in planning. Alternatives:
- **Lessons Introduce, once read:** depends on each player's history, so replaying an early Node could differ between players. It is also harder to test, and validation can't check it.
- **A per-Node allowlist:** the most authoring work, and a forgotten kind silently disappears.

Trail order also keeps replays honest: an early Node stays simple even for an advanced player.

### 2. Starting set is a constant in `src/sim/feedbackKinds.ts`

`STARTING_KINDS` contains: `marker-hit`, `check-in-hit`, `disengagement`, `missed-reward-window`, `late-marker-press`, `reactive-marker`, `wasted-marker`, `missed-opportunity`, `rigid-pull`.

It sits beside `FEEDBACK_ACTION_KINDS`, so adding a kind is reviewed next to the starting set. It is data only, and nothing in the sim reads it.

### 3. Initial introductions (beta)

| Node (World) | `introduces` |
|---|---|
| `poste-practice` (2) | `poste`, `harsh-stop` |
| `walk-distraction` (3) | `go-sniff`, `go-sniff-cut-short` |
| `leave-it-intro` (4) | `wrong-cue`, `leave-it-food`, `food-eaten` |
| `park-nose-on` (6) | `granted-sniff`, `empty-sniff`, `scent-dragged-past` |
| `park-unpredictable` (6) | `followed-turn`, `fresh-move`, `repeated-move-ignored`, `check-in-after-change`, `chain`, `sintonia` |
| `park-plant-mark` (6) | `waited-plant`, `dragged-plant`, `waited-marking`, `interrupted-marking`, `smart-jackpot`, `wasted-jackpot` |

Go Sniff is Introduced at `walk-distraction` because the how-to-play Lesson `howto-walking`, just before it in World 3, teaches the button, and the `go-sniff` spec already offered it from World 3. Moving it later (to `park-jogger`) was considered and rejected for now: it would mean rewriting that Lesson in both languages. It can move during playtest if World 3 still feels crowded.

`sintonia` stays with `park-unpredictable`: Sintonía rewards following unpredictable walking, which that Node teaches.

Every existing World 6 meter kind is Introduced at or before its Node:
- `park-keep-fresh` uses `fresh-move` and `chain` after `park-unpredictable`.
- `park-not-that-one` uses `smart-jackpot` and `leave-it-food`, both already Introduced.

So the meter rule passes on today's content.

Stable gets the same lists only through the normal beta → stable promotion. Until then, the stable warning lists the kinds no stable Node Introduces, and stable players see only the starting set for those kinds.

### 4. One helper in the shell, one optional field on the bridge

The helper is `introducedKinds(context)` in `src/shell/introductions.ts`. The context is one of:
- `{ kind: 'node', nodeId }`
- `{ kind: 'taste' }`
- `{ kind: 'first' }`
- `{ kind: 'daily', completedNodes }`

It takes worlds and nodes as defaults, like `world.ts`. A Node not on any trail (a library or home item) uses the starting set plus its own `introduces`. The Daily Stage uses the Nodes the player has completed because it has no place on the trail; its score and payload do not change with it.

`startStage` sends `introducedKinds` in the `start` message:
- `StageScene` passes it to `FeedbackDecider`.
- An absent field means every kind is Introduced, which keeps old bundles, sim tests and the Barkdoku or other harnesses unchanged.

The decider drops a not-Introduced event before any Combo, Hint or seen logic. That way it neither joins nor ends a Combo, and is never recorded in `seenHints`. The shell uses the same set for:
- the Poste event Hint;
- Coach marks (a control maps to the kinds it can produce: movement → `rigid-pull`; Marker → the Marker kinds; Poste → `poste`; Gather → always, since it has no kind of its own and only exists in close exercises after `poste-practice`);
- the Debrief timeline filter.

`StageScene` also uses the set for the Go Sniff offer: when `go-sniff` is not Introduced, it draws no Go Sniff button or prompt and ignores the Go Sniff keyboard shortcut. The sim keeps its own World check (`FIRST_WALKING_WORLD` in `src/sim/sim.ts`) unchanged, so payloads stay byte-identical (ADR 0002). On the trail both rules agree; they differ only in a new player's Daily Stage, where the button stays hidden, so no Go Sniff input reaches the sim.

Alternative: filtering in the sim. Rejected, because it would change payloads and meters (ADR 0002 / ADR 0036).

### 5. Validation in `validator.ts`

The validator walks the channel's trail once and computes the cumulative set per Node. It reports:

- **Errors:**
  - an `introduces` entry that is not a key of `FEEDBACK_ACTION_KINDS`;
  - an entry already in `STARTING_KINDS`;
  - a kind Introduced by two Nodes, naming both;
  - a Stage Meter `meterPoints` kind not in its Node's cumulative set.

  The meter check runs only in a channel where at least one Node has `introduces`. Stable has none until the lists are promoted, and its World 6 meters give points for kinds it does not yet Introduce, so checking it would fail validation of the content players have today. Once any Node in a channel Introduces something, the check applies in full.
- **Warning:** each kind neither in `STARTING_KINDS` nor Introduced anywhere in the channel.

`content/FORMAT.md` documents the field and lists both sets. The format-conformance test compares that list with `FEEDBACK_ACTION_KINDS`.

### 6. Docs

- **GLOSSARY:** add "Introduced action" under Training: "a kind of handled action a walking Stage answers, because it is in the starting set or a Node on or before it on the trail Introduces it".
- **ADR 0036:** "Walk feedback follows the trail and is presentation only".

## Risks / Trade-offs

- **[Risk] A new kind added without an introduction silently never shows.** → The channel warning plus the guide-drift test, and the code comment on `FEEDBACK_ACTION_KINDS`.
- **[Risk] The guided first Stage loses the Poste Hint, which some players used to discover the Poste.** → The how-to-play Lesson before the first walking Node still covers the Poste. The Poste Feedback returns at `poste-practice`, which is before World 3's walks.
- **[Trade-off] The Daily Stage differs by player progress, unlike Nodes.** → This is intended: the Daily Stage has no trail place. Its score and payload are unchanged, so leaderboards are not affected.
- **[Risk] Stable shows fewer messages until the lists are promoted.** → The proposal accepts this. It is the conservative direction.

## Migration Plan

1. Ship the code with `introduces` read as optional.
2. Add the lists to beta.
3. Validate and playtest.
4. Promote to stable with the usual release check.

There is no data migration. `seenHints` keeps its meaning.

**Rollback:**
- Removing the `introduces` lists brings back the earlier behaviour only for kinds in the starting set.
- A full rollback means not sending `introducedKinds`: the absent field means every kind is Introduced.

## Open Questions

None. Placements of single kinds (for example Go Sniff or Sintonía) can move later in content alone, during playtest.
