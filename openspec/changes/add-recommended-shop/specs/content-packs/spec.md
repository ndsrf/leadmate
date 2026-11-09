# Spec Delta

## ADDED Requirements

### Requirement: Shop items are Content Pack items
The system SHALL describe the shop's Categories, Subcategories and Products as plain files in the pack: one folder per item holding its structure file, one text file per language and its pictures, plus one ordered list of Categories for the shop. Ids SHALL follow the pack's id rules and be unique across all item kinds.

#### Scenario: Add a product with files only
- **WHEN** an author adds a Product folder and lists its id in a Subcategory
- **THEN** the pack validates and the built app shows that Product in the Shop without a code change

#### Scenario: Reorder shop content
- **WHEN** an author changes the order of Products in a Subcategory, of Subcategories in a Category or of Categories in the shop
- **THEN** the Shop shows the new order and no id changes

#### Scenario: Retire a product
- **WHEN** an author deletes a Product folder and adds its id to `retired`
- **THEN** the pack validates and the Product is gone from the Shop

### Requirement: Shop validation
The system SHALL validate shop items with file, field and fix hint for every problem, SHALL fail when a listed id has no folder, when a Subcategory belongs to no Category, when a Product belongs to no Subcategory, when a Product has no buy link in Spanish, when a buy link is not an https address, when a Recommendation names an unknown trigger, when a picture path leaves the item's folder or is an absolute address, or when Spanish text is missing, and SHALL warn when a Product has no picture, a Category has no Subcategory, a price was checked more than 90 days ago, or an Amazon buy link is not on the marketplace of its language.

#### Scenario: Non-https buy link
- **WHEN** a Product's buy link starts with `http:` or `javascript:`
- **THEN** validation fails naming the file and field

#### Scenario: Recommendation target unknown
- **WHEN** a Recommendation names an id that is not a Product, Subcategory or Category
- **THEN** validation fails naming the item and the unknown id

#### Scenario: Missing picture
- **WHEN** a Product has no picture
- **THEN** validation reports a warning and passes

### Requirement: Shop fields are covered by the format guide
The system SHALL document every shop file kind, field, allowed value, Recommendation field and the Amazon import command in the format guide, and the repository tests SHALL fail when the guide and the supported fields differ.

#### Scenario: Guide drift is caught
- **WHEN** a shop field is added to the schema without updating the guide
- **THEN** the repository tests fail until the guide is updated
