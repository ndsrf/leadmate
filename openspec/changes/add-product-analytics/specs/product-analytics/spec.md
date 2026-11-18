# Spec Delta

## Purpose

Defines the anonymous product analytics the app sends: a small, versioned set of events that shows where users are in the Funnel and the trail, which screen they saw last, and whether Lessons are read, while keeping personal data out and letting the user turn it off.

Terms: an **install id** is the random id that identifies this app install to analytics and nothing else. An **App Session** is one stretch of app use, started at launch or on returning to the foreground after at least 30 minutes away; it is not a Stage and not a Stretch.

## ADDED Requirements

### Requirement: Anonymous install id
The system SHALL identify events only by a random install id created on the device the first time analytics state is created, together with the time it was created. The id SHALL NOT be derived from the device, the account or the Dog, SHALL NOT be linked to an account id or Dog id, SHALL NOT appear as an event property, and SHALL be kept on the device only.

#### Scenario: First start
- **WHEN** the app starts for the first time after install
- **THEN** a new random install id and its creation time are stored on the device, and every event carries that id as its distinct id

#### Scenario: Same id across App Sessions
- **WHEN** the app is closed and opened again
- **THEN** events carry the same install id as before

#### Scenario: Signing in does not identify
- **WHEN** the user signs in or registers an account
- **THEN** events keep the same install id and no account id, Dog id or email is sent or linked to it

#### Scenario: Progress reset keeps the id
- **WHEN** the user resets progress
- **THEN** the install id, its creation time and the analytics choice are unchanged

#### Scenario: Account deletion does not touch analytics
- **WHEN** the user deletes their account
- **THEN** the install id and the analytics choice are unchanged, because no analytics data is linked to the account

### Requirement: Upgraded installs are marked
The system SHALL mark the analytics state as an upgraded install when it is first created on a device whose Dog had already left the welcome step, so that analysis can tell installs that existed before analytics from new ones.

#### Scenario: Existing user updates the app
- **WHEN** a user whose Dog finished the Funnel before this release opens the updated app
- **THEN** `session_started` carries `upgraded_install` true, and no `funnel_step_viewed` with `step` map is sent for that launch

#### Scenario: New install
- **WHEN** the app is opened for the first time after a fresh install
- **THEN** `session_started` carries `upgraded_install` false

### Requirement: No personal data in events
Every event property SHALL be one the event contract declares for that event, and SHALL be a whole number, a boolean, a value from a fixed set, or a content id (lowercase letters, digits and `_ . : -`, at most 64 characters, not UUID-shaped). The system SHALL NOT send the Dog's name, email, account id, Dog id, the install id as a property, typed text, recorded audio, location or any free text. An event that breaks the contract SHALL be dropped, not sent.

#### Scenario: Dog name never sent
- **WHEN** a user whose Dog is named "Luna" with account email "luna@example.com" plays through the Funnel, a Lesson, a Checkpoint, a Stage and a Minigame
- **THEN** no sent event contains "Luna", the email, the account id or the Dog id in any property

#### Scenario: Undeclared property
- **WHEN** the Shell tries to send an event with a property the contract does not declare for it
- **THEN** the event is dropped and nothing is sent for it

#### Scenario: Free text rejected
- **WHEN** a string property holds a value with spaces, upper-case letters, more than 64 characters or an `@`
- **THEN** the event is dropped

#### Scenario: UUID-shaped value rejected
- **WHEN** a content-id property holds a value shaped like a UUID, such as an account or Dog id
- **THEN** the event is dropped

#### Scenario: Device location not collected
- **WHEN** an event is sent
- **THEN** it carries no location, and the analytics service is configured not to derive a location from the network address

### Requirement: Versioned event contract
The system SHALL send only events named in the event contract, and every event SHALL carry the contract's `schema_version`. Adding an event, an optional property or a new value to a fixed set SHALL keep the version; renaming or removing an event, a property or a value, or changing a property's meaning or kind, SHALL raise it.

#### Scenario: Version on every event
- **WHEN** any event is sent
- **THEN** it carries `schema_version` equal to the contract's current version

#### Scenario: Unknown event name
- **WHEN** the Shell tries to send an event whose name is not in the contract
- **THEN** nothing is sent

#### Scenario: Another change adds an event
- **WHEN** a later change adds a new event to the contract with its declared properties
- **THEN** `schema_version` stays the same and the existing events are unchanged

#### Scenario: Breaking change
- **WHEN** a property of an existing event is renamed or changes kind
- **THEN** `schema_version` is raised

### Requirement: Common event properties
Every event SHALL carry `schema_version`, `app_version`, `content_version` and `content_channel` (stable or beta) of the active Content Pack, the app `language` (`es` or `en`) and `seconds_since_install`, the whole seconds since the install id was created, never below 0.

#### Scenario: Common properties present
- **WHEN** any event is sent
- **THEN** it carries `schema_version`, `app_version`, `content_version`, `content_channel`, `language` and `seconds_since_install`

#### Scenario: Clock set back
- **WHEN** the device clock is set to before the install id was created
- **THEN** `seconds_since_install` is 0

### Requirement: Events made at startup are not lost
Events made before the analytics state has finished loading at launch SHALL be held on the device in memory with the time they happened, and SHALL be sent once the state has loaded if analytics is on, or discarded if it is off.

#### Scenario: Welcome shown before the state loads
- **WHEN** the welcome screen shows before the analytics state has loaded
- **THEN** `funnel_step_viewed` with `step` welcome is sent once the state loads, with the time the screen showed

### Requirement: Funnel step viewed
The system SHALL send `funnel_step_viewed` with `step` and `repeat` each time a different Funnel screen comes to the front, once per arrival. `repeat` SHALL be true when this install had already finished the Funnel before (it runs again only after a progress reset).

#### Scenario: Moving through the Funnel
- **WHEN** a new user goes from the language question to the Dog's name and look screen
- **THEN** `funnel_step_viewed` is sent with `step` language and then with `step` dog

#### Scenario: Re-render is not a view
- **WHEN** the same Funnel screen re-renders without the user leaving it
- **THEN** no further `funnel_step_viewed` is sent for it

#### Scenario: Resuming after a restart
- **WHEN** the app is reopened in the middle of the Funnel
- **THEN** `funnel_step_viewed` is sent for the step it resumes on

#### Scenario: End of the Funnel
- **WHEN** the user leaves the paywall and the World Map shows for the first time after Funnel steps were viewed
- **THEN** `funnel_step_viewed` is sent with `step` map, and is not sent again on later visits to the World Map

#### Scenario: Funnel after a reset
- **WHEN** a user who finished the Funnel resets progress, sees the welcome screen again and later reaches the World Map
- **THEN** `funnel_step_viewed` is sent with `step` welcome and `repeat` true, and later with `step` map and `repeat` true

### Requirement: Funnel step names
The `step` of `funnel_step_viewed` SHALL be one of, in Funnel order: welcome, language, dog, concern, taste_briefing, taste_stage, taste_payoff, setup_equipment, setup_weights, setup_about, setup_home, setup_questions, diagnostic, plan, method, first_primer, first_checkpoint, first_walk, first_debrief, register_prompt, account, paywall, map.

#### Scenario: Setup parts are separate steps
- **WHEN** the user moves from the Equipment part of Dog setup to the weights part
- **THEN** `funnel_step_viewed` is sent with `step` setup_equipment and then setup_weights

#### Scenario: Guided first Stage parts
- **WHEN** the user goes from the introductory Checkpoint to the guided walk
- **THEN** `funnel_step_viewed` is sent with `step` first_checkpoint and then first_walk

#### Scenario: Taste parts
- **WHEN** the user dismisses the Taste Briefing and the Dog later reacts
- **THEN** `funnel_step_viewed` is sent with `step` taste_briefing, then taste_stage, then taste_payoff

### Requirement: Session started
The system SHALL send `session_started` with `days_since_install` (whole days), `first_session` and `upgraded_install` when an App Session starts: when the app is launched, and when it comes back to the foreground after at least 30 minutes in the background.

#### Scenario: Cold start
- **WHEN** the app is opened
- **THEN** one `session_started` is sent

#### Scenario: First ever App Session
- **WHEN** the app is opened for the first time after install
- **THEN** `session_started` has `first_session` true and `days_since_install` 0

#### Scenario: Short background
- **WHEN** the app returns to the foreground after 5 minutes in the background
- **THEN** no `session_started` is sent

#### Scenario: Long background
- **WHEN** the app returns to the foreground after 45 minutes in the background
- **THEN** `session_started` is sent with `first_session` false

### Requirement: Stage started
The system SHALL send `stage_started` with `stage_kind` (taste, first, node, daily, warmup), `stage_id`, `mode` (stage, close_exercise) and `attempt` each time a Stage is launched, before its Stage view loads. `stage_id` SHALL be the Node id (`intro-node` for the guided first Stage), `daily:<date>`, `taste` or `warmup`. `attempt` SHALL be 1 when the Stage's flow opens and one higher for each play again from its Debrief.

#### Scenario: Node Stage starts
- **WHEN** a Node's Interactive Simulation that is a Stage is launched from the Node's Checkpoint
- **THEN** `stage_started` is sent with `stage_kind` node, the Node's id as `stage_id` and `attempt` 1

#### Scenario: Replay
- **WHEN** the user chooses to play a Node again from its Debrief
- **THEN** a new `stage_started` is sent with `attempt` one higher

#### Scenario: Taste Stage
- **WHEN** the Taste Stage is launched after the Taste Briefing
- **THEN** `stage_started` is sent with `stage_kind` taste and `stage_id` taste

### Requirement: Stage ended
The system SHALL send exactly one `stage_ended` for each `stage_started`, unless the app is closed or killed first, with the same `stage_kind`, `stage_id`, `mode` and `attempt`, an `outcome` (finished, skipped, left) and `duration_seconds`, the whole seconds from launch to end spent in the foreground and not paused. A finished Stage SHALL also carry its `handling_score` when its Debrief payload has one.

#### Scenario: Played to the end
- **WHEN** a Node's Stage ends and its Debrief shows
- **THEN** `stage_ended` is sent with `outcome` finished and the Stage's handling score

#### Scenario: Skipped from the Pause Menu
- **WHEN** the user leaves a Stage through the Pause Menu
- **THEN** `stage_ended` is sent with `outcome` skipped

#### Scenario: Taste skipped
- **WHEN** the user skips the Taste Stage through the Pause Menu and the Payoff Screen shows
- **THEN** `stage_ended` is sent with `outcome` skipped, not finished

#### Scenario: Left without ending
- **WHEN** the Stage view closes before the Stage ended, by the Stage Back Control during loading or a load error
- **THEN** `stage_ended` is sent with `outcome` left

#### Scenario: Taste ends on reaction
- **WHEN** the Taste Stage ends because the Dog reacted
- **THEN** `stage_ended` is sent with `outcome` finished and no `handling_score`

#### Scenario: Never twice
- **WHEN** a Stage is skipped and its view then closes
- **THEN** only one `stage_ended` is sent for it

#### Scenario: Paused time not counted
- **WHEN** a Stage is paused for 2 minutes before it ends
- **THEN** those 2 minutes are not part of `duration_seconds`

### Requirement: Minigame started
The system SHALL send `minigame_started` with `node_id` and `attempt` each time a Node's Minigame begins, with `attempt` counted as for Stages.

#### Scenario: Minigame begins
- **WHEN** the user reaches a Node's Minigame after its Checkpoint
- **THEN** `minigame_started` is sent with the Node's id and `attempt` 1

### Requirement: Minigame ended
The system SHALL send exactly one `minigame_ended` for each `minigame_started`, unless the app is closed or killed first, with the same `node_id` and `attempt`, an `outcome` (finished, left) and `duration_seconds` as for Stages. A finished Minigame SHALL also carry its `handling_score` when it reports one.

#### Scenario: Minigame finished
- **WHEN** the user finishes a Minigame and its Debrief shows
- **THEN** `minigame_ended` is sent with `outcome` finished

#### Scenario: Minigame left
- **WHEN** the user leaves the Node flow while its Minigame is showing
- **THEN** `minigame_ended` is sent with `outcome` left

### Requirement: Lesson opened
The system SHALL send `lesson_opened` with `lesson_id` and `source` (trail, library, video_unlock) when a Lesson screen opens. `video_unlock` is the Lesson reopened on return from the Paywall after the user asked to play a Plus Lesson Video.

#### Scenario: Lesson from the trail
- **WHEN** the user opens a Lesson Stop on the World Map
- **THEN** `lesson_opened` is sent with its id and `source` trail

#### Scenario: Lesson from the Theory Library
- **WHEN** the user opens a Lesson from the Theory Library
- **THEN** `lesson_opened` is sent with `source` library

### Requirement: Lesson done
The system SHALL send `lesson_done` once when the user leaves a Lesson screen, with `lesson_id`, `closed_by` (done or back), `seconds_on_screen` (whole seconds in the foreground) and `scrolled_percent`, the furthest reading progress reached, a whole number from 0 to 100.

#### Scenario: Read to the end
- **WHEN** the user scrolls to the bottom and presses "Done" after 90 seconds
- **THEN** `lesson_done` is sent with `closed_by` done, `seconds_on_screen` 90 and `scrolled_percent` 100

#### Scenario: Backed out early
- **WHEN** the user opens a Lesson, scrolls to 25 percent and goes back
- **THEN** `lesson_done` is sent with `closed_by` back and `scrolled_percent` 25

#### Scenario: Furthest point counts
- **WHEN** the user scrolls to 80 percent and then back up to the top before leaving
- **THEN** `scrolled_percent` is 80

#### Scenario: Background time not counted
- **WHEN** the app spends 10 minutes in the background while a Lesson is open
- **THEN** those 10 minutes are not part of `seconds_on_screen`

### Requirement: Checkpoint answered
The system SHALL send `checkpoint_answered` for each Checkpoint question answered or timed out, with `node_id`, `question_index` (0 for the first question), `result` (correct, wrong, missed) and `seconds_to_answer`, the whole seconds from when the question showed.

#### Scenario: Correct answer
- **WHEN** the user picks the correct option 4 seconds after the first question shows
- **THEN** `checkpoint_answered` is sent with `result` correct, `question_index` 0 and `seconds_to_answer` 4

#### Scenario: Timed out
- **WHEN** a timed Checkpoint question runs out
- **THEN** `checkpoint_answered` is sent with `result` missed

#### Scenario: Guided first Stage
- **WHEN** the user answers the introductory Checkpoint of the guided first Stage
- **THEN** `checkpoint_answered` is sent with `node_id` intro-node

### Requirement: Stop completed
The system SHALL send `stop_completed` with `world_id`, `stop_id`, `stop_kind` (lesson, node, mission) and `stop_index` (its 0-based position on the World's trail) once when a World trail Stop first becomes done for the Dog through the user's own action on this device. Satellite Stops SHALL NOT send it.

#### Scenario: Node completed
- **WHEN** a Node is completed for the first time and its Stop becomes done
- **THEN** `stop_completed` is sent with its World id, Stop id and kind node

#### Scenario: Replay is not a completion
- **WHEN** the user replays a Node whose Stop is already done
- **THEN** no `stop_completed` is sent

#### Scenario: Mission passed
- **WHEN** a Mission check-in passes and its Stop becomes done
- **THEN** `stop_completed` is sent with kind mission

#### Scenario: Day Skip is not a completion
- **WHEN** the user takes a Day Skip and the Mission becomes owed
- **THEN** no `stop_completed` is sent for the Mission, and one is sent when the Owed Mission is later passed

#### Scenario: Synced progress is not a completion
- **WHEN** progress arrives from the account and marks Stops as done
- **THEN** no `stop_completed` is sent for them

### Requirement: Analytics on by default with opt-out
Analytics SHALL be on for an install whose user has never changed the switch, with that default set by a single build-time setting, and SHALL follow the user's choice once they change it. When the user turns it off, the system SHALL stop sending at once, SHALL discard events queued but not yet sent, and SHALL make or queue no event while it stays off. The choice SHALL be kept on the device, survive restarts and progress reset, and SHALL NOT be synced to the account.

#### Scenario: New install
- **WHEN** the app is opened for the first time
- **THEN** analytics is on

#### Scenario: Default changed in a later build
- **WHEN** a build sets the default to off and a user who never changed the switch updates to it
- **THEN** analytics is off for them until they turn it on, while a user who turned it on explicitly stays on

#### Scenario: Turned off
- **WHEN** the user turns analytics off and then plays a Stage
- **THEN** no event is sent, including any queued but not yet sent before the switch

#### Scenario: Off after restart
- **WHEN** the user turned analytics off and reopens the app
- **THEN** no `session_started` or other event is sent and the analytics service is not started

#### Scenario: Turned back on
- **WHEN** the user turns analytics on again
- **THEN** later events are sent with the same install id, and nothing from the time it was off is sent

### Requirement: Offline queueing
The system SHALL keep events made while offline on the device and send them when a connection returns, in the order they were made, each with the time it happened. The queue SHALL be capped, dropping the oldest events first when full.

#### Scenario: Offline Stage
- **WHEN** the user plays a Stage with no connection and later goes online
- **THEN** its `stage_started` and `stage_ended` are sent with the times they happened

#### Scenario: Closed while offline
- **WHEN** the app is closed while events are queued and reopened online
- **THEN** the queued events are sent

#### Scenario: Queue full
- **WHEN** the queue is at its cap and a new event is made
- **THEN** the oldest queued event is dropped

### Requirement: Analytics never gets in the way
Sending analytics SHALL NOT block or delay any screen, input or Stage, and a failure to start analytics, store an event or send it SHALL NOT show anything to the user or change the app's behaviour.

#### Scenario: Service unreachable
- **WHEN** the analytics service cannot be reached or returns an error
- **THEN** the user sees no error and the app behaves as with analytics working

#### Scenario: Storage fails
- **WHEN** reading or writing the analytics state on the device fails
- **THEN** the app starts and plays normally

#### Scenario: Not configured
- **WHEN** the build has no analytics project key, or runs on the web
- **THEN** nothing is sent and the app behaves normally

### Requirement: Simulation stays free of analytics
Events SHALL be made only by the Shell. The simulation SHALL NOT make, import or depend on analytics, and analytics SHALL NOT change a Stage's seed, inputs, results or Debrief payload.

#### Scenario: Same payload with or without analytics
- **WHEN** the same Stage is played with the same seed and inputs once with analytics on and once off
- **THEN** both produce the same Debrief payload

#### Scenario: No analytics in the simulation
- **WHEN** the simulation and bundle code are checked
- **THEN** none of it refers to analytics
