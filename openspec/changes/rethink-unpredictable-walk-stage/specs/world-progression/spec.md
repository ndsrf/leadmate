# Spec Delta

## MODIFIED Requirements

### Requirement: A World can grow after it is completed
When Stretches are added to a World, ahead of or after existing ones, or Stops are added to a Stretch, the World SHALL keep the progress already made, SHALL keep every Stop the user could already reach available even if a newly added earlier Mission is not passed, SHALL open the new Stretches or Stops, and SHALL leave the World it unlocked unlocked.

#### Scenario: New Stretch ships
- **WHEN** a user completed World 6 with one Stretch and a later content update adds a second
- **THEN** World 6 shows the new Stretch as open, the done Stops stay done, and World 7 does not lock again

#### Scenario: Not yet completed
- **WHEN** a user is part-way through World 6 when a Stretch is added after the existing ones
- **THEN** their position is kept and the new Stretch comes after the existing ones

#### Scenario: Stretch inserted ahead of one in progress
- **WHEN** a user is part-way through the "Unpredictable walks" Stretch and an update inserts "Let them sniff" before it
- **THEN** the Stops they could already reach stay available, "Let them sniff" is open to play, and its unpassed Mission does not lock "Unpredictable walks"

#### Scenario: New user after the insertion
- **WHEN** a user reaches World 6 for the first time after the update
- **THEN** "Unpredictable walks" opens only after the "Let them sniff" Mission is passed, as for any Stretch

#### Scenario: Stops added to a finished Stretch
- **WHEN** a user passed the "Unpredictable walks" Mission and an update adds the keep-it-fresh Node before that Mission
- **THEN** the new Node shows as open and playable, the Mission stays passed, and World 6 stays complete
