# plus-membership Specification

## Purpose
Decides whether the user currently has LeadMate Plus, so features reserved for Plus can ask one place and the paywall can grant it.

## Requirements

### Requirement: Active free trial counts as Plus
The system SHALL treat the user as a LeadMate Plus member from the moment they start the free trial until 7 days after it, measured from the recorded trial start. Before a trial start, and after the 7 days, the user SHALL be a free user. There is no paid subscription yet.

#### Scenario: Trial started today
- **WHEN** the user tapped "Empezar prueba" today
- **THEN** the user is Plus

#### Scenario: Trial over
- **WHEN** the trial started 8 days ago
- **THEN** the user is a free user

#### Scenario: Never started
- **WHEN** the user chose "Quizá más tarde" and never started the trial
- **THEN** the user is a free user

#### Scenario: Clock earlier than the trial start
- **WHEN** the device time is earlier than the recorded trial start
- **THEN** the user is a free user

### Requirement: One trial per Dog
The free trial SHALL start at most once per Dog record. Starting it again from the paywall SHALL NOT move the recorded start.

#### Scenario: Paywall after the trial ended
- **WHEN** a user whose trial is over taps "Empezar prueba" again
- **THEN** the trial start is unchanged and the user stays free

### Requirement: One membership for every Plus feature
Every LeadMate Plus feature, Day Skips and Plus Worlds included, SHALL check Plus membership and nothing else. Everything that reads whether a Plus World is open (the World Map, opening its Stops and the World unlock celebration) SHALL use the same membership at the same moment. When the trial ends while the World Map is open, the map SHALL show the Plus Worlds locked without the user leaving it.

#### Scenario: Plus World during the trial
- **WHEN** a user with an active trial has completed the World before a playable Plus World
- **THEN** that Plus World is unlocked

#### Scenario: Plus World after the trial
- **WHEN** the trial is over
- **THEN** a Plus World stays locked and shows that it needs LeadMate Plus

#### Scenario: Plus World unlock celebrated during the trial
- **WHEN** a user with an active trial completes the World before a Plus World
- **THEN** the World unlock celebration names that Plus World

#### Scenario: Trial ends with the map open
- **WHEN** the World Map is on screen at the moment the trial ends
- **THEN** the Plus Worlds are shown locked from that moment

### Requirement: Paywall reachable from Plus features
A Plus-only action used by a free user SHALL open the paywall. If the user starts the trial there, the action SHALL complete. If they close the paywall or choose "Quizá más tarde", nothing SHALL change. If their trial is already over, "Empezar prueba" SHALL NOT do the action, and the user SHALL return to where they were. Returning to where they were SHALL show the screen as it stands at that moment, not as it was when they left.

#### Scenario: Start trial from a Plus action
- **WHEN** a free user taps a Plus-only action and then "Empezar prueba"
- **THEN** the trial starts, the user returns to where they were and the action is done

#### Scenario: Decline
- **WHEN** a free user taps a Plus-only action and then "Quizá más tarde"
- **THEN** the user returns to where they were and the action is not done

#### Scenario: Start trial after the trial is over
- **WHEN** a user whose trial is over taps a Plus-only action and then "Empezar prueba"
- **THEN** the user returns to where they were, the trial start is unchanged and the action is not done

### Requirement: Trial lifecycle states and countdown
The system SHALL determine the user's trial lifecycle state as unstarted when no trial start is recorded, active when within 7 days from the recorded start, or expired when 7 days have elapsed. While active, the system SHALL compute remaining days as integer days from 1 to 7.

#### Scenario: Active trial with 5 days left
- **WHEN** the trial started 2 days ago
- **THEN** trial state is active and remaining days is 5

#### Scenario: Trial on its final day
- **WHEN** the trial started 6 days and 18 hours ago
- **THEN** trial state is active and remaining days is 1

#### Scenario: Trial expired
- **WHEN** the trial started 7 days and 1 hour ago
- **THEN** trial state is expired

### Requirement: Post-trial Value Recap presentation
On the first app launch after the trial expires, the system SHALL present a Value Recap screen that summarizes the user's achievements during the trial, including active streak days, completed videos, and Day Skips used. The screen SHALL provide full subscription options and a clear bypass button to continue on the free tier.

#### Scenario: First launch after trial expiry
- **WHEN** the app opens for the first time after the 7-day trial has elapsed
- **THEN** the Value Recap screen is displayed with dog activity stats and subscription choices

#### Scenario: Bypassing the Value Recap
- **WHEN** the user selects "Continuar con la versión gratuita" on the Value Recap screen
- **THEN** the user enters the World Map as a free user and the Value Recap does not show again on subsequent launches

#### Scenario: Re-encountering conversion after trial expiry
- **WHEN** a user with an expired trial taps a Plus-only feature or the expired map chip
- **THEN** the conversion screen is displayed with full subscription options

### Requirement: Pending action completion on trial start or subscription
When a user starts the trial or subscribes from a Plus-only feature trigger, the system SHALL activate Plus membership, return the user to the initiating screen, and execute the pending action immediately without requiring a second tap.

#### Scenario: Starting trial from a locked video
- **WHEN** a free user taps a locked video card and starts the trial on the paywall
- **THEN** the user is returned to the Lesson with the video playing

#### Scenario: Dismissing paywall keeps pending action unexecuted
- **WHEN** a free user taps a locked video card and dismisses the paywall with "Quizá más tarde"
- **THEN** the user returns to the Lesson with the video remaining locked

### Requirement: Mock subscription confers Plus membership
The system SHALL consider the user as possessing LeadMate Plus when either an active trial is in progress or a subscription has been recorded in onboarding state (`mockSubscribed`).

#### Scenario: Subscribing after trial expiry
- **WHEN** a user with an expired trial selects a subscription plan
- **THEN** the user receives Plus membership and access to all Plus features

