# Design

## Context

Tokens live in `src/shell/ui/tokens.json` and feed three consumers: `tailwind.config.js` (NativeWind classes such as `bg-bg`, `text-ink`, `rounded-game-lg`, `font-display`), `theme.ts` (typed values and a contrast helper) and the Stage HUD (`hudTokens`, bundled into the simulation WebView). A `noRawColors` test forbids literal colours outside the tokens, so a retheme is mostly a token swap plus component changes. Today's identity is dark (`bg #0f172a`, brand `#22c55e`) with flat raised buttons (`depth.edge`) and Lilita One. The design's `tokens.json` (board 17) is semantic and already NativeWind-oriented.

## Goals / Non-Goals

**Goals:**
- Land the Paper Meadow tokens as the single source, with the same consumers and the same names where meanings match (`bg`, `surface`, `ink`, `inkMuted`, `brand`, `accent`, `star`, `locked`, `danger`), adding the new ones.
- Rebuild components so a screen swaps look without per-screen styling.
- Keep contrast ≥ 4.5:1 for every text/background pair and ≥ 44 pt targets, proven by tests.

**Non-Goals:**
- No behavior change, no new screens (Diary, breed picker are excluded), no tab bar.
- No redraw of the simulation art beyond HUD tokens; world scenery colours keep their current sources unless a per-World palette is trivially mapped.
- No night mode switching: the night token set is defined and unit-tested only; `userInterfaceStyle` stays `light`, and screens are not checked in night. Switching is a later change.

## Decisions

**1. Tokens first, in one commit.** Replace `tokens.json` with the design's export, keep a thin compatibility layer (old key → new key) only if needed to keep the build green, then migrate screens and remove it before the end. `app.json` `userInterfaceStyle` moves from `dark` to `light`.

**2. Offset-shadow depth in React Native.** Per the design notes: a sibling absolutely-positioned `View` of the same radius, offset by `depth.rest` (4/4), under the face; press translates the face by 3 pt and shrinks the shadow to 1 pt, 80 ms with the `press` easing. Implemented once in `components.tsx` (`Button`, `Panel`, `Chip`) so no screen re-implements it. Native shadows are not used (they cannot be hard-edged and ink-coloured on both platforms).

**3. Fonts.** Swap `@expo-google-fonts/lilita-one` for `@expo-google-fonts/fredoka` (600). The `useFonts` call and the splash gate from `app-shell-navigation` just change family name.

**4. Per-World palettes.** `world.w1..w4` tokens drive map regions and Node accents via `mapLayout.ts`; arousal and tension colours feed the HUD through `hudTokens` (bundle rebuild required; the bundle never reads storage, only the passed tokens).

**5. Order of work.** Tokens → components → splash/funnel → map → node loop → daily/settings/account → celebrations/overlays → HUD → icon/splash assets. Each step keeps the app runnable; screenshots compared against the board.

**6. Copy and chips.** Spanish copy stays as it is today except the splash tagline ("Preparando el paseo…"); other differences in the board's wording are listed in the PR for the user to choose. The Streak chip is restyled but keeps today's behavior (no Diary navigation).

**7. Icon and splash assets.** Extracted from the board's inline SVG and rendered to PNG by a script in `scripts/` so they are reproducible.

**8. Design fidelity rule.** Where the board shows a feature that does not exist yet (Diary calendar, breed picker, Plus copy), do not build it here; build the surrounding styling only. Anything in the board that contradicts a spec is raised as a question rather than silently implemented.

## Risks / Trade-offs

- **Contrast regressions** from light backgrounds with existing coloured elements (hints over the Stage, leash colours): covered by updating `theme.test.ts` pairs and adding a test over every text/background token pair.
- **HUD over the dark scene**: the HUD uses the light paper panels from boards 08/13; only an element that fails 4.5:1 over the scene falls back to `colorNight`, decided per element.
- **Bundle rebuild and cache**: HUD token changes require rebuilding `bundle/`; mismatch would show old colours in the Stage. Add the rebuild to the verification task.
- **Large diff**: touches nearly every screen. Mitigated by the token-first, component-first order and by no behavior change.
- **Font weight on Android**: Fredoka loads as a single family file per weight; verify no faux-bold.
- **Scope drift**: the board's extra content (breeds, Diary) is tempting; excluded in the proposal and tracked as follow-up changes.
