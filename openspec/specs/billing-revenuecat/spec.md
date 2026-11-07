# billing-revenuecat Specification

## Purpose
Provides native in-app subscription billing via RevenueCat, synchronizing store purchases and active Plus entitlements with Supabase user accounts while maintaining offline continuity.

## Requirements

### Requirement: Subscription offerings presentation
The system SHALL fetch available subscription packages from store offerings via the billing service and display localized pricing and terms for Annual and Monthly plans.

#### Scenario: Live offerings fetched successfully
- **WHEN** the subscription conversion screen opens and store offerings are retrieved
- **THEN** the screen displays the actual localized prices and billing intervals from the store

#### Scenario: Offerings fetch failure falls back gracefully
- **WHEN** the billing service cannot retrieve store offerings due to network or configuration errors
- **THEN** the screen displays fallback localized pricing with an indicator that the store is reconnecting

### Requirement: Subscription purchase execution
The system SHALL initiate native in-app purchases for selected subscription packages and activate Plus membership upon verified transaction success.

#### Scenario: Successful subscription purchase
- **WHEN** the user selects a subscription tier and confirms purchase in the native store sheet
- **THEN** the purchase completes, the active entitlement is granted, and the user receives immediate Plus access

#### Scenario: User cancels store purchase
- **WHEN** the user cancels the native store purchase sheet
- **THEN** no charge is made, Plus is not granted, and the user returns to the paywall without errors

#### Scenario: Store transaction failure displays non-blocking alert
- **WHEN** a payment transaction fails due to a billing or network error
- **THEN** the system displays a localized non-blocking notice and remains on the paywall so the user can retry

### Requirement: Supabase user identity aliasing
The system SHALL associate RevenueCat customer identity with the authenticated Supabase user ID, transferring anonymous purchases upon registration and resetting customer identity on sign-out.

#### Scenario: User logs in or registers with Supabase
- **WHEN** an unauthenticated or anonymous user signs in or creates an account with Supabase
- **THEN** the billing service logs into RevenueCat with the Supabase user ID and aliases existing entitlements to that account

#### Scenario: User signs out of Supabase
- **WHEN** the user signs out of their Supabase account
- **THEN** the billing service logs out of RevenueCat and reverts to a new anonymous customer session

### Requirement: Purchase restoration
The system SHALL provide a restore purchases action that queries store receipts and updates active entitlements for the current user.

#### Scenario: Successful entitlement restoration
- **WHEN** a user taps "Restaurar compras" and has a valid active subscription on their store account
- **THEN** active entitlements are restored and the user receives Plus membership

#### Scenario: Restoration with no prior purchases
- **WHEN** a user taps "Restaurar compras" but no active subscription exists on their store account
- **THEN** the system notifies the user that no active subscription was found and leaves their tier unchanged

### Requirement: Offline entitlement continuity
The system SHALL cache verified subscription entitlements locally so that Plus features remain fully functional without requiring real-time network access to the billing server on every launch.

#### Scenario: Launching app offline with cached subscription
- **WHEN** a subscribed user opens the app without internet connectivity
- **THEN** the app reads the cached entitlement and unlocks all Plus features

### Requirement: Account deletion subscription advisory
When a user initiates account deletion, the system SHALL display an advisory informing them that deleting their account does not automatically cancel their store subscription, with guidance to manage subscriptions in device settings.

#### Scenario: Advisory displayed on account deletion prompt
- **WHEN** the user opens the delete account confirmation dialog
- **THEN** the confirmation dialog includes guidance on cancelling the subscription in store settings

### Requirement: Test Store keys only in debug builds
The system SHALL use the RevenueCat Test Store key only in debug (development client) builds, where purchases are simulated. Release builds, including internal preview builds, SHALL use real store keys or none; with none, billing falls back to the mock service.

#### Scenario: Debug build with the Test Store key
- **WHEN** a development client build runs with the Test Store key
- **THEN** a purchase shows the simulated Test Store purchase and nothing is charged

#### Scenario: Release build without store keys
- **WHEN** a release build has no store key configured
- **THEN** it uses the mock billing service and does not close

#### Scenario: Anonymous user signs out
- **WHEN** the app signs out while the RevenueCat user is still anonymous
- **THEN** no log-out call is made and no error is logged
