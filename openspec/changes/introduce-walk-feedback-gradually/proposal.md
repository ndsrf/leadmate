# Proposal

## Why

Every walking Stage answers every handled action from the first walk on. For example, "Nice turn!" with its paw icon appears in World 1–3 although following a turn is only taught by the Unpredictable walks Lesson in World 6. The user's manual check after the first-session changes found the early walks crowded: "initially we need to focus on a few things and we add UI and points as needed." The trail already introduces controls gradually (a how-to-play Lesson precedes the first Node that uses a control), but the feedback a walk gives does not follow the trail.

## What Changes

- Add **Introduced actions**: the kinds of handled action a walking Stage answers.
  - A small **starting set** is always Introduced: leash tension (Rigid Pull) and the Marker on a Disengagement or a Check-in, with their right and wrong forms.
  - Every other kind is Introduced by exactly one walking or Minigame Node, through a new optional `introduces` list in `node.yaml`. Examples: Poste and harsh stop by `poste-practice`, Go Sniff by `walk-distraction` (the first walking Node, after the how-to-play Lesson that teaches the button), Cue mismatch by `leave-it-intro`, the scent-walk kinds by the World 6 Nodes, and a followed turn by `park-unpredictable`.
- Which kinds a Stage answers is decided by content alone, in trail order:
  - A Node's Stage answers the starting set plus everything Introduced by that Node or by any Node before it on the trail.
  - The Taste Stage and the guided first Stage answer only the starting set.
  - The Daily Stage answers the starting set plus everything Introduced by Nodes the player has completed.
- Before a kind is Introduced, the system shows nothing for it: no Feedback Message, Hint, icon, effect, sound or haptic. It does not count as a Combo and is not recorded as seen in `seenHints`. The event Hint of a not-yet-Introduced kind (the Poste Hint) also waits.
- Content validation:
  - **Errors:** an unknown kind in `introduces`; a kind Introduced twice or already in the starting set; a Stage Meter that gives Meter Points for a kind not yet Introduced at that Node.
  - **Warning:** a kind that no Node Introduces in the channel.
- The Go Sniff button, its prompt and its keyboard shortcut are offered only where Go Sniff is Introduced. This replaces the World 3 rule of the `go-sniff` spec with the same effect on the trail, and also keeps the button out of a new player's Daily Stage. The Dog still sniffs on its own; the sim keeps its World check.
- No separate announcement: the first-time Hint of a newly Introduced kind is its announcement.
- Control Coach marks are drawn only for controls whose actions are Introduced at that Stage. Today's marks (movement and Marker in walks; Gather, Poste and Marker in close exercises, which all come after `poste-practice`) all qualify, so the change is a rule for future marks.
- **Not changed:**
  - The simulation, its seeded payloads, meters, handling score and Stars: the gate is presentation only (ADR 0002).
  - The telegraph pieces (Approach ring, Check-in arc, Marker highlight), which keep following the Timing assist.
  - The other controls a Stage offers: Cues stay per scenario, and the Jackpot button keeps following the Stage's Jackpot budget.

## Capabilities

### New Capabilities
- `walk-introductions`: the Introduced actions of a walking Stage, which comprise:
  - the starting set;
  - `introduces` on Nodes and the trail-order rule;
  - the Taste, guided first and Daily Stage rules;
  - the content validation of introductions.

### Modified Capabilities
- `stage-action-feedback`: Right, wrong and scent-walk Feedback Messages, and event Hints, are shown only for Introduced actions; a not-yet-Introduced kind is not recorded as seen.
- `stage-meters`: content validation rejects a Stage Meter whose Meter Points come from a kind not yet Introduced at its Node.
- `first-run-coaching`: Control Coach marks only for controls whose actions are Introduced.
- `go-sniff`: the contextual Go Sniff button is offered only where Go Sniff is Introduced, instead of from World 3 onward.
- `content-packs`: the Node format gains `introduces`, and validation reports bad introductions.

## Impact

- **Content:** `src/shell/content/schema.ts`, `parser.ts`/`resolver.ts`, `validator.ts`, `content/FORMAT.md`; `introduces` lists in beta Node files (`walk-distraction`, `poste-practice`, `leave-it-intro`, `park-nose-on`, `park-unpredictable`, `park-plant-mark`); stable later, through the normal promotion.
- **Shell:** a pure `introducedKinds(nodeId | 'taste' | 'first' | 'daily', progress)` helper beside `src/shell/world.ts`; App passes the set into the Stage start options.
- **HUD:** `FeedbackDecider` (`src/hud/feedback.ts`) takes the Introduced set; event Hints and Coach marks consult it; `StageScene` hides the Go Sniff button when Go Sniff is not Introduced.
- **Bridge:** one optional field on the Stage start message; the sim and `src/sim/` payloads are untouched.
- **Docs:** a GLOSSARY entry for "Introduced action"; ADR 0036 (feedback follows the trail, presentation only).
- **Tests:** helper table tests, validator tests, FeedbackDecider tests, a payload-identity test.
- **Out of scope:** hiding Cue buttons or the Jackpot button, gating the telegraph pieces, and the Dog's eye contact after a turn (a real Check-in in the sim).
