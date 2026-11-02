# Design

## Context

`Screen` (`src/shell/screens/Screen.tsx`) is the standard layout container across the app. It provides fixed `header` and `footer` slots outside a scrollable content area (`ScrollView`) that renders `children` wrapped in a readable width container.

`WorldMapScreen` renders the trail of worlds and stops inside `Screen`'s `children`. In `WorldMapScreen.tsx`, `{isTrialModalOpen && <TrialStatusModal ... />}` was placed as a child of `Screen`, putting it directly inside the `ScrollView`.

`TrialStatusModal` wraps its content in `Backdrop` (`src/shell/Overlays.tsx`), which uses `className="absolute inset-0 items-center justify-center bg-outline/70 p-4"`. In React Native Web and native layout, `absolute inset-0` on a child inside a `ScrollView`'s content container attaches to the total scrollable content height (which spans thousands of pixels across all worlds). As a result, `justify-center` positions the modal sheet halfway down the full map (e.g., around 2,500px–5,000px down), making it invisible in the active viewport until the user scrolls down.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Anchor `TrialStatusModal` to the viewport so it is immediately visible and centered on screen when triggered from the header Plus chip, regardless of the map's scroll offset.
- Provide a clean, declarative `overlay?: React.ReactNode` slot on `Screen` to host dialogs and overlays above the header, footer, and scroll content.
- Maintain existing tests, styling, animations, and back-button behaviors.

**Non-Goals:**
- Introducing external modal dependencies or changing `TrialStatusModal` internal markup.
- Refactoring how other screens handle full-screen overlays (such as `SettingsScreen` or `PaywallScreen`).

## Decisions

### Decision 1: Add `overlay?: React.ReactNode` to `Screen`

In `src/shell/screens/Screen.tsx`, introduce an optional `overlay` prop rendered at the root viewport container (`<View className="absolute inset-0 bg-bg">`), after `<Animated.View style={{ flex: 1 }}>`:

```tsx
export function Screen({
  children,
  header,
  footer,
  overlay,
  scrollRef,
  onScroll,
}: ScreenProps) {
  ...
  return (
    <View className="absolute inset-0 bg-bg">
      <Animated.View entering={entering} style={{ flex: 1 }}>
        {header && ...}
        <ScrollView ...>
          <View style={{ width: '100%', maxWidth: theme.size.readableWidth }}>{children}</View>
        </ScrollView>
        {footer && ...}
      </Animated.View>
      {overlay}
    </View>
  );
}
```

*Rationale:*
- The outer `View` is pinned to the viewport bounds via `absolute inset-0`.
- Placing `overlay` outside `<ScrollView>` ensures any overlay utilizing `Backdrop` (`absolute inset-0`) spans the exact device viewport, not the scrollable content.
- Placing `overlay` after `<Animated.View>` ensures it sits above header, footer, and map content with proper z-ordering and no interference from screen entrance transitions.

*Alternatives Considered:*
- *Use React Native's `<Modal>` component in `TrialStatusModal`:* Rejected because `<Modal>` mounts a separate React Native hierarchy where NativeWind CSS variable propagation requires additional configuration (as noted in `components.tsx:81`), and Jest mocks in existing screen tests (`WorldMapScreen.test.tsx`) do not mock `<Modal>`.
- *Wrap `WorldMapScreen` in a separate outer container:* Rejected because `Screen` is already the screen root; adding `overlay` to `Screen` provides a canonical, reusable seam for any screen needing viewport overlays.

### Decision 2: Pass `TrialStatusModal` via `Screen.overlay` in `WorldMapScreen`

In `src/shell/screens/WorldMapScreen.tsx`:
Move `{isTrialModalOpen && <TrialStatusModal ... />}` from `Screen`'s children to `<Screen overlay={isTrialModalOpen && <TrialStatusModal ... />}>`.

*Rationale:*
- Directly resolves the layout bug with minimal changes.
- Preserves all props, callbacks (`onDismiss`), and internal/external state controls (`isTrialModalOpen`).

## Risks / Trade-offs

- **[Risk] Touch event interception over header/footer** → *Mitigation:* `Backdrop` uses `absolute inset-0 bg-outline/70 p-4`, which intentionally captures touches and dims the background while the modal is open. When closed (`isTrialModalOpen === false`), `overlay` evaluates to `false`/`null` and renders nothing, causing zero interception.
- **[Risk] Hardware back press behavior** → *Mitigation:* `App.tsx` already connects `onCloseTrialModal={withBack(() => setTrialModalOpen(false))}`, so pressing the Android back button or dismissing via the button closes the modal.
