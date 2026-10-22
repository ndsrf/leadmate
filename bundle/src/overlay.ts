import type { Translate } from '../../src/i18n';
import type { SimulationDebriefPayload } from '../../src/sim/payload';
import { HUD_COLOR, HUD_CSS_VARS, HUD_FONT, HUD_PRIMARY_BUTTON } from './tokens.generated';

/**
 * Minimal DOM overlays for the standalone simulation page. Inside the app shell the shell draws
 * the results screen and the Resume overlay instead, so these only run when there is no shell.
 */
const STYLE = `
  ${HUD_CSS_VARS}
  .lm-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    background: ${HUD_COLOR.ink}b3; color: ${HUD_COLOR.ink}; font-family: system-ui, sans-serif; z-index: 10; }
  .lm-card { background: ${HUD_COLOR.surface}; border: var(--lm-border) solid ${HUD_COLOR.ink}; box-shadow: var(--lm-depth) var(--lm-depth) 0 ${HUD_COLOR.ink}; border-radius: var(--lm-radius-lg); padding: 20px 24px; min-width: 260px; max-width: 90vw; }
  .lm-card h2 { margin: 0 0 12px; font-size: 20px; font-family: ${HUD_FONT.display}, system-ui, sans-serif; font-weight: 600; }
  .lm-row { display: flex; justify-content: space-between; gap: 16px; padding: 3px 0; font-size: 14px; }
  .lm-btn { margin-top: 16px; width: 100%; min-height: 44px; padding: 12px; font-size: 16px; border: var(--lm-border) solid ${HUD_PRIMARY_BUTTON.edge}; border-radius: ${HUD_PRIMARY_BUTTON.radius}px;
    background: ${HUD_PRIMARY_BUTTON.fill}; color: ${HUD_PRIMARY_BUTTON.label}; cursor: pointer;
    font-family: ${HUD_FONT.display}, system-ui, sans-serif; box-shadow: ${HUD_PRIMARY_BUTTON.depth}px ${HUD_PRIMARY_BUTTON.depth}px 0 ${HUD_PRIMARY_BUTTON.edge}; }
  .lm-btn:active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 ${HUD_PRIMARY_BUTTON.edge}; }
  .lm-btn:focus-visible { outline: 3px solid ${HUD_COLOR.focus}; outline-offset: 3px; }
`;

function root(): HTMLDivElement {
  if (!document.getElementById('lm-style')) {
    const style = document.createElement('style');
    style.id = 'lm-style';
    style.textContent = STYLE;
    document.head.appendChild(style);
  }
  const el = document.createElement('div');
  el.className = 'lm-overlay';
  document.body.appendChild(el);
  return el;
}

function card(title: string, rows: [string, string][], button: string, onClick: () => void): () => void {
  const el = root();
  const rowsHtml = rows
    .map(([k, v]) => `<div class="lm-row"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`)
    .join('');
  el.innerHTML = `<div class="lm-card"><h2>${escapeHtml(title)}</h2>${rowsHtml}<button class="lm-btn">${escapeHtml(button)}</button></div>`;
  el.querySelector('button')!.addEventListener('click', () => {
    el.remove();
    onClick();
  });
  return () => el.remove();
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export function showPause(t: Translate, onResume: () => void): () => void {
  return card(t('pause.title'), [], t('pause.resume'), onResume);
}

export function showResults(t: Translate, p: SimulationDebriefPayload, onAgain: () => void): () => void {
  const s = t('results.seconds');
  const rows: [string, string][] = [
    [t('results.duration'), `${p.durationSeconds} ${s}`],
    [t('results.slack'), `${p.slackPercentage}%`],
    [t('results.taut'), `${p.tautPercentage}%`],
    [t('results.pull'), `${p.pullPercentage}%`],
    [t('results.markerAccuracy'), p.markerAccuracyMs === undefined ? t('results.markerAccuracyNone') : `${p.markerAccuracyMs} ${t('results.ms')}`],
    [t('results.hits'), String(p.markerHits)],
    [t('results.misses'), String(p.markerMisses)],
    [t('results.reactive'), String(p.reactiveMarkers)],
    [t('results.missed'), String(p.missedOpportunities)],
    [t('results.checkIns'), String(p.checkInHits)],
    [t('results.followMarks'), String(p.followMarks)],
    [t('results.posteSuccesses'), String(p.posteSuccesses)],
    [t('results.harshStops'), String(p.harshStops)],
    [t('results.marks'), `${p.marksUsed} / ${p.markBudget}`],
    [t('results.peakArousal'), `${p.peakArousalScore} / 100`],
    [t('results.seed'), String(p.seed)],
  ];
  return card(t('results.title'), rows, t('results.playAgain'), onAgain);
}
