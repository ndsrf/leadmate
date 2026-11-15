# Spec Delta

## MODIFIED Requirements

### Requirement: Coming-soon Worlds show a state for the user's membership
A Coming-soon World (a Plus World with no Stops yet) SHALL, when expanded, show a card that depends on whether the user has LeadMate Plus. A free user SHALL see the Plus teaser and a button that opens the paywall. A Plus user, on trial or subscribed, SHALL see a "Próximamente" card with a short description of what the World will teach and its planned walk count, and SHALL NOT see Plus-purchase wording or a paywall button. The card SHALL use the same membership check as the rest of the map, so it changes without leaving the map when the trial starts or ends.

#### Scenario: Free user opens a Coming-soon World
- **WHEN** a free user expands World 7
- **THEN** the card shows the Plus teaser and a button that opens the paywall

#### Scenario: Trial user opens a Coming-soon World
- **WHEN** a user with an active trial expands World 7
- **THEN** the card shows "Próximamente", what the World will teach and "4 paseos planificados", and no paywall button

#### Scenario: Plus user before finishing the World before
- **WHEN** a Plus user who has not completed World 6 expands World 7
- **THEN** the unlock banner "Termina «…» en el Mundo 6 para abrir este mundo" still shows above the "Próximamente" card, with no paywall button

#### Scenario: Subscriber opens a Coming-soon World
- **WHEN** a subscribed user expands World 9
- **THEN** the card shows "Próximamente" and what that World will teach, with no paywall wording

#### Scenario: Trial starts with a Coming-soon World open
- **WHEN** a free user starts the trial from the paywall and returns to the map with a Coming-soon World expanded
- **THEN** that World's card now shows the "Próximamente" state

#### Scenario: Trial ends with a Coming-soon World open
- **WHEN** the trial ends while a Coming-soon World is expanded
- **THEN** its card changes to the Plus teaser with the paywall button

### Requirement: More-coming card at the end of the map
After the last World, the map SHALL show a "Más próximamente" card listing the training scenarios planned after Worlds 7–9. A free user SHALL also see the Plus disclaimer and a button that opens the paywall. A Plus user SHALL see the list only. The card SHALL be informational and SHALL NOT open any Stop.

#### Scenario: Free user reaches the end of the map
- **WHEN** a free user scrolls past the last World
- **THEN** the card lists the upcoming scenarios, shows the Plus disclaimer and a paywall button

#### Scenario: Plus user reaches the end of the map
- **WHEN** a Plus user scrolls past the last World
- **THEN** the card lists the upcoming scenarios and shows no paywall button

#### Scenario: Screen reader
- **WHEN** a screen reader reaches the card
- **THEN** it reads the heading and each scenario as text, and the paywall button, when present, is labelled

## ADDED Requirements

### Requirement: A World with more Stretches coming says so
A playable World whose pack still lists planned Stops beyond those it has SHALL show a short note after its last Stretch saying more Stretches are coming. The note SHALL be informational, SHALL NOT open any Stop, and SHALL NOT affect completion or the next World's unlock.

#### Scenario: World 6 with one Stretch
- **WHEN** a Plus user expands World 6 with only the unpredictable walks Stretch
- **THEN** a note after the Stretch says more Stretches are coming, and passing its Mission completes the World

#### Scenario: Note disappears
- **WHEN** a World holds every planned Stretch
- **THEN** no note shows
