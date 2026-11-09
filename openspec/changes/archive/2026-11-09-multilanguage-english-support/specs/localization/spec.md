# Spec Delta

## MODIFIED Requirements

### Requirement: Text from a catalog
The system SHALL display all user-visible text from a per-language text catalog and SHALL NOT embed text in code or images, supporting Spanish and English as first-class languages.

#### Scenario: Spanish shipped
- **WHEN** the app runs with Spanish selected
- **THEN** all text is shown in Spanish from the Spanish catalog

#### Scenario: English supported
- **WHEN** the app runs with English selected
- **THEN** all user-visible interface and content text is shown in English from the English catalog

## ADDED Requirements

### Requirement: Startup locale resolution
The system SHALL resolve the initial active language on first launch by inspecting the device's system locale, defaulting to Spanish when the locale is Spanish, and defaulting to English for all other locales.

#### Scenario: Spanish device locale
- **WHEN** the app is launched for the first time on a device configured with a Spanish locale
- **THEN** the initial active language is set to Spanish

#### Scenario: Non-Spanish device locale
- **WHEN** the app is launched for the first time on a device configured with an English or any other non-Spanish locale
- **THEN** the initial active language is set to English

### Requirement: Language persistence and device precedence
The system SHALL persist the active language on the local device, SHALL preserve the user's explicit language preference across progress resets, and SHALL NOT allow remote account synchronizations to overwrite the local device's active interface language.

#### Scenario: Language persisted locally
- **WHEN** the user selects a language in onboarding or settings
- **THEN** subsequent app cold starts use that selected language

#### Scenario: Progress reset preserves language choice
- **WHEN** the user initiates a progress reset
- **THEN** the user's previously chosen language remains active and pre-selected in the Funnel

#### Scenario: Account synchronization keeps device language
- **WHEN** cloud account sync receives a Dog record from a remote device with a different language setting
- **THEN** the local device's active interface language remains unchanged
