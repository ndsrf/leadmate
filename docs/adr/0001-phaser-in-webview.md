# Run the simulation as a Phaser 3 bundle in a WebView

The simulation, HUD and input run in one Phaser 3 bundle that loads directly in a desktop browser and inside a WebView in the Expo shell, so debugging in Chrome runs the same code as on Android and iPhone, and timing-critical input has no bridge latency. The shell only sends configuration in and receives the debrief payload out. Terms such as Stage, Handler, Dog and Marker follow `GLOSSARY.md`; the Handler's input and the Marker press stay inside the bundle.

## Considered Options

- **PixiJS:** lighter, but more scene plumbing to write, and native use relies on the fragile Expo GL path.
- **React Native Skia:** one runtime, but web uses a different CanvasKit build than native (weaker parity) and there are fewer examples for AI-assisted development.
- **Godot or Unity:** poor fit with the Expo shell and slow browser iteration.

## Consequences

Two runtimes joined by a message bridge. Anything outside the bundle (audio, storage, accounts) must cross that bridge.
