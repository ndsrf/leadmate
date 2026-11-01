# Spec Delta

## MODIFIED Requirements

### Requirement: Active free trial counts as Plus
The system SHALL treat the user as a LeadMate Plus member from the moment they start the free trial until 7 days after it, measured from the recorded trial start. Before a trial start, and after the 7 days, the user SHALL be a free user unless an active subscription is present.

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

### Requirement: Mock subscription confers Plus membership
The system SHALL consider the user as possessing LeadMate Plus when either an active trial is in progress or an active subscription entitlement has been verified via the billing service (or recorded in mock development mode).

#### Scenario: Subscribing after trial expiry
- **WHEN** a user with an expired trial completes a subscription purchase
- **THEN** the user receives Plus membership and access to all Plus features

## ADDED Requirements

### Requirement: Restore purchases grants Plus
When a user restores purchases and has an active store subscription entitlement, the system SHALL immediately grant LeadMate Plus membership.

#### Scenario: Restoring valid subscription from paywall
- **WHEN** a user with an expired trial restores an active store subscription
- **THEN** the user immediately becomes Plus and gated features unlock
