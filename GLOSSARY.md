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

**Pathway**:
The ordered sequence of waypoints that defines the walkable route corridor of a Stage.
_Avoid_: Route, track, road

**Boundary**:
A solid obstacle segment (such as an apartment wall or house facade) that blocks movement, occludes line of sight, and anchors corner leash wraps.
_Avoid_: Wall collision, invisible wall

**Obstacle**:
A prop with a footprint (such as a bench, a tree or a lamp post) that blocks movement and anchors leash wraps like a Boundary, but does not block sight unless it is also a Visual Shield.
_Avoid_: Collider, solid prop

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
A signal the Handler gives the Dog before it reacts, such as "Let's go" or "Aquí", to steer its attention. Unlike the Marker, a Cue is proactive. "Let's Go" reorients a Dog on something that moves; "Leave It" (from World 3) lets a Dog go of food on the ground. Only the matching Cue works.
_Avoid_: Command, call, order

### Training

**Node**:
One lesson unit: Theory Primer, Checkpoint, Interactive Simulation, Debrief. A Node's Interactive Simulation is one Stage (walking) or one Minigame (static).
_Avoid_: Lesson, level

**Theory Primer**:
The first step of a Node: a concise 30-60 second sequence of tappable cards establishing lesson concepts.
_Avoid_: Intro, slideshow

**Dual-Aspect Primer**:
A Theory Primer structured into foundational real-world canine training theory followed by virtual dog simulation guidance.
_Avoid_: Theory split, dual tutorial

**Canine Posture**:
The observable physical stance and ear/tail orientation of the virtual Dog (e.g. standing alert, straining against leash, settling, resting on mat) that acts as the primary behavioral cue in Minigames and Stages.
_Avoid_: Dog sprite, animation frame

**Tutorial Link**:
An optional external URL declared on a Theory Primer card pointing to web-hosted instructional articles, illustrations, or video tutorials, viewable in an in-app browser with graceful offline placeholders.
_Avoid_: Webview modal, external resource

**Minigame**:
The static Interactive Simulation of a Node, such as a Tap & Hold or timing exercise. It is not a Stage and does not change the Dog's Learning Attributes.

**Checkpoint**:
The 5-second timed quiz between the Theory Primer and the Interactive Simulation.
_Avoid_: Quiz, test

**Arousal**:
How worked up the Dog is during a Stage, from 0 to 100. It rises near Distractors and during Rigid Pull, and it starts at 0 each Stage.
_Avoid_: Excitement, stress

**Learning Attributes**:
The persistent values that describe how the Dog has learned from the Handler: reconnection latency, reactivity threshold, follow chance and check-in frequency.
_Avoid_: Stats, skills

**Rusty Dog**:
The Dog's state after a gap of days. An optional easy warm-up walk restores its full stored capacity for the session; absence never lowers Learning Attributes.

**Trigger Profile**:
The Dog's starting personality: for each kind of Distractor, how strongly this Dog reacts to it, taken from what the owner reports about their real dog. Training can lower a level over time but never raises it.

**Diagnostic**:
The 15-second onboarding Minigame that measures the user's reaction latency. It seeds the Dog's starting reconnection latency once and is not a Stage.
_Avoid_: Mini-playtest, test

**Walk Plan**:
The personalized sequence of Nodes suggested to a new user after the Diagnostic, shown with the diagnostic card before the soft paywall.
_Avoid_: Curriculum, schedule

**Hint**:
A one-shot, non-blocking message shown over a Stage the first time a simulation event happens (the leash first Taut, the Dog first Fixated, the leash first at its limit). A seen Hint is not shown again.
_Avoid_: Tutorial, tooltip

**Level config**:
A remote scenario override published for a Node's Stage, validated like a bundled scenario and recorded as `configVersion` in the Stage payload. The name follows the Supabase table; it is not a Stage. Daily Stages never use one.

**Equipment**:
The collar or Y-harness the Dog wears. Each has benefits and costs: the collar carries leash signals more clearly but raises Arousal faster, while the Y-harness is gentler but the Dog responds less to leash signals.

**Voice Pack**:
A set of Cues, with one version per supported language, that the Handler can choose from.

### Engagement and progression

**Reaction Tier**:
The Dog's behavioral state driven by Arousal: Calm, Alert, or Reactive.
_Avoid_: Reaction stage, emotional level

**Sintonía**:
A state of handling flow achieved by keeping the leash in Slack through continuous, smooth walking arcs.
_Avoid_: Sync combo, flow mode

**Go Sniff**:
A decompression Cue offered after resolving a high-Arousal encounter, directing the Dog to sniff and rapidly dissipate Arousal.
_Avoid_: Sniff button, treat break

**World**:
A themed grouping of Nodes with distinct environment rules and mechanics.
_Avoid_: Chapter, zone, campaign level

**World Map**:
The main screen: all Worlds laid out as a path of Nodes showing which are locked, open, next up or completed, with each Node's Stars.
_Avoid_: Home, level select, menu

**Star**:
A 1 to 3 rating of how well a Node was handled, earned at completion and kept at its best. It reflects handling quality only and never unlocks anything.
_Avoid_: Medal, rank, points

**Daily Stage**:
A procedurally generated Stage that changes every 24 hours and is shared by all users on a given date, protecting the Streak and warming up a Rusty Dog without mutating Learning Attributes.
_Avoid_: Daily level, daily run

**Streak**:
The number of consecutive calendar days on which the user completed a qualifying activity: a Node, Daily Stage, or Walk Diary entry.
_Avoid_: Habit counter, day streak

**Walk Diary**:
A one-tap log of the real-world homework assigned in a Node's Debrief, which credits the Streak.
_Avoid_: Homework log, walk notes

**Scenery Set**:
The props a scenario declares to match its environment theme (indoor apartment, quiet suburb, urban street, open park), dense enough to feel lived in and varied in type. A prop may be an Obstacle, a Visual Shield, both, or neither; the Scenery Set also includes the Ground Cover that gives each zone its look.
_Avoid_: Decoration, background

**Ground Cover**:
Flat decoration painted on the ground of a Stage (such as paving, carpet, a rug, a path, a flower patch or painted lines) that never blocks movement or sight and has no effect on the simulation.
_Avoid_: Floor prop, decal

**Visual Shield**:
A prop in a Stage (such as a parked car) that breaks the Dog's line of sight to a Distractor, stopping Arousal accumulation.
_Avoid_: Cover, screen, barrier
