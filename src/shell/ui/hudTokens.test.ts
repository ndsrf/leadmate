import { HUD_AROUSAL, HUD_BORDER, HUD_COLOR, HUD_COLOR_NUM, HUD_CSS_VARS, HUD_DEPTH, HUD_PRIMARY_BUTTON, HUD_TENSION } from '../../../bundle/src/tokens.generated';
import { buttonStyle } from './styles';
import { lightColor as color, theme } from './theme';

describe('Stage HUD uses the shell tokens', () => {
  it('draws the primary button with the same fill, edge, label colour, radius and depth', () => {
    const shell = buttonStyle(color, 'primary');
    expect(HUD_PRIMARY_BUTTON.fill).toBe(shell.fill);
    expect(HUD_PRIMARY_BUTTON.edge).toBe(shell.edge);
    expect(HUD_PRIMARY_BUTTON.label).toBe(shell.label);
    expect(HUD_PRIMARY_BUTTON.radius).toBe(shell.borderRadius);
    expect(HUD_PRIMARY_BUTTON.depth).toBe(shell.shadowOffset);
  });

  it('is generated from tokens.json (rerun `node scripts/gen-hud-tokens.mjs` if this fails)', () => {
    for (const [name, value] of Object.entries(HUD_COLOR)) expect(value).toBe(color[name as keyof typeof color]);
    for (const [name, value] of Object.entries(HUD_COLOR_NUM)) expect(value).toBe(parseInt(color[name as keyof typeof color].slice(1), 16));
    expect(HUD_DEPTH).toBe(theme.depth.rest.x);
    expect(HUD_BORDER).toBe(theme.border.hud);
    expect(HUD_TENSION).toEqual(theme.tension);
    expect(HUD_AROUSAL).toEqual(theme.arousal);
    expect(HUD_CSS_VARS).toContain(`--lm-brand: ${color.brand}`);
  });
});
