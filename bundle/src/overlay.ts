import type { Translate } from '../../src/i18n';
import type { SimulationDebriefPayload } from '../../src/sim/payload';

/**
 * Minimal DOM overlays for the standalone simulation page. Inside the app shell the shell draws
 * the results screen and the Resume overlay instead, so these only run when there is no shell.
 */
const STYLE = `
  .lm-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(15, 23, 42, 0.85); color: #f8fafc; font-family: system-ui, sans-serif; z-index: 10; }
  .lm-card { background: #1e293b; border-radius: 12px; padding: 20px 24px; min-width: 260px; max-width: 90vw; }
  .lm-card h2 { margin: 0 0 12px; font-size: 20px; }
  .lm-row { display: flex; justify-content: space-between; gap: 16px; padding: 3px 0; font-size: 14px; }
  .lm-btn { margin-top: 16px; width: 100%; padding: 12px; font-size: 16px; border: 0; border-radius: 8px;
    background: #22c55e; color: #052e16; cursor: pointer; }
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
    [t('results.marks'), `${p.marksUsed} / ${p.markBudget}`],
    [t('results.seed'), String(p.seed)],
  ];
  return card(t('results.title'), rows, t('results.playAgain'), onAgain);
}
