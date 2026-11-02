# Proposal

## Why

When users tap the Plus status chip at the top of the World Map screen to view their membership perks or trial status, the modal sheet (`TrialStatusModal`) is rendered as a child of the `Screen` component. Because `Screen` places its direct children inside a `ScrollView`, the modal's backdrop (`Backdrop` with `absolute inset-0 items-center justify-center`) attaches to the full scrollable trail content (thousands of pixels tall) instead of the visible viewport. This centers the modal dialog thousands of pixels down the page, forcing the user to scroll down through multiple worlds just to see the popup.

The modal must be rendered in the viewport layer so it is immediately visible and centered on the user's screen regardless of their current scroll position.

## What Changes

- Add an `overlay` prop to `Screen` that renders outside the `ScrollView`, anchored to the full viewport layer (`absolute inset-0`).
- Update `WorldMapScreen` to pass the `TrialStatusModal` into `Screen`'s `overlay` prop instead of inside the scrolling trail content.
- Ensure `TrialStatusModal` opens immediately centered in the viewport over the World Map without requiring any scrolling.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `world-map-screen`: Update the `Active trial status modal` requirement to specify that the modal sheet is anchored to the viewport layer and centered in view without scrolling, regardless of the map scroll offset.

## Impact

- Affected components:
  - `src/shell/screens/Screen.tsx`: Add `overlay?: React.ReactNode` rendered at the root viewport container outside the `ScrollView`.
  - `src/shell/screens/WorldMapScreen.tsx`: Move `{isTrialModalOpen && <TrialStatusModal ... />}` from `Screen` children to `Screen`'s `overlay` prop.
  - `src/shell/screens/WorldMapScreen.test.tsx`: Verify viewport positioning and modal presence in the updated layout.
- No breaking API changes or database/storage impact.
