# Tasks

## 1. Tokens

- [x] 1.1 Replace `src/shell/ui/tokens.json` with the Paper Meadow export (light colours, `colorNight`, tension, arousal, world palettes, coat colours, radius, space, border, depth, type, motion, size); keep a temporary key map only if needed to stay green
- [x] 1.2 Update `tailwind.config.js` and `theme.ts` for the new keys (colours, radii, border widths, spacing, font sizes, `font-display` = Fredoka)
- [x] 1.3 Update `theme.test.ts`, `hudTokens.test.ts`, `noRawColors.test.ts`, `ui.test.ts`: new values, a contrast test over every text/background pair (≥ 4.5:1, ≥ 3:1 for large text), night set included as tokens only (no screen checks)
- [x] 1.4 Swap the display font package to `@expo-google-fonts/fredoka` and update the `useFonts` call and font names

## 2. Components

- [x] 2.1 Rebuild the offset-shadow primitive in `components.tsx`/`styles.ts` (face + shadow sibling, press travel 3 pt, 80 ms, focus ring) with reduced-motion fallback
- [x] 2.2 Restyle `Button` (primary, secondary, quiet link, danger, disabled), `Panel`, `Choice`, chips, pills, stars, progress bars, toggles, segmented controls and text inputs
- [x] 2.3 Restyle node markers (completed, next-up with dashed ring, locked with lock icon) and the Lead-line divider
- [x] 2.4 Tests for button states (pressed, disabled, focus) and for 44 pt targets on small controls

## 3. Screens

- [x] 3.1 Splash screen: sky wash, paper hills, road, Migas, Lead underline, tagline, static line under reduced motion
- [x] 3.2 Onboarding funnel screens (setup, Diagnostic, Plan, paywall, first-stage hints) per board 10, without adding the breed step
- [x] 3.3 World Map per board 11: world regions from `world.*` palettes, header, Streak / Daily / Settings chips, Dog marker, Rusty prompt and account banner placement
- [x] 3.4 Node loop (Primer, Checkpoint, Debrief) per board 12
- [x] 3.5 Daily result and Settings per board 14 (no Diary screen; the Streak chip keeps today's behavior), including the Reset section from `app-shell-navigation` in danger style
- [x] 3.6 Account screens, banners, choose-Dog screen per board 09
- [x] 3.7 Celebrations (board 15) and overlays (Resume, Error, Loading, Hint)
- [x] 3.8 Minigame screens' chrome and Stage HUD per boards 08 and 13; rebuild `bundle/` for the HUD tokens

## 4. Assets

- [x] 4.1 Add a script in `scripts/` that extracts the icon and splash SVG from the design and renders the PNGs (180 iOS, Android adaptive foreground/background/monochrome, favicon, splash) into `assets/`; set splash background in `app.json`
- [x] 4.2 Check the Android round mask keeps ear and tag inside the central 66 percent

## 5. Verification

- [x] 5.1 Run `npm test` and type-check; grep that no screen uses colours outside the tokens
- [ ] 5.2 Walk every screen at 320 pt and at desktop width; check long Spanish strings, reduced motion, large text
- [ ] 5.3 Compare each restyled screen against its board; list intentional differences, including Spanish copy that differs from the board, in the PR
- [x] 5.4 `openspec validate paper-meadow-ui-revamp`
