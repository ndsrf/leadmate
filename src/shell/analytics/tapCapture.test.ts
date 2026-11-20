import fs from 'fs';
import path from 'path';
import ts from 'typescript';

// the Provider is a React module; this test only reads its exported options, so stub the SDK
jest.mock('posthog-react-native', () => ({ PostHog: class {}, PostHogProvider: () => null }));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import { AUTOCAPTURE_OPTIONS } from './AnalyticsProvider';

const ROOT = path.resolve(__dirname, '../../..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Dynamic test ids that predate tap capture, used by unit tests to find one of many repeated elements (Barkdoku cells,
 * Shop cards, Settings tabs...). Each is built from a catalog id, an index or a fixed enum, never from the Dog's name or
 * user input. OPEN DECISION (task 11.5): the spec says test ids are never built from ids, so these should become fixed
 * strings; that needs ~20 sites and their unit tests reworked. Until decided, this list freezes the set: a new dynamic
 * test id fails the scan below.
 */
const PREDATING_DYNAMIC = [
  'src/shell/screens/BarkdokuView.tsx testID={`zone-tracker-item-${regId}`}',
  "src/shell/screens/BarkdokuView.tsx testID={metrics.withinTarget ? 'target-met' : 'target-missed'}",
  "src/shell/screens/BarkdokuView.tsx testID={`treat-pip-${i}-${active ? 'active' : 'inactive'}`}",
  'src/shell/screens/BarkdokuView.tsx testID={`sightline-row-${r}`}',
  'src/shell/screens/BarkdokuView.tsx testID={`cell-${r}-${c}`}',
  'src/shell/screens/BarkdokuView.tsx testID={`sightline-col-${c}`}',
  'src/shell/screens/DebriefTimeline.tsx testID={`debrief-done-well-${kind}`}',
  'src/shell/screens/NodeScreens.tsx testID={`duel-badge-${verdict}`}',
  'src/shell/screens/NodeScreens.tsx testID={`duel-option-${authoredIndex}`}',
  'src/shell/screens/NodeScreens.tsx testID={`debrief-encounter-${e.id}`}',
  'src/shell/screens/RecommendationCard.tsx testID={`${testID}-action`}',
  'src/shell/screens/SettingsScreen.tsx testID={`settings-tab-${tab.id}`}',
  'src/shell/screens/ShopScreen.tsx testID={`category-card-${cat.id}`}',
  'src/shell/screens/ShopScreen.tsx testID={`subcategory-card-${sub.id}`}',
  'src/shell/screens/ShopScreen.tsx testID={`product-card-${prod.id}`}',
  'src/shell/screens/ShopScreen.tsx testID={`product-title-${prod.id}`}',
  'src/shell/screens/ShopScreen.tsx testID={`buy-button-${prod.id}`}',
  'src/shell/screens/ShopScreen.tsx testID={`buy-button-${activeProduct.id}`}',
  'src/shell/ui/WorldSceneryBackground.tsx testID={`margin-row-${rowIndex}`}',
];

/** JSX attributes `testID` and `ph-label` whose value is not a string literal (a forwarded `testID` prop is allowed). */
function dynamicLabels(file: string): string[] {
  const text = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const isFixed = (node: ts.Node | undefined): boolean =>
    node !== undefined &&
    (ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      (ts.isJsxExpression(node) && node.expression !== undefined && isFixed(node.expression)));
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(source);
      const init = node.initializer;
      // a component forwarding its own `testID` prop: the value is checked where it is set
      const forwarded =
        name === 'testID' &&
        init !== undefined &&
        ts.isJsxExpression(init) &&
        init.expression !== undefined &&
        ts.isIdentifier(init.expression) &&
        init.expression.text === 'testID';
      if ((name === 'testID' || name === 'ph-label') && !forwarded && !isFixed(init)) {
        found.push(`${path.relative(ROOT, file).split(path.sep).join('/')} ${node.getText(source)}`);
      }
    }
    node.forEachChild(visit);
  };
  visit(source);
  return found;
}

describe('Tap capture privacy (Task 11.5)', () => {
  it('captures only test ids and fixed labels, never children or accessibility labels', () => {
    expect(AUTOCAPTURE_OPTIONS.propsToCapture).toEqual(['testID', 'ph-label']);
    expect(AUTOCAPTURE_OPTIONS.propsToCapture).not.toContain('children');
    expect(AUTOCAPTURE_OPTIONS.propsToCapture).not.toContain('accessibilityLabel');
    expect(AUTOCAPTURE_OPTIONS.captureScreens).toBe(false);
    expect(AUTOCAPTURE_OPTIONS.captureTouches).toBe(true);
  });

  it('keeps the allowance list honest: every entry still exists in the code', () => {
    const files = [...sourceFiles(path.join(ROOT, 'src/shell')), path.join(ROOT, 'App.tsx')];
    const found = files.flatMap(dynamicLabels);
    expect(PREDATING_DYNAMIC.filter((entry) => !found.includes(entry))).toEqual([]);
  });

  it('sets no testID or ph-label from a template string or a variable', () => {
    const files = [...sourceFiles(path.join(ROOT, 'src/shell')), path.join(ROOT, 'App.tsx')];
    const dynamic = files.flatMap(dynamicLabels).filter((found) => !PREDATING_DYNAMIC.includes(found));
    expect(dynamic).toEqual([]);
  });
});
