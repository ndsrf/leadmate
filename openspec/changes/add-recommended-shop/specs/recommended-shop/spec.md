# Spec Delta

## Purpose
Gives LeadMate a small curated shop of recommended products, described entirely by the Content Pack, that users can browse and buy from with one tap to an external store, and that the app can offer at suitable moments.

## ADDED Requirements

### Requirement: Shop catalogue in three levels
The system SHALL present the shop as an ordered list of Categories, each holding an ordered list of Subcategories, each holding an ordered list of Products. A Category and a Subcategory SHALL each have a title and a brief description. A Product SHALL have a name, a description, a picture, a price and a buy link for each language it is sold in.

#### Scenario: Browse down the catalogue
- **WHEN** the user opens the Shop, picks the Category "Collares y arneses", then one of its Subcategories
- **THEN** the screens show each level's title and description in turn and finally that Subcategory's Products in the authored order

#### Scenario: Empty shop
- **WHEN** the active pack contains no Categories
- **THEN** no basket button and no shop offer is shown anywhere in the app

#### Scenario: Subcategory without products
- **WHEN** a Subcategory lists no Products
- **THEN** the Shop does not list that Subcategory, and a Category with no listed Subcategories is not listed either

### Requirement: Buy links are per language
The system SHALL hold a Product's buy link per language with no fallback to another language's link, SHALL hide a Product that has no buy link for the user's language, and SHALL hide any Subcategory or Category left with nothing buyable. A Product's name, description and picture SHALL still fall back to Spanish section by section.

#### Scenario: English user, Spanish-only product
- **WHEN** a Product has only a Spanish buy link and the user's language is English
- **THEN** the Product is not shown to that user

#### Scenario: Add a market
- **WHEN** an author adds an English buy link to a Product
- **THEN** English users see it, with Spanish text where no English text exists

### Requirement: One-tap buy hand-off
The system SHALL show a Buy action on each Product in the list and in its detail, and SHALL open the Product's buy link in the device's external browser or store app when it is tapped. The system SHALL NOT process payment inside the app.

#### Scenario: Buy a product
- **WHEN** the user taps Buy on a Product
- **THEN** the product's link opens outside the app and the app stays on the same screen when the user returns

#### Scenario: Offline
- **WHEN** the device is offline
- **THEN** the catalogue, text and bundled pictures still show, and tapping Buy tells the user that a connection is needed

#### Scenario: Link cannot be opened
- **WHEN** the device cannot open the link
- **THEN** the user sees a short error and the app does not crash

### Requirement: Honest price and sponsorship disclosure
The system SHALL label each shown price as approximate ("precio orientativo") together with the month it was checked, and SHALL show a note on the Shop screens stating that the links are recommendations and that LeadMate may earn a commission when the product comes from an affiliate link. The system SHALL also show a fixed note on the Shop screens advising the user to choose according to their dog's size and health and to consult a vet when in doubt; packs SHALL NOT be able to remove or change it.

#### Scenario: Price shown
- **WHEN** a Product with a price is displayed
- **THEN** the price is shown with the "precio orientativo" label and the month it was checked

#### Scenario: Health note
- **WHEN** any Shop screen is shown
- **THEN** the fixed note about size, health and the vet is visible on it

#### Scenario: Product without price
- **WHEN** a Product has no price
- **THEN** the Product shows no price line and remains buyable

### Requirement: Product pictures degrade gracefully
The system SHALL show the Product's picture from the pack's media, and SHALL show a themed placeholder when the picture is missing or fails to load, without shifting the layout.

#### Scenario: Missing picture
- **WHEN** a Product's picture cannot be loaded
- **THEN** a placeholder of the same size is shown and the product text and Buy action remain usable

### Requirement: Basket entry point on the World Map
The system SHALL open the Shop from the basket button on the World Map, from the Shop offer popup and from a recommendation, and SHALL return to the World Map with its scroll position kept when the Shop is closed.

#### Scenario: Open from the basket
- **WHEN** the user taps the basket button on the World Map
- **THEN** the Shop opens at its first level

#### Scenario: Close the Shop
- **WHEN** the user leaves the Shop
- **THEN** the World Map is shown where it was

### Requirement: Self-dismissing shop offer popup
The system SHALL offer the Shop with a brief non-blocking popup asking whether the user wants to visit it, SHALL dismiss that popup by itself 10 seconds after it appears, and SHALL open the Shop if the user taps its action before then. The popup SHALL NOT take focus from the screen under it or block that screen's controls.

#### Scenario: Popup times out
- **WHEN** the offer appears and the user does nothing for 10 seconds
- **THEN** the popup disappears and nothing else changes

#### Scenario: User accepts
- **WHEN** the user taps the popup's action within 10 seconds
- **THEN** the Shop opens and the popup is gone

#### Scenario: User dismisses
- **WHEN** the user taps the popup's close control
- **THEN** the popup disappears at once

#### Scenario: Screen reader
- **WHEN** a screen reader is active
- **THEN** the popup is announced and stays visible until dismissed, so that a 10-second limit never hides it before it can be read

### Requirement: Offer frequency and no interruption of training
The system SHALL show the general Shop offer on the World Map at most once every 3 days and not on the first day of use, SHALL stop offering it after the user has dismissed or let it expire 3 times without opening the Shop, and SHALL NOT show any shop popup during a walk simulation, a timing minigame, a close exercise or a Lesson in progress.

#### Scenario: Offer rate limit
- **WHEN** the offer was shown less than 3 days ago
- **THEN** it is not shown again on the World Map

#### Scenario: During a simulation
- **WHEN** a simulation or minigame is running
- **THEN** no shop popup is rendered over it

#### Scenario: Repeated indifference
- **WHEN** the user has ignored the general offer 3 times
- **THEN** the general offer is no longer shown, while the basket button and contextual recommendations remain

### Requirement: Shop is available to every user
The system SHALL make the Shop available to free and Plus users alike and SHALL NOT show banner or interstitial adverts on the Shop screens.

#### Scenario: Free user
- **WHEN** a free-tier user opens the Shop
- **THEN** all Categories and Products are available and no advert is shown on the Shop screens

### Requirement: Amazon product import for authors
The system SHALL provide an authoring command that, given an Amazon product link, writes a Product folder with the name, description, price and main picture it could extract, SHALL list the fields it could not extract, and SHALL leave the author to review and correct the result. The command SHALL accept Amazon links of any marketplace, SHALL fill the buy link of the language the author names (Spanish by default), and SHALL add the affiliate tag configured for that marketplace in the author's local environment file, adding none and warning when no tag is configured. The command SHALL NOT run inside the app, and any field it cannot fill SHALL be fillable by hand.

#### Scenario: Import succeeds
- **WHEN** an author runs the import with a valid Amazon product link
- **THEN** a Product folder is created with the link, the extracted name, description and price, the main picture stored in its `media/` folder, and its source marked as Amazon

#### Scenario: Partial extraction
- **WHEN** the page yields a name and picture but no price
- **THEN** the Product is still created, the report names the missing price, and validation does not fail for the missing optional field

#### Scenario: Amazon blocks the request
- **WHEN** Amazon returns a robot check or an error
- **THEN** the command writes nothing, reports why, and tells the author to fill the Product by hand

#### Scenario: Not an Amazon link
- **WHEN** the link is not on an Amazon domain
- **THEN** the command refuses and explains that non-Amazon Products are written by hand

#### Scenario: Tag per marketplace
- **WHEN** the author imports an amazon.es link and a tag for that marketplace is configured
- **THEN** the stored Spanish buy link carries that tag, and a tag configured for another marketplace is never used on it

#### Scenario: Existing product
- **WHEN** the target Product id already exists
- **THEN** the command does not overwrite it unless run with an explicit overwrite flag
