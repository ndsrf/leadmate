## ADDED Requirements

### Requirement: Choose-the-action Minigames
The system SHALL run the Harness Ritual and the Doorbell Mat as scenes of several beats. In each beat the Dog shows one readable state and the user SHALL pick one of four action buttons shown for that Minigame. The correct action depends on the Dog's state and changes from beat to beat within a scene.

#### Scenario: Harness Ritual actions
- **WHEN** the Harness Ritual is running
- **THEN** the buttons offered are Wait, Cue, Marker and Put on harness

#### Scenario: Doorbell Mat actions
- **WHEN** the Doorbell Mat is running
- **THEN** the buttons offered are Wait, Cue, Marker and Send to mat

#### Scenario: Right action advances the scene
- **WHEN** the user picks the action that fits the Dog's current state
- **THEN** the Dog reacts well, the beat counts as correct and the scene moves to the next beat

#### Scenario: Wrong action is visible
- **WHEN** the user picks an action that does not fit the Dog's current state
- **THEN** the Dog reacts visibly (for example jumping or turning away), the beat counts as a mistake and a one-line hint names what to look for

#### Scenario: Cue plays the chosen Cue
- **WHEN** the user picks Cue
- **THEN** the system plays the Cue the user has selected, and the Dog turns to the Handler only if it was distracted

#### Scenario: Harness refused
- **WHEN** the user picks Put on harness while the Dog is not sitting calm and looking at the Handler
- **THEN** the Dog backs away, the harness stays off and the beat counts as a mistake

#### Scenario: Retry once
- **WHEN** the user makes a wrong choice on a beat
- **THEN** the beat reopens once; a second wrong choice or no answer counts the beat as failed and the scene moves on

#### Scenario: No answer
- **WHEN** the decision window of a beat ends without a choice
- **THEN** the beat counts as missed and the scene moves on

#### Scenario: Different states need different actions
- **WHEN** the Dog is jumping or barking, sniffing away, sitting calm and looking at the user, or lying relaxed
- **THEN** each of those states has a different correct action within the Minigame, so no single button is right every time

#### Scenario: Scene length
- **WHEN** a Harness Ritual scene runs
- **THEN** it has four Action beats, and a Doorbell Mat scene has five, each with a decision window of about five seconds

#### Scenario: Help and hints
- **WHEN** the user starts an action Minigame
- **THEN** the Node's help text is shown above the scene, no step-by-step tutorial is shown, and a hint appears only after a wrong choice

#### Scenario: Screen reader
- **WHEN** a new Action beat starts
- **THEN** the Dog's state is announced to screen readers, and every action button has an accessible label with its name and effect

#### Scenario: Varied scenes
- **WHEN** a Minigame is started with a different seed
- **THEN** the order of beats and the distractions in them can differ, while every scene ends with the Dog calm

### Requirement: Expressive Dog
The system SHALL draw the Minigame Dog with distinct body language for each readable state, covering at least excited jumping, barking at the door, sniffing the floor, sitting and looking at the user, standing on the mat unsettled, and lying relaxed, with eyes, ears, tail and mouth changing per state, plus an emote bubble beside the head. Every state SHALL also be named in a short caption.

#### Scenario: States look different
- **WHEN** the Dog moves between any two readable states
- **THEN** at least the body pose and one of ears, tail, mouth or eyes differ

#### Scenario: Emote with caption
- **WHEN** the Dog shows an emote
- **THEN** the caption names the same state in words, so the state is not colour or icon only

#### Scenario: Reduced motion
- **WHEN** the device asks for reduced motion
- **THEN** the Dog changes state without animation and the Minigame plays the same

### Requirement: Action Minigame result
The system SHALL report an action Minigame to the Debrief with the same metric names as before (the Harness Ritual with `poste` and `tension`, the Doorbell Mat with `timing` and `tension`) and with a handling score for stars. The first SHALL be the share of correct beats and `tension` SHALL fall with the number of wrong choices.

#### Scenario: Perfect run
- **WHEN** every beat is answered correctly
- **THEN** the first metric is 100% and `tension` is 100%

#### Scenario: Mistakes lower tension
- **WHEN** the user makes wrong choices
- **THEN** `tension` is lower than in a run with fewer wrong choices

## MODIFIED Requirements

### Requirement: Canine posture and behavioral state visualization
The system SHALL display visual posture representations of the Dog reflecting its behavioral state and arousal during static minigames, including standing alert, jumping, lunging/straining, sniffing, sitting attentive, settling, and resting calmly, instead of relying solely on abstract colored boxes or text labels.

#### Scenario: Doorbell Mat canine posture cycle
- **WHEN** a Doorbell Mat scene runs
- **THEN** the Dog shows barking at the door, unsettled on the mat, distracted by a smell, and lying relaxed on the mat, in an order set by the scene

#### Scenario: Early mark triggers agitation
- **WHEN** the user picks an action that does not fit while the Dog is aroused
- **THEN** the system displays the Dog remaining aroused, providing immediate visual canine feedback that the action did not help

#### Scenario: Poste and Harness Ritual leash strain postures
- **WHEN** the Dog strains against the leash in the Poste practice (the Harness Ritual no longer uses the leash scene)
- **THEN** the system renders the Dog's body visibly leaning and pulling forward under tension, transitioning to an eased rest and relaxed sit as the Handler holds and settles the Dog

### Requirement: Environmental scene context in minigames
The system SHALL render visual environmental props for static minigames, including an entrance door with audio-visual chime cues and a target mat for the Doorbell Mat minigame, the harness and the front door for the Harness Ritual, and an anchored handler-leash connection for the Poste practice.

#### Scenario: Visual doorbell and mat cues
- **WHEN** the doorbell triggers in Doorbell Mat
- **THEN** the scene shows a chime ripple at the door prop and highlights the mat target where the Dog settles

#### Scenario: Harness shown
- **WHEN** the Harness Ritual is running
- **THEN** the scene shows the harness, and it appears on the Dog once Put on harness succeeds

#### Scenario: Leash tension visualization
- **WHEN** tension changes in the Poste practice
- **THEN** the rendered leash dynamically reflects the curve between Handler and Dog, appearing rigid during pull and curving into slack when held

### Requirement: Canine-cue-driven interaction timing
The system SHALL align user input to observable canine body language cues, rewarding the user for reading the Dog's physical demeanor and penalizing actions taken during inappropriate canine behavioral states.

#### Scenario: Marking on calm canine posture
- **WHEN** the user picks Marker while the Dog is lying relaxed on the mat
- **THEN** the system registers a correct beat and provides positive canine feedback

#### Scenario: Reward on an aroused Dog
- **WHEN** the user picks Marker while the Dog is jumping or barking
- **THEN** the beat counts as a mistake and the Dog stays aroused

#### Scenario: Premature release in hold minigame
- **WHEN** the Handler releases the hold button in the Poste practice before the Dog has fully settled into slack
- **THEN** the Dog immediately lunges forward again and the round ends as a release failure

### Requirement: Readable minigame scenes
The system SHALL draw each static Minigame as one scene with vector art for the Dog in its chosen coat and the props it needs (Door, Mat, Harness, Handler, Leash), name the Dog's current state in a short caption, and show progress as pips and a coloured result chip.

#### Scenario: Dog walks from door to mat
- **WHEN** the user sends the Doorbell Mat Dog to the mat with the right timing
- **THEN** the Dog walks from the door to the mat and the mat lights up

#### Scenario: Dog coat is respected
- **WHEN** the Dog record has a coat other than golden
- **THEN** the Minigame Dog is drawn in that coat

#### Scenario: Pull is visible at a glance
- **WHEN** the leash tension rises in the Poste practice
- **THEN** the Handler leans back, the Leash runs straight and the tension gauge moves from green through amber to red
