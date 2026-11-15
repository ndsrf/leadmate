# UI sounds

All the `.wav` files in this folder (`press`, `success`, `star`, `unlock`, `tick`, `chime`, `fanfare`, `bonk`)
were made for the app: they are synthesized by `scripts/gen-ui-sounds.mjs` (sine tones with envelopes), so they
are original to the project, need no credit and carry no third-party licence. Regenerate with
`node scripts/gen-ui-sounds.mjs`.

`tick`, `chime`, `fanfare` and `bonk` voice the in-Stage Feedback Messages (change `in-stage-feedback`).
The tick's pitch is raised at play time with the Combo (rate 2^(n/12), n up to 7); where a platform cannot
change the playback rate the tick plays at its own pitch.
