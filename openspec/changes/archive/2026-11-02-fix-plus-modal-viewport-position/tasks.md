# Tasks

## 1. Screen Overlay Support

- [x] 1.1 Add `overlay?: React.ReactNode` prop to `Screen` in `src/shell/screens/Screen.tsx`, rendering it at the viewport container level outside `<ScrollView>` and verifying TypeScript types compile cleanly.
- [x] 1.2 Add unit test suite in `src/shell/screens/Screen.test.tsx` verifying that `children` are inside the `ScrollView` while `overlay` renders outside the `ScrollView`.

## 2. WorldMapScreen Viewport Anchoring

- [x] 2.1 Update `WorldMapScreen.tsx` to move `TrialStatusModal` from `Screen`'s children into `<Screen overlay={...}>`.
- [x] 2.2 Add unit test in `src/shell/screens/WorldMapScreen.test.tsx` verifying that `TrialStatusModal` renders in the viewport overlay layer when open, rather than inside the scrollable content container.
- [x] 2.3 Run full test suites (`npm test -- src/shell/screens/Screen.test.tsx src/shell/screens/WorldMapScreen.test.tsx`) to verify all assertions pass without regression.
