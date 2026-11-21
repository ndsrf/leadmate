# Anonymous Usage Analytics, on by default with a Settings opt-out

LeadMate sends a small, versioned set of Usage Analytics events to PostHog (EU region) from the Shell only, identified by a random Install Id that is never linked to an account or Dog, so we can see where new users stop before changing the first session. Analytics is on for any user who has not touched the switch and can be turned off in Settings at any time; the default lives in one constant (`DEFAULT_ENABLED`) and is resolved at read time for users who never chose, so a later build can switch every such user to opt-in without a data migration. The simulation never emits or depends on analytics (ADR 0002).

## Considered Options

- **Consent prompt before any event (opt-in):** the safest reading of GDPR/ePrivacy, but a prompt in the first seconds of the Funnel adds a screen at exactly the point we are trying to measure, and declines would leave the baseline biased toward the most engaged users. Rejected for now; kept one constant away.
- **Reuse the ads UMP consent (ADR 0018):** couples two purposes with different legal bases and makes analytics depend on the ad SDK. Rejected.
- **Identify events by account id:** would let us join funnel and account data, but makes every event personal data tied to an identity and breaks the anonymous promise in the Settings text. Rejected.
- **Calling the vendor SDK directly from screens:** nothing would stop free text or ids from leaking. Rejected for a typed contract that drops anything undeclared.

## Consequences

- Events are data-minimal by construction: only declared whole numbers, booleans, fixed values and content ids; no IP, GeoIP, person profiles or free text.
- The Install Id is pseudonymous personal data. The privacy policy and store data-safety forms describe it before the production key ships, and the opt-out default must be confirmed by whoever owns legal before release.
- Reset Progress and account deletion keep the Install Id and the choice; Android backup may restore them with the Dog.
- Rollback is removing the project key from the build profile: the Shell falls back to a mock and sends nothing.
