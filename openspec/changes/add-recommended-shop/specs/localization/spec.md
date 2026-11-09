# Spec Delta

## MODIFIED Requirements

### Requirement: Text from a catalog
The system SHALL display all user-visible text from a per-language text catalog and SHALL NOT embed text in code or images, supporting Spanish and English as first-class languages, including all Shop interface strings (catalogue headers, empty states, disclosure notes, health notes, buy actions, and offer popups).

#### Scenario: Spanish shipped
- **WHEN** the app runs with Spanish selected
- **THEN** all text is shown in Spanish from the Spanish catalog

#### Scenario: English supported
- **WHEN** the app runs with English selected
- **THEN** all user-visible interface and content text is shown in English from the English catalog

#### Scenario: Shop strings in English
- **WHEN** the user opens the Shop with English selected
- **THEN** all shop interface labels, disclosure notes, and health warnings appear in English from the English text catalog
