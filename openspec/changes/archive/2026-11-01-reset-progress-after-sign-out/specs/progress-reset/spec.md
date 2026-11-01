# Spec Delta

## MODIFIED Requirements

### Requirement: Reset progress action
The Settings screen SHALL offer a Reset progress action whenever no account is signed in, including when the device is still paired with an account's Dog from an earlier session. It SHALL NOT show it, or any disabled placeholder for it, while an account is signed in. After the user confirms, the action replaces the Dog with a brand-new one and returns the user to the welcome screen as on first run. The action SHALL be in its own last section, visually separated from other options, and SHALL NOT run on a single press.

#### Scenario: Reset
- **WHEN** a signed-out user confirms Reset progress
- **THEN** the welcome screen is shown with no earlier answers

#### Scenario: Cancel
- **WHEN** the user opens the confirmation and cancels
- **THEN** nothing is changed

#### Scenario: Signed in
- **WHEN** an account is signed in
- **THEN** Settings shows no Reset progress section

#### Scenario: Paired with a cloud Dog
- **WHEN** no account is signed in but the device is still paired with an account's Dog (for example after logging out)
- **THEN** Settings shows the Reset progress section

#### Scenario: Signing in hides it
- **WHEN** the user signs in while Settings is open
- **THEN** the Reset progress section disappears

#### Scenario: Account copy untouched
- **WHEN** a signed-out user whose device is paired with an account's Dog confirms Reset progress
- **THEN** the Dog saved in the account is not changed or deleted

### Requirement: Explicit confirmation
The confirmation SHALL name what is lost (Dog, Learning Attributes, Streak, Stars, Walk Diary and Daily Stage scores), state that it cannot be undone, and require a deliberate second action (a distinct destructive button, with Cancel as the default). It SHALL NOT require typing. When the device is still paired with an account's Dog, it SHALL also state that the Dog saved in the account is kept and that logging in again will ask which Dog to keep.

#### Scenario: Warning text
- **WHEN** the confirmation opens
- **THEN** it lists what will be erased and says it cannot be undone

#### Scenario: Account note when paired
- **WHEN** the confirmation opens on a signed-out device still paired with an account's Dog
- **THEN** it also says the account's Dog is kept and logging in again will ask which Dog to keep

#### Scenario: No account note when never paired
- **WHEN** the confirmation opens on a device that was never paired with an account's Dog
- **THEN** it does not mention an account
