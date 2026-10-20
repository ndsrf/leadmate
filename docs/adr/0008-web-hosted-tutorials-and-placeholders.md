# Web-Hosted Tutorials and Media Placeholders in Theory Primers

Theory Primers maintain self-contained, offline-first summary cards in the app bundle, while supporting optional Tutorial Links that open web-hosted multimedia articles, diagrams, and video guides in an in-app browser slide-over modal. When a Tutorial Link is pending, unconfigured, or the device is offline, the app renders a stylized canine-themed placeholder and summary text rather than blocking the lesson. Terms such as Theory Primer, Dual-Aspect Primer, Handler, and Dog follow `GLOSSARY.md`.

## Considered Options

- **Bundled native video and rich media assets:** Would bloat the mobile binary by hundreds of megabytes, require platform-specific media decoders, and introduce Docker/Alpine CI build hazards.
- **Purely web-dependent lessons:** Would break offline functionality during walks and in training areas with poor reception.
- **External device browser redirect:** Disrupts the 4-step Node training loop and causes high drop-off before the Checkpoint.

## Consequences

Core lessons stay 100% functional offline with fast 30-60 second pacing. Content authors can publish and iterate on rich instructional video and image tutorials on an external website without requiring app store updates. The app requires an in-app webview container with an offline retry state.
