# Spec Delta

## MODIFIED Requirements

### Requirement: Mission content is plain catalog data
Every Mission SHALL be data: target text, repetition count, success sign, the Stops it trains, a fixed list of problems each with a Fix, and a general Fix. A Fix holds Lesson-style blocks, an easier-target text and the Stop to practise again. All text SHALL come from the localization catalog. No Mission brief or Fix page SHALL show a placeholder badge.

#### Scenario: Placeholder Mission
- **WHEN** a Mission brief or a Fix page is shown, including content that is not final yet
- **THEN** it carries no placeholder or provisional badge, and a Fix image that cannot be drawn shows the themed placeholder

#### Scenario: Missing translation
- **WHEN** a Mission string has no entry in the selected language
- **THEN** the Spanish text is shown
