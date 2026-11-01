# Spec Delta

## ADDED Requirements

### Requirement: Signed-out account status
While no account is signed in, the Account section of Settings SHALL say where the Dog is kept. On a device with no Pairing it SHALL say the progress is only on this device. On a device still paired with an account's Dog it SHALL say the Dog is still saved in the account but does not sync until the user logs in again.

#### Scenario: Never paired
- **WHEN** a user who has never signed in on this device opens Settings
- **THEN** the Account section says the progress is only on this device

#### Scenario: Logged out but still paired
- **WHEN** a user logs out and opens Settings
- **THEN** the Account section says the Dog is still saved in the account and does not sync until they log in again

#### Scenario: After Reset Progress on a paired device
- **WHEN** a signed-out user on a paired device completes Reset Progress and later opens Settings
- **THEN** the Account section says the progress is only on this device
