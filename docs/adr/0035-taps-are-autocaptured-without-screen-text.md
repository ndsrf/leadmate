# Taps are autocaptured without screen text

Amends ADR 0031. To see what users do between declared events and where they give up, Usage Analytics records taps with the PostHog SDK's touch autocapture instead of a declared event per button. This is a deliberate exception to "the typed contract drops anything undeclared": tap events bypass the contract, so they are limited by configuration instead. They capture only component names, fixed `testID`s and `ph-label`s (never element text or accessibility labels, where the Dog's name appears), and the Dog-name input and the login, registration and account views are excluded with `ph-no-capture`. The context properties (screen, progress, Plus status, App Session, platform, runtime) are registered as PostHog super properties after contract validation, so taps carry the same context as declared events.

## Considered Options

- **A declared `ui_action` event with an action id from a fixed list:** keeps every event inside the contract, but each new button needs a contract entry and missed buttons stay invisible. Rejected for coverage without upkeep.
- **No taps, only screen views:** the safest, but cannot show which control a user tried before giving up. Rejected.
- **`posthog-js` for mouse clicks on web:** a second SDK for a platform used only for testing. Rejected; web records touch taps only.

## Consequences

- `testID`s and `ph-label`s must be fixed strings; a test fails on any built from a template string or variable.
- The privacy policy and store data-safety answers name tap capture before the production key ships.
- Turning analytics off stops taps like every other event, because they go through the same opted-out client.
