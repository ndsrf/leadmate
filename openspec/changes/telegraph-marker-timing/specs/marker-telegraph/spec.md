# Spec Delta

## Purpose

Shows the player the Marker beat before it arrives: an approach ring that closes with the calm period onto the Disengagement, a smaller Check-in arc before a Check-in, and a Timing assist that starts full and fades as the player's own Marker timing improves. It is drawn by the HUD only and never changes the Stage.

## ADDED Requirements

### Requirement: Where the telegraph appears
The telegraph SHALL appear in every walking Stage, including the Daily Stage, scent Stages and the guided first Stage. It SHALL NOT appear in the Taste Stage, in close leash exercises or in static Minigames other than the Poste practice.

#### Scenario: Daily Stage
- **WHEN** the Dog fixates on a Distractor in the Daily Stage with the assist at Full
- **THEN** the approach ring is shown

#### Scenario: Taste Stage
- **WHEN** the Dog fixates on a Distractor in the Taste Stage
- **THEN** no approach ring, Check-in arc, count-in tick or Marker highlight is shown

#### Scenario: Close exercise
- **WHEN** a close leash exercise is played
- **THEN** no telegraph is shown and its own calm display is unchanged

### Requirement: Approach ring follows the calm period
While the Dog is fixated and the assist shows the ring, a ring SHALL be drawn around the Dog whose size goes from fully open to closed on the Dog in direct proportion to the elapsed share of the calm period, so that it closes exactly when the calm period completes.

#### Scenario: Half way
- **WHEN** the calm period is 3 s and the Handler has held calm for 1.5 s
- **THEN** the ring is drawn half way between fully open and closed

#### Scenario: Handler not yet calm
- **WHEN** the Dog has just fixated and the Handler is still moving, with the assist at Full or Ring only
- **THEN** the ring is drawn fully open and does not shrink

#### Scenario: Different calm period
- **WHEN** a scenario sets a calm period of 4 s
- **THEN** the ring closes after 4 s of calm, not 3 s

### Requirement: Ring lands on the Perfect moment
When the calm period completes and its Disengagement opens the Reward Window, the ring SHALL show that it has landed on the Dog for the Perfect span (the first 0.3 s of the window) and SHALL then show the rest of the window as the Good span until the window closes or the Marker is pressed.

#### Scenario: Landing
- **WHEN** the calm period completes and the Dog disengages
- **THEN** the ring is drawn closed on the Dog with its landed look on the same frame the Reward Window opens

#### Scenario: Good span
- **WHEN** 0.5 s of the Reward Window have passed without a press
- **THEN** the ring shows the Good span, distinct from the landed look, until the window closes

#### Scenario: Marked
- **WHEN** the user presses the Marker inside the Reward Window
- **THEN** the ring disappears and the usual Feedback Message is shown

### Requirement: Ring snaps open when the calm restarts
When the calm period restarts because the Handler moved or the leash went into Rigid Pull, the ring SHALL return at once to fully open (or, at Late ring, disappear), with a visible snap, and SHALL start closing again only when calm is held again.

#### Scenario: Handler moves
- **WHEN** the ring is two thirds closed and the Handler moves
- **THEN** the ring snaps back to fully open on that frame

#### Scenario: Rigid Pull
- **WHEN** the leash goes into Rigid Pull while the ring is closing
- **THEN** the ring snaps back open and stays open until the leash leaves Rigid Pull with the Handler stopped

#### Scenario: A new Fixation is not a snap
- **WHEN** the Dog fixates on a new Distractor after an earlier Disengagement
- **THEN** the ring appears fully open with no snap

### Requirement: Ring ends without a beat
The ring SHALL fade out without a landing when the Fixation ends without a calm-period Disengagement (the Distractor leaves, or a Cue ends the Fixation). A Disengagement that does not come from the calm period SHALL show no landing.

#### Scenario: Distractor passes
- **WHEN** the Distractor leaves before the calm period completes
- **THEN** the ring fades out and no landing is shown

#### Scenario: Leave It on food
- **WHEN** a "Leave It" Cue on food ends the Fixation at once
- **THEN** no landing is shown for that Reward Window

#### Scenario: Leave It while the ring is closing
- **WHEN** the ring is half closed and a "Leave It" Cue on food ends the Fixation
- **THEN** the ring fades out without a landing

### Requirement: Check-in arc
A smaller arc SHALL build up at the Dog's head before a Check-in whose start time is already decided by the seeded Stage state and that will start a new look while the Dog follows its Drive. It SHALL land on the frame the Dog actually starts the Check-in look, and SHALL fade out without a landing if the Dog stops following its Drive or another look starts first.

#### Scenario: Check-in coming
- **WHEN** the Dog is following its Drive, is not looking at the Handler, and its next Check-in is due in 0.9 s, with the assist at Full
- **THEN** the Check-in arc starts building and lands on the frame the Dog starts to look

#### Scenario: Check-in put off
- **WHEN** the Check-in arc is building and the Dog stops following its Drive (it fixates, holds or returns)
- **THEN** the arc fades out without a landing

#### Scenario: Another look first
- **WHEN** the Check-in arc is building and the Dog starts looking at the Handler because it followed a turn
- **THEN** the arc fades out without a landing

#### Scenario: Looks caused by the player
- **WHEN** the Dog looks at the Handler because it followed a turn or after a Cue
- **THEN** no Check-in arc is shown before that look

#### Scenario: Deferred Check-in
- **WHEN** a Check-in that was due while the Dog was busy happens as soon as it returns to its Drive
- **THEN** no Check-in arc is shown before it

### Requirement: Assist levels
The telegraph SHALL have four assist levels. Full: ring from the start of the Fixation, Check-in arc from 0.9 s before the Check-in, count-in ticks, Marker highlight. Ring only: the same ring and Check-in arc, no ticks or highlight. Late ring: ring only once the calm period is half done, Check-in arc only in its last 0.45 s. Off: nothing.

#### Scenario: Ring only
- **WHEN** the assist is Ring only and the calm period is closing
- **THEN** the ring is shown and no tick is played and the Marker button is not highlighted

#### Scenario: Late ring
- **WHEN** the assist is Late ring and the calm period is 40% done
- **THEN** no ring is shown, and it appears once the calm period is half done

#### Scenario: Off
- **WHEN** the assist is Off and the Dog disengages
- **THEN** no ring, arc, tick or highlight is shown and the user reads the Dog alone

### Requirement: Count-in ticks
At Full assist the system SHALL play a short count-in tick when the calm period reaches one quarter, one half and three quarters, so the Disengagement falls on the fourth beat. The ticks SHALL follow the UI sound setting, SHALL be quieter than the Feedback Message tick and, where the platform can change pitch, lower, and SHALL restart from the first when the calm period restarts.

#### Scenario: Three ticks then the beat
- **WHEN** the calm period is 3 s and the Handler holds calm throughout at Full assist
- **THEN** ticks play at 0.75 s, 1.5 s and 2.25 s and the Reward Window opens at 3 s

#### Scenario: Restart
- **WHEN** the Handler moves after the second tick
- **THEN** the next calm hold plays all three ticks again

#### Scenario: Sounds off
- **WHEN** UI sounds are off
- **THEN** no tick plays and the ring is unchanged

### Requirement: Marker highlight at the Perfect moment
At Full assist the Marker button SHALL be highlighted during the Perfect span of a Reward Window the ring landed on, or of a Check-in look the Check-in arc landed on. The highlight SHALL NOT cover the button, change its size or hit area, or delay input.

#### Scenario: Highlight span
- **WHEN** the Reward Window opens at Full assist
- **THEN** the Marker button is highlighted for 0.3 s and then returns to normal

#### Scenario: Check-in highlight
- **WHEN** the Check-in arc lands at Full assist
- **THEN** the Marker button is highlighted for the first 0.3 s of the Check-in look

### Requirement: Assist steps down after a run of good Marker hits
The assist level SHALL drop one step (Full to Ring only to Late ring to Off) after three successes in a row at the current level. A success is a Marker hit or Check-in hit, graded Perfect or Good. A failure SHALL end a run of successes, and an outcome that is neither SHALL neither count nor end a run. Both runs SHALL start again after any level change. A level change SHALL take effect from the next approach, never during one, and SHALL NOT be announced.

#### Scenario: Three good Marker hits
- **WHEN** the assist is Full and the user makes Marker hits graded Perfect, Good and Perfect in a row
- **THEN** the assist becomes Ring only from the next approach, with no message about it

#### Scenario: Missed opportunity in between
- **WHEN** the assist is Full, the user makes two Marker hits, a Distractor then leaves before the calm period completes, and the user makes a third Marker hit
- **THEN** the assist becomes Ring only from the next approach

#### Scenario: Level drops while a Check-in arc is building
- **WHEN** the assist drops from Full to Ring only while a Check-in arc is building
- **THEN** that arc keeps its Full look until it ends, and the next Fixation's ring plays no ticks and shows no Marker highlight

#### Scenario: Already off
- **WHEN** the assist is Off and the user makes three Marker hits graded Perfect in a row
- **THEN** the assist stays Off

### Requirement: Assist steps back up after a run of misses
The assist level SHALL rise one step after two failures in a row at the current level. A failure is a Reward Window that closes without a press while the user still has Marks, a Late Marker press, or a reactive Marker press made while the calm period is under way (an early press), whether or not the ring is drawn at the current level. Any other outcome SHALL NOT count, and a success SHALL end a run of failures.

#### Scenario: Two misses
- **WHEN** the assist is Late ring and two Reward Windows in a row close without a press
- **THEN** the assist becomes Ring only from the next approach

#### Scenario: Early press
- **WHEN** the user presses the Marker while the Dog is fixated and the ring is closing
- **THEN** the press counts as a failure for the assist

#### Scenario: Early press with no ring drawn
- **WHEN** the assist is Off and the user presses the Marker while the Dog is fixated and the Handler has been calm for 1 s
- **THEN** the press counts as a failure for the assist

#### Scenario: Missed opportunity
- **WHEN** the Distractor leaves before the calm period completes
- **THEN** the assist runs are not changed

#### Scenario: No Marks left
- **WHEN** the Stage's Marks are all spent and a Reward Window closes without a press
- **THEN** the assist runs are not changed

#### Scenario: Already full
- **WHEN** the assist is Full and the user misses twice in a row
- **THEN** the assist stays Full

### Requirement: Assist kept with the Dog
The assist level and its runs SHALL be stored in the Dog record as they change, from every walking Stage that shows the telegraph (the Daily Stage included), and carried into the next Stage. The Taste Stage, close leash exercises and Minigames SHALL NOT change them. A record without them, or after a progress reset, SHALL read as Full with empty runs. Account sync SHALL keep them from the copy saved later, like the rest of the record.

#### Scenario: Next Stage
- **WHEN** the assist dropped to Ring only in a recorded Stage
- **THEN** the next Stage starts at Ring only

#### Scenario: New Dog
- **WHEN** a new Dog plays its first walking Stage
- **THEN** the assist is Full

#### Scenario: Existing Dog after the update
- **WHEN** a Dog saved before this change plays a walking Stage
- **THEN** the assist is Full

#### Scenario: Quit mid-Stage
- **WHEN** the assist drops to Ring only and the user leaves the Stage before its end
- **THEN** the next Stage starts at Ring only

#### Scenario: Daily Stage
- **WHEN** the user makes three Marker hits in a row at Full in the Daily Stage
- **THEN** the next Stage starts at Ring only

#### Scenario: Close exercise
- **WHEN** the user makes Marker hits in a close leash exercise
- **THEN** the assist is unchanged

#### Scenario: Progress reset
- **WHEN** a user whose assist is Off resets progress
- **THEN** the assist is Full again

### Requirement: Always show timing help
When the "always show timing help" setting is on, every telegraphed Stage SHALL show Full assist, and the stored assist level and runs SHALL NOT change. Turning the setting off SHALL return to the stored level from the next Stage.

#### Scenario: Setting on
- **WHEN** the setting is on and the stored assist is Off
- **THEN** the Stage shows the ring, Check-in arc, ticks and Marker highlight

#### Scenario: Setting off again
- **WHEN** the user turns the setting off after five Marker hits graded Perfect made while it was on
- **THEN** the next Stage uses the stored level from before

### Requirement: Approach ring in the Poste practice
The Poste practice Node SHALL show the same approach ring around its Dog, closing in proportion to how long the user has held the Stop out of the hold needed to settle, landing when the Dog settles and snapping open when the hold is released. It SHALL appear whatever the assist level and SHALL NOT change it.

#### Scenario: Hold
- **WHEN** the user has held for half of the hold needed to settle
- **THEN** the ring is half way closed

#### Scenario: Released early
- **WHEN** the user lets go before the Dog settles
- **THEN** the ring snaps back open

### Requirement: Telegraph never changes the Stage
The telegraph and the assist SHALL NOT change the simulation, its inputs, its seeded results, the calm period, the Reward Window, the Marker timing grades or the debrief payload, SHALL NOT delay input and SHALL NOT cover the controls.

#### Scenario: Same run at every level
- **WHEN** a Stage runs with the same seed and inputs at each assist level, with "always show timing help" on, and with no telegraph
- **THEN** all the debrief payloads are identical

### Requirement: Telegraph follows pause
The ring, the Check-in arc, the Marker highlight and the count-in ticks SHALL follow simulation time: they SHALL freeze and play no tick while the Stage is paused and continue from the same point when it resumes.

#### Scenario: Paused mid-approach
- **WHEN** the Stage is paused with the ring half closed
- **THEN** the ring stays half closed and no tick plays until the Stage resumes

### Requirement: Reduced motion and readable without colour
With reduced motion requested, the ring SHALL be drawn as a fixed-size ring that fills around the Dog in step with the same progress, the snap SHALL be a quick fade to empty, and the Marker highlight SHALL be steady instead of pulsing. The landed and Good looks SHALL differ by shape or fill, not colour alone. Any text SHALL come from the i18n catalog in Spanish and English.

#### Scenario: Reduced motion
- **WHEN** reduced motion is requested and the calm period is half done
- **THEN** a fixed-size ring around the Dog is half filled and nothing shrinks or pulses

#### Scenario: Colour-blind reading
- **WHEN** the ring is shown in grey scale
- **THEN** the landed look and the Good span can still be told apart
