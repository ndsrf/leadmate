# Design

## Context

`WorldBlock` in `WorldMapScreen.tsx` renders every World with `entry.preview && entry.stops.length === 0` as a fixed teaser: badge "Próximamente", title `map.plusTeaserTitle`, body `map.plusTeaserBody` and a paywall button. It never reads membership. The screen already computes `plus` from `membership` and its own clock (`isPlus(membership, at)`), so the value is available and updates when the trial ends. See proposal.md - Why.

Worlds 6–9 are `recall`, `cafe`, `trails`, `crowds` in `content/stable/worlds/*.yaml` (`preview: true`, `nodeCount`). Titles and topics are i18n keys (`world.<id>.title`, `world.<id>.topics`).

## Goals / Non-Goals

**Goals:**
- A Plus user never sees "buy Plus" on a Coming-soon World.
- Each Coming-soon World says concretely what it will teach.
- A visible end of the map that says more is coming.

**Non-Goals:**
- Changing the trial length. `TRIAL_DAYS` is a separate change. Recommendation: do it separately, since it touches the plus-membership spec, paywall copy and the store-side trial offer.
- Notify-me, waitlist or any server call.
- Per-World unlock logic for when content ships (clearing `preview` in the pack already does this).

## Decisions

1. **Pass `plus` into `WorldBlock`** as a prop, not read membership inside the block. The block stays presentational, and the single `isPlus` evaluation keeps the "one membership at the same moment" rule.
2. **Blurbs in the i18n catalog**, key `world.<id>.preview` (one or two sentences), next to `world.<id>.topics`. Alternative: a field in the world YAML. Rejected: it needs a pack schema change, beta/stable sync and per-locale handling for text that is already catalogued by World id.
3. **Two sub-components**, `PreviewTeaser` (free) and `ComingSoonCard` (Plus), chosen by `plus`. Free path keeps existing keys, so its behaviour is unchanged.
4. **End card as a separate component** rendered after the Worlds map, not a fake World. This keeps it out of `mapModel`, progress, scroll offsets and `allComplete`. The scenario list is a short fixed array of i18n keys (`map.more.item1..N`). Suggested scenarios: bikes and scooters, visitors at the door, vet visits, car travel, other dogs at close range, cooperative care. The list is copy and can be edited freely.
5. **Plus users get no paywall button** on either card. A subscriber has nothing to buy, and a trial user can reach the trial modal from the existing Plus chip.

6. **Shipping is silent.** When a Coming-soon World's `preview` flag is cleared in the pack it simply becomes playable with the normal unlock behaviour. No "new" badge or announcement; that is a separate change.
7. **Same card for every Plus user.** Trial and subscribed users see the identical "Próximamente" card, with no trial-specific wording. The trial chip and modal already show the days left.
8. **Both pitches stay for free users.** The per-World teaser and the More-coming card both carry the Plus pitch.

## Risks / Trade-offs

- A "Próximamente" promise to paying users sets an expectation. Mitigation: wording avoids dates, says "estamos preparando".
- Copy for four Worlds plus a list is new Spanish text; it needs product review before apply is considered done.
- End card shows to users who have not reached it. It sits at the bottom of a long scroll, so impact is low.
