# LeadMate

An educational app that works as a "flight simulator" for dog owners: short simulated walks build leash-handling reflexes and timing.

## Language

Terms here are the canonical names used in code and documentation. Each language's text catalog chooses its own user-facing wording for them.

**Handler**:
The avatar the user controls, holding the leash.
_Avoid_: Player, owner, human

**Dog**:
The virtual dog on the other end of the leash, with its own behavior.
_Avoid_: Pet, puppy

**Distractor**:
Anything in the scene that draws the dog's attention, such as a skateboarder.
_Avoid_: Stimulus, trigger

**Stage**:
One playthrough of a scenario, from start to its end condition.
_Avoid_: Level, run, session

**Drive**:
What the Dog wants at a given moment, such as reaching a Goal, following a scent, chasing, or wandering. A scenario can blend several Drives.
_Avoid_: Motivation, interest, AI

### Leash

**Tension Ratio**:
The distance between Handler and Dog divided by the maximum leash length.

**Slack**:
Tension Ratio below 0.85; the leash hangs in a relaxed curve.

**Taut**:
Tension Ratio from 0.85 to 1.0.

**Rigid Pull**:
Tension Ratio above 1.0.

**Poste**:
The technique of stopping the Handler so the leash origin is anchored and the Dog cannot advance past the leash limit.
_Avoid_: Tree, anchor

### Dog attention

**Fixation**:
The Dog locking its attention on a Distractor.

**Disengagement**:
The Dog breaking its Fixation on a Distractor.

**Reward Window**:
The 1.0 to 1.2 seconds after Disengagement in which pressing the Marker earns credit.

**Marker**:
The button, and the act of pressing it, that signals the Dog did the right thing at that instant.
_Avoid_: Mark, click, treat button

**Cue**:
A signal the Handler gives the Dog before it reacts, such as "Let's go" or "Aquí", to steer its attention. Unlike the Marker, a Cue is proactive.
_Avoid_: Command, call, order
