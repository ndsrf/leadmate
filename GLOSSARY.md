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
Something in the scene that raises the Dog's Arousal and can cause a Fixation, such as a skateboarder, another dog or a hand offered to the Dog. Food is a Distractor that also smells.
_Avoid_: Stimulus, trigger

**Stage**:
One playthrough of a scenario, from start to its end condition.
_Avoid_: Level, run, session

**Shell**:
The React Native app around the Stage view: the screens, navigation, audio, storage and accounts. It sends a Stage's configuration in and receives the Debrief payload out.
_Avoid_: App layer, UI layer

**Stage view**:
The live container in which the simulation bundle runs a Stage. It exists only around a Node flow that contains a Stage, never behind the World Map or a Minigame, and is not the Stage itself.
_Avoid_: WebView, sim, player

**Drive**:
What the Dog wants at a given moment, such as reaching a Goal, following a scent, chasing, or wandering. A scenario can blend several Drives.
_Avoid_: Motivation, interest, AI

**Scent Spot**:
A place in the scene that pulls the Dog's nose without raising its Arousal, such as the base of a lamp post or a bush. It stops pulling once the Dog has sniffed it.
_Avoid_: Smell, sniff point, Distractor

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
The distance between Handler and Dog divided by the maximum leash length (or Effective Leash Length when gathered).

**Slack**:
Tension Ratio below 0.85; the leash hangs in a relaxed curve.

**Taut**:
Tension Ratio from 0.85 to 1.0.

**Rigid Pull**:
Tension Ratio above 1.0.

**Poste**:
The technique of stopping the Handler so the leash origin is anchored and the Dog cannot advance past the leash limit.
_Avoid_: Tree, anchor

**Effective Leash Length**:
The active unfolded length of the leash in an exercise, against which Tension Ratio is calculated.
_Avoid_: Working length, gathered length

**Leash Gathering**:
The deliberate action of shortening the Effective Leash Length to manage distance without creating Rigid Pull.
_Avoid_: Reeling, pulling in, shortening (alone)

### Dog attention

**Fixation**:
The Dog locking its attention on a Distractor.

**Disengagement**:
The Dog breaking its Fixation on a Distractor.

**Reward Window**:
The 1.0 to 1.2 seconds after Disengagement in which pressing the Marker earns credit.

**Marker**:
The button, and the act of pressing it, that signals the Dog did the right thing at that instant.
_Avoid_: Click, treat button

**Mark**:
One unit of a Stage's Marker budget: each Marker press spends one Mark, whatever it hits.
_Avoid_: Treat, click

**Marker timing grade**:
How quickly a Marker press that hits followed the start of its window: Perfect or Good.
_Avoid_: Accuracy rating, timing score

**Late Marker press**:
A Marker press that comes just after a Reward Window or Check-in window closed. It spends a Mark and rewards nothing.
_Avoid_: Late mark, miss

**Approach ring**:
A ring drawn around the Dog during a Fixation that closes onto the Dog as the Handler holds the calm, landing on the moment the Disengagement opens the Reward Window. It snaps back open when the calm is broken.
_Avoid_: Timing circle, target ring, beat ring

**Timing assist**:
How much help the user gets to time the Marker during a Stage: Full, Ring only, Late ring or Off. It steps down after a run of Marker hits and back up after a run of misses or Late or early presses, and it is kept with the Dog.
_Avoid_: Difficulty, assist mode, easy mode

**Cue**:
A signal the Handler gives the Dog before it reacts, such as "Let's go" or "Aquí", to steer its attention. Unlike the Marker, a Cue is proactive. "Let's Go" reorients a Dog on something that moves; "Leave It" (from World 3) lets a Dog go of food on the ground. Only the matching Cue works.
_Avoid_: Command, call, order

**Check-in**:
The Dog glancing at the Handler of its own accord, which the Handler marks and rewards. Its frequency is one of the Dog's Learning Attributes. It is not a Mission check-in, where the user reports how a real walk went.
_Avoid_: Glance, look-back

**Handler Shielding**:
Positioning the Handler between the Dog and an oncoming Distractor to occlude line of sight and buffer Arousal, without physical contact.
_Avoid_: Body block, blocking, physical shield

### Training

**Node**:
One training unit: Theory Primer, Checkpoint, Interactive Simulation, Debrief. A Node's Interactive Simulation is one Stage (walking or close exercise), an Encounter Series (walking), or one Minigame (static).
_Avoid_: Level

**Encounter**:
A short walking set piece of about 10 to 20 seconds built around one situation and one decision, its Aim. Each attempt at it is one Stage, and an attempt can be retried at once with the same seed.
_Avoid_: Mini-stage, challenge, scene, level

**Encounter Series**:
The 3 to 5 Encounters, played in order, that make up a walking Node's Interactive Simulation in place of one long Stage. Not a Chain.
_Avoid_: Encounter chain, chain, sequence, set

**Aim**:
The one decision an Encounter tests: keeping the leash Slack, keeping the Dog below Reactive, marking a Disengagement or marking a Check-in. Not the Goal the Dog's Drive heads for.
_Avoid_: Goal, objective, task

**Paw**:
A 1 to 3 rating of one Encounter attempt: 1 for finishing it, 2 for meeting its Aim, 3 for meeting it cleanly. A Node played as an Encounter Series takes its Stars from the best attempt's Paws of each Encounter; Paws never unlock anything.
_Avoid_: Star, point, score

**Close Exercise Stage**:
A specialized close-view Stage focused on close-quarters canine exercises (such as leash handling drills) with exercise-specific controls rather than open-route joystick movement.
_Avoid_: Minigame, drill level, close drill

**Hand Drill**:
A Close Exercise Stage in World 1 whose Distractor is a hand held near the Handler. The Handler keeps the Dog calm around it with Gather, Poste and the Marker, then releases for a reward. It cannot be failed: a lunge lowers the score and never ends it.
_Avoid_: Bite exercise, bite training

**Gather**:
Shortening the working leash with the Handler's hands so the Dog stays close, without a jerk or a lift.
_Avoid_: Reel in, yank, pull back

**Age Band**:
The Dog's life stage, chosen in early onboarding (and editable in Dog setup) and optional: puppy, adolescent, adult or senior. It tailors copy, tuning, and adds life-stage companion Satellite Stops; a Dog with no Age Band gets neutral copy.
_Avoid_: Age group

**Theory Primer**:
The first step of a Node: one or two short cards recapping the Lessons that precede the Node on the trail.
_Avoid_: Intro, slideshow

**Lesson**:
A standalone piece of theory reading, a vertical sequence of text, image, Lesson Video and tip blocks, either a theory Lesson (training the real dog) or a How-to-play Lesson. It is never part of a Node, can always be opened from the Theory Library, and may also sit on the trail as a Stop.
_Avoid_: Article, guide, Node

**Lesson Video**:
A block in a Lesson that plays, on the user's tap, either a Lesson Animation or a YouTube video. A Lesson may hold several.
_Avoid_: Embed, player

**Lesson Animation**:
A short, silent, looping clip of our own, drawn in the Lesson illustration style, that shows the one idea of a Lesson's steps.
_Avoid_: Animation (alone), clip, GIF

**Animation Timeline**:
The small file hosted next to a Lesson Animation that records when each of its beats and Lines happens. It carries times only, never text; a missing or invalid one only drops the subtitles.
_Avoid_: Subtitle file, captions, VTT

**Line**:
A short word the Person says in a Lesson Animation, such as «vamos» or «bien», shown by the app as a subtitle during its time range, with its text from the catalog. A Line may be marked as the Handler's Cue or the spoken Marker word.
_Avoid_: Cue, subtitle cue

**How-to-play Lesson**:
A Lesson that teaches the simulator's controls and how to read the virtual Dog, the first Stop of World 1, which every Node that asks the user to read the virtual Dog needs read first.
_Avoid_: Tutorial, controls screen

**Theory Library**:
The list of all Lessons in a fixed order, reached from the World Map, kept as a reference shelf. The oldest unread Lesson whose suggested Day has arrived is marked "for today".
_Avoid_: Course, curriculum

**Dual-Aspect Primer**:
A Theory Primer structured into foundational real-world canine training theory followed by virtual dog simulation guidance.
_Avoid_: Theory split, dual tutorial

**Canine Posture**:
The observable body language of the virtual Dog (where it looks, its head, ears and tail, and what it is doing, such as sniffing, planting or straining) that acts as the primary behavioral cue in Minigames and Stages. In a walking Stage it is drawn on the Dog and on the Dog portrait.
_Avoid_: Dog sprite, animation frame, body state

**Dog portrait**:
The close-up of the Dog shown in the corner of a walking Stage, drawing its Canine Posture in detail.
_Avoid_: Dog cam, avatar, inset

**Tutorial Link**:
An optional external URL declared on a Theory Primer card pointing to web-hosted instructional articles, illustrations, or video tutorials, viewable in an in-app browser with graceful offline placeholders.
_Avoid_: Webview modal, external resource

**Dog Game**:
A real-world activity with the real dog (such as scent games, impulse-control games, enrichment or tricks), delivered as Content in the pack. It is not a Minigame and is not played with the virtual Dog.
_Avoid_: Minigame, game (alone)

**Minigame**:
The static Interactive Simulation of a Node (a Tap & Hold exercise, a scene of Action beats in which the user reads the Dog and picks an action, or a spatial deduction puzzle), or a round of Read the Dog. It is not a Stage and does not change the Dog's Learning Attributes.
_Avoid_: Dog Game

**Action beat**:
One step of an action Minigame: the Dog shows one Canine Posture and exactly one of the offered actions is right for it.
_Avoid_: Round, turn, question

**Read the Dog**:
A short timed Minigame in which the Dog shows one Body Signal at a time and the user names its Signal Class before a timer runs out. The onboarding Diagnostic is played as a round of it.
_Avoid_: Read Dog, readDog, reflex test, quiz

**Body Signal**:
One Canine Posture shown by the Dog in Read the Dog, such as a lip lick, a freeze or a play bow, with exactly one Signal Class.
_Avoid_: Signal (alone), Cue, beat, state

**Signal Class**:
What a Body Signal usually means: Calm, Alert or About to react. It is the reading of a pose, not the Dog's Reaction Tier.
_Avoid_: Reaction Tier, tier, category

**Barkdoku**:
A spatial deduction Minigame on an N x N partitioned grid where the Handler distributes Dogs across color zones to respect Reactivity Thresholds and break direct line-of-sight Fixation. Shown to Spanish users as "Guaudoku".
_Avoid_: Zona de Calma, Meowdoku, Queens, dog puzzle, Star Battle

**Daily Barkdoku**:
The Barkdoku board of the day, chosen by date and opened from the Map Header. It credits the Streak and is not a Node.
_Avoid_: Zona de Calma, Daily Calm Zone, daily puzzle

**Plus Board**:
An additional, distinct Barkdoku board available to users with Plus membership after completing the date's Daily Barkdoku. Solves are logged in the Activity Log and evaluated against Target Time, but do not overwrite the Daily Solve Time or duplicate Streak credit.
_Avoid_: Extra puzzle, bonus board, premium level

**Solve Time**:
The active play time of one Barkdoku attempt, from its first tap to its solve, excluding time with the app in the background. A reset or retry starts a new attempt.
_Avoid_: Duration, completion time

**Target Time**:
The Solve Time a non-tutorial Barkdoku board asks for; meeting it is required for 3 Stars. Tutorial boards have none.
_Avoid_: Par, goal time, time limit

**Daily Solve Time**:
The Solve Time of the first solve of a date's Daily Barkdoku. Subsequent solves that day are practice (for Free Tier users) or Plus Boards (for Plus members) and do not overwrite it.
_Avoid_: Best Solve Time, best time, record

**Checkpoint**:
The timed quiz between the Theory Primer and the Interactive Simulation, timed at 15 seconds by default (configurable in Settings).
_Avoid_: Quiz, test

**Image Duel**:
A Checkpoint question that shows two pictures stacked top and bottom, where the user taps the better handling. The order is shuffled, and the right and wrong marks appear only after the answer.
_Avoid_: Picture quiz, A/B question

**Pause Menu**:
The menu shown over a paused Stage, offering Resume and Exit (which skips the Stage to its Debrief or results with completion credit).
_Avoid_: Resume overlay, pause screen

**Stage Back Control**:
The fixed on-screen control in the top-left safe area of an active Stage that immediately aborts loading without penalty before play begins, and opens the Pause Menu once the simulation runs.
_Avoid_: Simulator back button, pause button, exit HUD

**System Back**:
The platform back gesture or hardware button on supported operating systems, which identically follows the topmost screen's registered back closure, pauses an active Stage, or exits the application from root screens.
_Avoid_: Hardware back, back button (alone), Android back

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

**Concern**:
Anything the owner reports about their real dog as a problem: a reaction to a kind of Distractor (kept in the Trigger Profile) or a Home Behaviour. Each has a level from a little to a lot.

**Home Behaviour**:
A Concern that happens at home rather than on a walk: biting the owner, biting other people, barking at home, destroying things, eating things that are not food such as socks, and being left alone. It never enters a Stage; all but the two biting ones have a Minigame Node. Being left alone covers distress or misbehaviour that appears only while the owner is away; the same barking or damage when the owner is present belongs to the other Home Behaviours. It is never asked in onboarding: the owner is asked once in the app (the Alone Check). Its Stretch is a Home Stretch.

**Main Concern**:
The up to three Concerns the owner picks as their biggest problems, most worrying first. They are asked once, before the Taste Stage; the first outdoor one decides which Distractor the Taste Stage uses, and together they decide what the Personal Plan puts first.

**Diagnostic**:
The onboarding Read the Dog round whose reaction latency seeds the Dog's starting reconnection latency once. Replays from its result never change that latency, and it is not a Stage.
_Avoid_: Mini-playtest, test

**Personal Plan**:
The ordered list of Stretches suggested to a new user after the Diagnostic, built from their Concerns, the Dog's age and the Diagnostic result, with the reason for each item. It is shown with the diagnostic card before the guided first Stage and decides where the World Map says to start. Biting always comes first.
_Avoid_: Walk Plan, curriculum, schedule

**Feedback Message**:
A short, non-blocking message with an icon, effect and sound that tells the user, right after an action in a Stage or an answer in Read the Dog, what they did right or wrong and what to try instead.
_Avoid_: Toast, popup, notification

**Hint**:
The first-time, fuller form of a Feedback Message, shown the first time that kind of action or event happens for the Dog (for example the leash first Taut). A seen Hint is not shown again; later the short form is shown.
_Avoid_: Tutorial, tooltip

**Introduced action**:
A kind of handled action a walking Stage answers, with feedback and points, because it is in the starting set (leash tension and the Marker) or a Node at or before that Stage on the trail Introduces it. Before that, the walk shows nothing for it.
_Avoid_: Unlocked feedback, enabled kind, taught action

**Dog sign**:
A mark drawn over or around the Dog in a Stage that shows its state: the yellow "!" of a Fixation, the circle of Alert, the eye and gaze line of looking at the Handler, the sound arcs of barking, the scent dots of sniffing, the green glow of Sintonía and the drifting cloud of Autopilot. It is not a Feedback Message (a reaction to the user's action) or a Hint (the first-time text that explains a sign).
_Avoid_: Indicator, icon, emote, status icon

**Coach mark**:
A drawn, non-blocking pointer with a short label over a Stage control (the movement control, the Marker), shown to a new user from the start of a Stage rather than after an event, and dismissed by using that control. Not a Hint.
_Avoid_: Tutorial, tooltip, overlay

**Level config**:
A remote scenario override published for a Node's Stage, validated like a bundled scenario and recorded as `configVersion` in the Stage payload. The name follows the Supabase table; it is not a Stage. Daily Stages never use one.

**Equipment**:
The collar or Y-harness the Dog wears. Each has benefits and costs: the collar carries leash signals more clearly but raises Arousal faster, while the Y-harness is gentler but the Dog responds less to leash signals.

**Breed**:
The Dog's kind, chosen from a closed catalog that includes "Mestizo" and "Otra raza". It sets the Dog's silhouette, a typical weight range and a default Coat, and it never changes simulation behavior.
_Avoid_: Race, type

**Coat**:
The Dog's colour, chosen from a fixed palette of named colours. It changes how the Dog looks, never how it behaves.
_Avoid_: Fur, skin

**Voice Pack**:
A set of Cues, with one version per supported language, that the Handler can choose from.

**Content Pack**:
The folder tree of Worlds, Lessons, Nodes, Missions, their text in each language and their media that the app shows, edited as plain files and published without an app release. It never holds interface text or code, and is not a Voice Pack.
_Avoid_: Level pack, content bundle

**Content Channel**:
Which published Content Pack the app follows: Stable for everyone, Beta for testers. A device setting, not part of the Dog record.
_Avoid_: Release train, environment

### Engagement and progression

**Reaction Tier**:
The Dog's behavioral state driven by Arousal: Calm, Alert, or Reactive.
_Avoid_: Reaction stage, emotional level

**Sintonía**:
A state of handling flow achieved by keeping the leash in Slack through continuous, smooth walking arcs.
_Avoid_: Sync combo, flow mode

**Go Sniff**:
The release Cue that ends structured walking and lets the Dog sniff freely, rapidly dissipating Arousal. A Handler may give it at any time on a real walk. In a Stage with Scent Spots it is available at any time with a Slack leash; in other Stages it is only offered after resolving a high-Arousal moment with a Distractor.
_Avoid_: Sniff button, treat break

**Unpredictable Walk**:
Walking in which the Handler varies direction, pace and stops, so the Dog keeps choosing the Handler instead of following a routine on autopilot. "Let's Go" marks the structured part and Go Sniff releases it. It is taught in World 6, and the Handler never yanks or repeats a Cue to make it work.
_Avoid_: Random walk, zig-zag walk

**Autopilot**:
How far the Dog has stopped paying attention to the Handler because the walk has become routine: it grows while the Handler keeps the same heading and pace, and drops when the Handler changes direction, pace or stops. In a Stage it is telegraphed by the Dog looking away in its portrait and the drifting cloud Dog sign, distinguishing a tuned-out dog from a calm, attentive one.
_Avoid_: Boredom, distraction level

**Novelty**:
How fresh one kind of change (a left or right turn, a U-turn, speeding up, slowing down, a stop) still is to the Dog. It drops each time the Handler repeats that change and recovers with time.
_Avoid_: Surprise, randomness

**Plant**:
The Dog stopping firmly at a strong Scent Spot to sniff, refusing to move on until it has finished. Not a Poste, which is the Handler's stop.
_Avoid_: Freeze, stall, refusal

**Combo**:
Right actions of the same kind made in quick succession inside a Stage, or right answers in a row in Read the Dog, counted together in one Feedback Message (for example "Nice turn x3"). Not the daily Streak.
_Avoid_: Streak, multiplier

**Chain**:
In an Unpredictable Walk, the full sequence of a change the Dog follows, a Marker press on its look, and the Handler then walking on with a Slack leash or giving Go Sniff.
_Avoid_: Combo, sequence bonus

**Jackpot**:
A high-value reward the Handler gives with its own small budget instead of a Mark, meant for hard moments.
_Avoid_: Super treat, bonus mark

**World**:
A themed trail of Stops, grouped into Stretches, with distinct environment rules and mechanics.
_Avoid_: Chapter, zone, campaign level

**Basics World**:
World 1, "Un perro es un perro": the indoor World before any leash work that teaches living with the Dog as a dog (its quirks have names, no humanising, home is for resting, calm before learning) through three universal Stretches with theory Lessons, static action Minigames and Home Missions. It never interleaves dynamic Home Stretches. Records with progress from before it existed have it marked complete.
_Avoid_: Prologue, World 0, tutorial world

**Named behaviour**:
A common dog behaviour owners often think is unique to their Dog, taught with its name, what it looks like, why it happens and a first step: the turtle (lying down fixed on an approaching dog, a warning sign rather than calm), zoomies, reacting to other dogs, redirected biting and nonstop barking.
_Avoid_: Quirk, problem behaviour, vice

**Send away**:
The Handler walking calmly into the Dog's space, with no eye contact, words or touch, until the Dog moves off; "Send to bed" is the same, until it goes to its bed. Never a physical correction.
_Avoid_: Push away, shoo, block

**Home Stretch**:
A Stretch about one Home Behaviour: a Lesson, a Node (none for the two biting ones) and a Mission. It is a Stop run of World 2 while the Dog has that Concern, so it gates World 2 like any Stretch, and otherwise it sits in Other Home Behaviours. A Home Stretch the user has started stays in World 2 even if the Concern is removed, and one declared after World 2 is complete stays in Other Home Behaviours.
_Avoid_: Home trail

**Alone Check**:
The one-time question the owner is asked in the app, once World 2 is unlocked, about how the Dog copes with being left alone. Any answer, "I don't know yet" included, closes it for good; it turns into a level for the Home Behaviour of being left alone (none for "very well" and "don't know"), and is never progress: no Stars, Streak or Diary entry.
_Avoid_: Survey, quiz, onboarding question

**Other Home Behaviours**:
The optional, collapsed-by-default section after World 2 that holds the Home Stretches of the Home Behaviours the Dog does not have as a Concern. It gates and counts toward nothing, all its Lessons, Nodes and Missions are playable, and "Ahora es un problema" moves a Home Stretch into World 2 at level 1. It is hidden when it would be empty.

**Home Mission**:
A Mission whose target is practised at home rather than on a walk; its brief, check-in question and success sign are worded for home. A Home Stretch's Mission is passed, owed and skipped like any other.
_Avoid_: Indoor homework

**Stop**:
One point on a World's trail: a Lesson, a Node or a Mission.
_Avoid_: Step, item, level

**Satellite Stop**:
A companion Lesson stop anchored alongside a Stretch's primary Stop on the World Map for specific life stages (such as puppy records). It does not belong to the linear spine, never gates Missions or World completion, and can be read at any time.
_Avoid_: Satellite waypoint, side quest, bonus stop, branch node

**Stretch**:
The run of Stops on a trail up to and including one Mission; the most a user can advance in a day without a Day Skip. Its Lessons are all open at once; its Node needs the Lessons read, and its Mission needs the Node.
_Avoid_: Session, leg, chapter

**Mission**:
A real-world task that ends a Stretch, with one concrete target, checked in on a later day; the Stops after it stay closed until it is passed or owed.
_Avoid_: Homework, challenge, quest

**Not today**:
The check-in answer "Hoy no pudimos": the walk did not happen, so the Mission keeps its target and waits another day.
_Avoid_: Skip, skipped check-in

**Day Skip**:
The LeadMate Plus action "Saltar el día" on a started, waiting Mission: it opens the Stops after the Mission without waiting for its check-in, leaving the Mission owed. A World's last Mission cannot be skipped.
_Avoid_: Skip, fast-forward, skipped Mission

**Owed Mission**:
A Mission that took a Day Skip and has not been passed yet; it no longer closes the trail but still has to be checked in on a real day. Shown to the user as "Pendiente".
_Avoid_: Pending Mission, deferred Mission, skipped Mission

**Closing a World**:
Passing every Mission of a World, Owed Missions included; only then is the World complete and the next one unlocked.
_Avoid_: Finishing the trail

**Completed World**:
A World whose every Stop is done and none owed; reached by Closing a World.
_Avoid_: Finished World, done World, closed World

**Fix**:
The corrective material shown when a Mission check-in did not go well: reassurance, what likely went wrong, what to change, an easier target and what to practise again.
_Avoid_: Troubleshooting, tip, remedy

### Shop
**Shop** (*Tienda*):
The curated catalogue of recommended physical products for dog and owner, authored in the Content Pack and bought outside the app. Not the Store Offering.
_Avoid_: Store, marketplace, basket, cart

**Shop Category / Shop Subcategory**:
The two levels that group Products (e.g. "Collares y arneses", then "Collares"). Each has a title and a brief description.
_Avoid_: Department, section, aisle

**Product** (*Producto*):
A physical item in the Shop with a name, description, picture, approximate price and a buy link per language. It may be imported from an Amazon page by an author; it is never fetched by the app.
_Avoid_: Item, listing, Store Offering

**Recommendation** (*Recomendación*):
An authored pointer from a Lesson, Node or Mission to a Product, Shop Subcategory or Shop Category, with its own explanation of why it helps ("Con un collar como estos hacer el Poste es mucho más fácil…"). Shown either as a card on the item or as a self-dismissing popup when the user is in trouble.
_Avoid_: Shop link, ad, sponsored link, Tutorial Link

### Monetization & Advertising

**Plus World**:
A World designated as part of LeadMate Plus, requiring Plus membership in addition to completing preceding Worlds.
_Avoid_: Premium chapter, paid zone

**Plus membership**:
Whether the user has LeadMate Plus right now, granted either during an active Trial or via a verified store Subscription Tier.
_Avoid_: Plus subscription, premium, entitlement

**Free Tier**:
The status of a user without an active Plus membership (either prior to starting a Trial or after Trial expiry without an active Subscription Tier).
_Avoid_: Non-paying user, basic mode, unpaid

**Subscription Tier**:
An auto-renewing billing plan (Annual or Monthly) that grants continuous Plus membership.
_Avoid_: Billing plan, membership package, subscription option

**Store Offering**:
The set of localized Subscription Tiers and pricing packages retrieved dynamically from the Apple App Store or Google Play Store.
_Avoid_: Product list, catalog, store inventory. Not a Shop Product: it prices Plus, not physical goods.

**Restore Purchases**:
The action of re-validating native app store receipts to re-establish Plus membership on a new or reset device.
_Avoid_: Recover license, sync receipt, refresh subscription

**Trial**:
The 7-day period starting from when the user first opts into LeadMate Plus, granting temporary Plus membership at no cost.
_Avoid_: Free trial, demo, test period

**Paywall**:
The screen presenting LeadMate Plus access and benefits. Before starting a Trial, it offers the 7-day Trial; after Trial expiry, it presents subscription pricing tiers.
_Avoid_: Upsell screen, checkout, store

**Value Recap**:
The one-time summary screen presented on the first app launch after the Trial expires, celebrating achievements during the trial and presenting full subscription options alongside the free tier bypass.
_Avoid_: Expiration modal, exit survey, renewal screen

**Commercial Ad**:
An external promotional creative delivered by the advertising network to monetize the Free Tier. Strictly forbidden inside active walk simulations and minigames.
_Avoid_: Promotion, sponsor, ad creative

**Anchored Banner**:
A persistent banner ad affixed to the bottom of the World Map screen for Free Tier users.
_Avoid_: Bottom banner, sticky banner, footer ad

**Transition Interstitial**:
A full-screen ad displayed exclusively upon leaving a completed Stage debrief back to the World Map, constrained by the Ad Cooldown.
_Avoid_: Fullscreen ad, popup, interstitial

**Ad Cooldown**:
The minimum elapsed time (300 seconds) required between Transition Interstitial impressions.
_Avoid_: Ad frequency, interstitial timer

**Coming-soon World**:
A Plus World the roadmap announces but that has no Stops yet, shown on the World Map as "Próximamente" with what it will teach and its planned walk count. It never gates progress or completion, and opens when its content ships.
_Avoid_: Preview World, teaser world, dummy chapter

**More-coming card**:
The informational card after the last World that lists the training scenarios planned after the Coming-soon Worlds. It opens nothing.
_Avoid_: Load more, next level

**World Map**:
The main screen: all Worlds laid out as a trail of Stops showing which are locked, open, next up, waiting, owed or completed, with each Node's Stars.
_Avoid_: Home, level select, menu

**Trail Scenery**:
The non-interactive paper-cut backdrop illustrations and landmarks decorating a World's trail container on the World Map to reflect its thematic environment.
_Avoid_: Map props, background decals, world stickers, map decorations

**Map Header**:
The fixed strip at the top of the World Map that stays in view while the trail scrolls. It holds the Status Chips wrapping on the left and the Settings gear pinned permanently to the top right.
_Avoid_: Top menu, top bar, toolbar

**Status Chip**:
A raised, pill-shaped entry in the Map Header that shows a status or opens a section, such as the Streak, the Daily Stage, the Daily Barkdoku or the Library. The Streak chip is the way into the Diary.
_Avoid_: Tab, menu item, pill

**Star**:
A 1 to 3 rating of how well a Node or a Daily Barkdoku solve was handled. A Node's Stars are kept at their best; a Daily Barkdoku's are a rating of that one solve and are not kept as progress. It reflects handling quality, plus the Target Time for a Barkdoku, and never unlocks anything.
_Avoid_: Medal, rank, points

**Stage Meter**:
A bar shown during a Stage that fills as the Handler does one kind of thing well, such as Nose (letting the Dog sniff) or Connection (winning its attention). Only some Stages have Stage Meters, and then they set the Stars.
_Avoid_: Gauge, progress bar, score

**Meter Points**:
The units that fill a Stage Meter, shown flying into it after a right action. They are never Stars.
_Avoid_: Score, XP, coins

**Daily Stage**:
A procedurally generated Stage that changes every 24 hours and is shared by all users on a given date, protecting the Streak and warming up a Rusty Dog without mutating Learning Attributes.
_Avoid_: Daily level, daily run

**Streak**:
The number of consecutive calendar days on which the user completed a qualifying activity: a Node, Daily Stage, Daily Barkdoku, or Walk Diary entry.
_Avoid_: Habit counter, day streak

**Walk Diary**:
The log of Mission check-ins: what the user reported about each real walk, which credits the Streak. Entries logged on Node Debriefs before Missions existed are kept.
_Avoid_: Homework log, walk notes

**Activity Log**:
The dated record of what the user did: one entry per Node Debrief, Daily Stage play, first Daily Barkdoku solve of a day, first read of a Lesson and the guided first Stage, with that run's results. It records progress but never drives it.
_Avoid_: History, event log, timeline

**Diary**:
The day-by-day view of the Activity Log, the Walk Diary, the Daily Stage bests and the Daily Solve Times, shown as a calendar or as the list of days with activity. It contains Walk Diary entries but is not the Walk Diary.
_Avoid_: Journal, calendar, history

**Active Day**:
A calendar day that credited the Streak. A day with only a Lesson read or a Day Skip has activity but is not an Active Day.
_Avoid_: Played day, day with activity

**Scenery Set**:
The props a scenario declares to match its environment theme (indoor apartment, quiet suburb, urban street, open park), dense enough to feel lived in and varied in type. A prop may be an Obstacle, a Visual Shield, both, or neither; the Scenery Set also includes the Ground Cover that gives each zone its look.
_Avoid_: Decoration, background

**Ground Cover**:
Flat decoration painted on the ground of a Stage (such as paving, carpet, a rug, a path, a flower patch or painted lines) that never blocks movement or sight and has no effect on the simulation.
_Avoid_: Floor prop, decal

**Visual Shield**:
A prop in a Stage (such as a parked car) or an exclusion marker placed in Barkdoku that breaks line of sight between dogs or distractors, stopping Fixation and arousal accumulation.
_Avoid_: Cover, screen, barrier, cono, X

**Splash**:
The branded screen shown on every cold start until the Dog is loaded, before the first-run funnel or the World Map.
_Avoid_: Loading screen, intro

**Appearance**:
This device's choice of System, Light or Dark colours for the app's screens. It is never part of the Dog record and never changes how a running Stage or an illustration looks.
_Avoid_: Theme, dark mode, night mode

**Reset Progress**:
A deliberate, confirmed return of this device's Dog to its first-run state, available only while signed out. It ends any Pairing but never changes the account's Dog.
_Avoid_: Delete account, wipe, factory reset

**Settings Area**:
One of the three domain-specific groupings of options within the Settings screen: Perro (Dog attributes and reactivity), Preferencias (feedback, appearance, audio cues and Usage Analytics), or Cuenta (subscription, sync, and system tools).
_Avoid_: Settings category, section group, settings page

**Area Tab**:
A tactile, pill-shaped control pinned at the top of the Settings screen that switches the visible Settings Area.
_Avoid_: Settings chip, segment, toggle button

**Pairing**:
The bond between a device's Dog and one Dog saved in an account, which keeps the two in sync. Logging out keeps it; Reset Progress and account deletion end it.
_Avoid_: Link, connection, attachment

**Funnel**:
The first-run sequence a new Dog goes through once: welcome, name and look, Main Concern, Taste Briefing, Taste Stage with its payoff, Dog setup, Diagnostic, Personal Plan, the guided first Stage and the soft paywall. It ends at the World Map and runs again only after Reset Progress.
_Avoid_: Onboarding flow, wizard, tutorial

**Taste Stage**:
The first Stage a new user plays, before any setup question other than the Main Concern: a strong Distractor of the kind the Main Concern names (a dog when none is named) meets a Dog with no Cue skill, built so the Dog ends up Reactive. It makes the user feel the problem the game solves. It never changes the Dog record.
_Avoid_: Demo, intro level, failure stage

**Taste Briefing**:
The screen shown before the Taste Stage starts that names the Dog and says what the user is about to do: walk the Dog, another dog will approach, and the goal is to keep the Dog calm by moving it away. The Taste Stage does not start, and its clock does not run, until the user dismisses it.
_Avoid_: Tutorial, instructions screen, intro screen

**Payoff Screen**:
The message shown over the Taste Stage, after a zoom on the Handler and the Dog, that says the Dog has reacted, names the Dog and says the game will be tuned to it, whatever the Taste Stage's result.
_Avoid_: Result screen, fail screen

### Content Packs and Channels

**Content Pack**:
A structured, validated set of plain YAML and Markdown files plus media assets that defines Worlds, Lessons, Nodes, Missions, and curriculum text for one channel.
_Avoid_: Asset bundle, CMS export, lesson pack

**Channel**:
A release stream for content packs (`stable` or `beta`). Each channel builds, validates, and publishes independently with its own monotonic content version counter and manifest.
_Avoid_: Environment, branch, release track

**Baseline**:
The Stable Content Pack as it was when a release was built, shipped inside the app as its starting copy and its fallback. Only the Stable channel has one; Beta does not.
_Avoid_: Bundled pack, embedded pack, default pack

**Content Version**:
A positive integer recorded in `pack.yaml` tracking curriculum and editorial releases for a channel, advancing monotonically with each published update.
_Avoid_: Revision, build number, pack version

**Format Version**:
The structural schema specification number recorded in `pack.yaml` (`formatVersion`) that determines whether the app parser supports the pack's file hierarchy and fields.
_Avoid_: Content version, API version

**Baseline Pack**:
The static copy of the stable content pack bundled directly within the app binary at build time. It ensures all screens, trails, Lessons, and Missions work immediately on first launch, without network access, and acts as the fallback after any failed update.
_Avoid_: Default content, embedded assets, fallback pack

**Manifest**:
A versioned, compatibility-checked JSON document generated at build time (`manifest.json`) that records the channel, contentVersion, formatVersion, minAppVersion, build timestamp, and a deterministic map of every pack file to its SHA-256 hash and byte size.
_Avoid_: File list, checksum index, lockfile

### Usage Analytics

**Usage Analytics**:
The anonymous record of which screens and steps a user reaches and what they tap, sent from the Shell and never from a Stage, which the user can turn off in Settings.
_Avoid_: Tracking, telemetry, metrics

**Install Id**:
The random id that identifies one app install to Usage Analytics and to nothing else; it is never linked to an account or a Dog.
_Avoid_: User id, device id, distinct id

**App Session**:
One stretch of app use, starting at launch or on returning to the foreground after at least 30 minutes away. It is not a Stage and not a Stretch.
_Avoid_: Session (alone), visit
