## ADDED Requirements

### Requirement: Breed catalog
The system SHALL offer a fixed catalog of Dog breeds: Labrador, Golden retriever, Pastor alemán, Border collie, Bulldog francés, Chihuahua, Yorkshire terrier, Caniche, Teckel, Beagle, Cocker spaniel, Husky siberiano, Bóxer, Jack Russell, Podenco / galgo and Mestizo, plus "Otra raza".

#### Scenario: Catalog complete
- **WHEN** the breed picker is opened
- **THEN** all 16 breeds and "Otra raza" can be reached, each shown with its silhouette and its name

### Requirement: Breed attributes
Each breed SHALL have a size band (mini, small, medium, large), a typical adult weight range in kilograms, a default coat and a drawn silhouette. "Otra raza" SHALL use the Mestizo silhouette and have no weight range.

#### Scenario: Other breed is never a dead end
- **WHEN** the user chooses "Otra raza"
- **THEN** the Dog is drawn with the Mestizo silhouette scaled by its weight and the user can continue

### Requirement: Breed stored on the Dog
The system SHALL store the chosen breed in the Dog's local record, SHALL default it to Mestizo for a record that has none, and SHALL NOT use it to change the simulation's behaviour. Breed is cosmetic and a weight hint only.

#### Scenario: Breed persists
- **WHEN** the user picks a breed and restarts the app
- **THEN** the Dog record still holds that breed

#### Scenario: Record from before breeds
- **WHEN** a Dog record without a breed is loaded
- **THEN** its breed is Mestizo and nothing else in the record changes

#### Scenario: Stage unchanged by breed
- **WHEN** two Dogs differ only in breed and play the same seeded Stage
- **THEN** the Stage payloads are identical

### Requirement: Breed pre-fills weight and coat
The system SHALL, when the user picks a breed, pre-fill the Dog weight with the midpoint of that breed's typical range and the coat with the breed's default coat, SHALL show the breed's range as a hint next to the weight control, and SHALL leave both editable. Picking a different breed SHALL NOT overwrite a weight or coat the user has already changed by hand.

#### Scenario: Pre-fill
- **WHEN** the user picks Labrador for the first time
- **THEN** the Dog weight is pre-filled with the midpoint of 25 to 36 kg and the hint reads that range

#### Scenario: Manual weight kept
- **WHEN** the user edited the weight and then picks another breed
- **THEN** the edited weight is kept and only the range hint changes

### Requirement: Breed visible in the shell
The system SHALL draw the Dog in its breed silhouette and coat in the funnel's Dog preview, the Diagnostic scene and the diagnostic card, and SHALL show breed as text wherever the card names the Dog.

#### Scenario: Preview follows the choices
- **WHEN** the user picks Border collie and the chocolate coat
- **THEN** the preview shows a Border collie silhouette in chocolate

#### Scenario: Not colour only
- **WHEN** a coat swatch is shown
- **THEN** its name is visible as text and the selected swatch carries a check mark
