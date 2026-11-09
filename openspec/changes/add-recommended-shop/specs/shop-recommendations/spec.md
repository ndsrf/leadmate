# Spec Delta

## Purpose
Lets authors attach a Recommendation from the Shop, with its own explanation, to any Lesson, Node or Mission so that a Product is offered at the moment it would help the user.

## ADDED Requirements

### Requirement: Recommendations on content items
The system SHALL let a Lesson, Node or Mission carry any number of Recommendations. Each Recommendation SHALL point at exactly one Product, Subcategory or Category, SHALL name one trigger, and SHALL have an explanation in the pack's text for each language, with Spanish required and used as the fallback.

#### Scenario: Recommend a Subcategory from a Node
- **WHEN** an author adds a Recommendation on the Poste Node pointing at the "Collares" Subcategory with the explanation "Con un collar como estos hacer el Poste es mucho más fácil…"
- **THEN** that explanation is shown with the Recommendation and tapping it opens that Subcategory

#### Scenario: Recommend a single product
- **WHEN** a Recommendation points at a Product
- **THEN** tapping it opens that Product's detail, and the Shop's back action leads to the Product's Subcategory

#### Scenario: Several recommendations
- **WHEN** an item has more than one Recommendation for the same trigger
- **THEN** they appear in the authored order and at most two are shown at once

### Requirement: Triggers are limited to known signals
The system SHALL support exactly these triggers: `view` (a card on the item's own screen), `poste-trouble` (the Poste failure streak has reached 2), `poor-score` (a graded Stage ended with a handling score under 200 out of 1000) and `problem` with a Mission problem id (the user chose that problem at a Mission check-in). The system SHALL reject any other trigger at validation.

#### Scenario: Unknown trigger
- **WHEN** a Recommendation names a trigger that is not in the list
- **THEN** validation fails naming the file and the allowed values

#### Scenario: Problem trigger on a Mission
- **WHEN** a Recommendation on a Mission names the problem `pulls-ahead` and the user reports that problem at the check-in
- **THEN** the Recommendation is offered together with the Fix for that problem

### Requirement: Recommendations to missing or unbuyable targets never break the app
The system SHALL ignore a Recommendation whose target does not exist in the active pack or has nothing buyable in the user's language, SHALL NOT show it, and SHALL NOT crash.

#### Scenario: Target removed after publish
- **WHEN** a Recommendation points at a Product that is no longer in the active pack
- **THEN** it is not shown and the item otherwise behaves as before

#### Scenario: No buy link in the user's language
- **WHEN** the target Product has no buy link for the user's language
- **THEN** the Recommendation is not shown to that user

### Requirement: View trigger shows a card
The system SHALL show a Recommendation with the `view` trigger as a card with its explanation and a "Ver en la tienda" action on the item's own screen, in a place that does not hide the item's main content.

#### Scenario: Lesson with a recommendation
- **WHEN** the user reads a Lesson carrying a `view` Recommendation
- **THEN** the Lesson shows the card with the explanation and action

### Requirement: Trouble triggers show the self-dismissing popup
The system SHALL show a Recommendation with a `poste-trouble`, `poor-score` or `problem` trigger as the self-dismissing popup of the Shop offer, carrying the Recommendation's explanation and a "Ver" action, only after the attempt has ended and the user is back on the World Map, and after any advert the exit would show.

#### Scenario: Trouble with the Poste
- **WHEN** the Poste failure streak reaches 2 and the Poste Node has a `poste-trouble` Recommendation
- **THEN** on the World Map a popup shows the explanation and a "Ver" action and disappears by itself after 10 seconds

#### Scenario: Particularly poor score
- **WHEN** a graded Stage ends with a handling score under 200 and its Node has a `poor-score` Recommendation
- **THEN** the popup is shown on the World Map

#### Scenario: Never during the attempt
- **WHEN** the user is mid-attempt in the Node
- **THEN** no popup is shown until the attempt has ended

#### Scenario: Not stacked with an advert
- **WHEN** a free-tier user's exit from a Stage shows an interstitial advert
- **THEN** the popup appears only after the advert has closed and the World Map is shown

### Requirement: Daily limits on shop popups
The system SHALL show at most one shop popup per calendar day, whether from a trouble trigger or the general Shop offer, and SHALL show a given Recommendation's popup at most once per day. A trouble popup takes precedence over the general offer.

#### Scenario: Two troubles in one day
- **WHEN** the user triggers a `poste-trouble` and then a `poor-score` Recommendation on the same day
- **THEN** only the first popup is shown that day

#### Scenario: General offer on a trouble day
- **WHEN** a trouble popup was already shown today
- **THEN** the general Shop offer is not shown that day

### Requirement: No targeting by the Dog's Equipment in this version
The system SHALL show Recommendations regardless of the Dog's recorded Equipment.

#### Scenario: Dog already has a front-clip harness
- **WHEN** a collar Recommendation's trigger fires for a Dog whose Equipment is a front-clip harness
- **THEN** the Recommendation is still shown

### Requirement: Recommendation state stays on the device
The system SHALL remember on the device only when popups and Recommendations were last shown, and SHALL NOT send which Products a user viewed or tapped to any service the app does not already use for the same purpose.

#### Scenario: Reinstall
- **WHEN** the app data is cleared
- **THEN** frequency limits start again and no account data is affected
