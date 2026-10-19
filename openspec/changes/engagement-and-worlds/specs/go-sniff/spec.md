# Spec Delta

## Purpose

Provides a functional reward that lets the user relieve the dog's stress after a tense segment.

## ADDED Requirements

### Requirement: Go Sniff reward
From World 2 onward, the system SHALL offer a contextual Go Sniff button after the user successfully navigates a tense segment, and activating it SHALL rapidly drain the dog's stress bar.

#### Scenario: Sniff relieves stress
- **WHEN** the user presses Go Sniff after a successful tense segment
- **THEN** the dog's stress bar drains rapidly

#### Scenario: Not available early
- **WHEN** the user is in World 1
- **THEN** the Go Sniff button is not shown
