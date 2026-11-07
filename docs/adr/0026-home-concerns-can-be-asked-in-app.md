---
status: accepted
---
# Home concerns can be asked in the app, not only in onboarding

Until now every Home Concern (ADR 0023) was declared in onboarding or edited in Settings. Being left alone (`alone`) is different: owners often do not know their Dog struggles with it until the Dog has been left, and onboarding already limits the Main Concerns to three. Asking about it on day one would also crowd the first session.

`alone` is a Home Concern with a level of 1 to 3 like the other five, but onboarding never offers it and it can never be a Main Concern. It is asked once, inside World 2, by a card ("¿Cómo lleva {name} quedarse solo en casa?") once World 2 is unlocked. The answer is kept on the Dog record (`aloneAnswer`) so the question is asked once, on every device, and is translated into a level: "a veces" is level 2, "mal" is level 3, "muy bien" and "aún no lo sé" create no Concern. Making `alone` a Concern any other way (Other Home Behaviours, Settings) counts as answering.

ADR 0023 still decides where the Stretch lives: it joins World 2 when `alone` is a Concern, unless World 2 is already complete, and otherwise stays in Other Home Behaviours.

## Considered Options

- **Ask in onboarding as a sixth home chip:** Raises the three-Main-Concern pressure and asks before the owner has seen the Dog alone.
- **Offer it only from Other Home Behaviours:** Most owners would never open that optional section, so those who need the course would not find it.
- **A one-time in-app card, remembered on the record (chosen):** Reaches owners who need it, asks once, and costs one tap for those who do not.

## Consequences

- The Dog record moves to version 11 with an optional `aloneAnswer`. An older build that re-saves a version 11 record drops the field, so the card may reappear there; this is accepted.
- Sync keeps the answer if either copy has it, and the level and World 2 membership for `alone` travel with the answer, so a stale device with a later `updatedAt` cannot cancel the level of an answered question. This is the only exception to last-write-wins on `homeConcerns` (ADR 0006).
- Answering is not progress: no stars, Streak, Walk Diary or Activity Log entry, and the day is not an Active Day.
- This is one card for one Concern, not a general question framework. A second in-app question would justify extracting one.
