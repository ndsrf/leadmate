import type { Translate } from '../../src/i18n';
import type { CloseExerciseState } from '../../src/sim/closeExercise';
import { distance } from '../../src/sim/vec';
import fredokaUrl from '@expo-google-fonts/fredoka/600SemiBold/Fredoka_600SemiBold.ttf';
import { HD_DEFS } from './handDrillArt';
import { domPerf } from './perfCounters';

/**
 * The hand drill's close view, drawn as HTML and SVG over the Phaser canvas to match design 18 ("Close-up
 * training"): Migas on an isometric slab, only the guide's hands and sleeves in sight, thick ink outlines with a
 * hard offset shadow, segmented meters, a lesson card with step pills, a speech bubble and round signal buttons.
 * The Phaser scene still owns the simulation clock and input; this view only draws its state and reports presses.
 */
export interface HandDrillHooks {
  onGather(down: boolean): void;
  onPoste(down: boolean): void;
  onMark(): void;
  onStart(): void;
}

const INK = '#1E2A3A';
const STYLE_ID = 'hd-style';

const CSS = `
@font-face{font-family:'Fredoka';font-weight:600;src:url(${fredokaUrl}) format('truetype');font-display:block}
#hd{position:fixed;inset:0;z-index:5;overflow:hidden;background:#F3D9B8;color:${INK};font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-tap-highlight-color:transparent}
#hd *{box-sizing:border-box}
#hd .fd{font-family:'Fredoka','Arial Rounded MT Bold',system-ui,sans-serif;font-weight:600}
#hd .w1{--st-top:#FFFBF1;--st-alt:#FBE3AE;--st-l:#D9A87A;--st-r:#B5533C}
#hd .bg{position:absolute;inset:0;width:100%;height:100%}
#hd .ic{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;flex:none}
#hd .top{position:absolute;left:16px;right:16px;top:12px;display:flex;gap:8px;align-items:flex-start;pointer-events:none}
#hd .spacer{width:48px;flex:none}
#hd .hp{flex:1;background:#FFFBF1;border:2.5px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:6px 10px;display:flex;flex-direction:column;gap:4px}
#hd .hp .t{display:flex;align-items:center;gap:6px;font-size:13px;line-height:16px;font-weight:700}
#hd .segs{display:flex;gap:3px}
#hd .segs i{display:block;flex:1;height:12px;border-radius:6px;border:2px solid ${INK};background:#FFFBF1;border-style:dashed}
#hd .segs i.on{border-style:solid}
#hd .lc{position:absolute;left:16px;right:16px;top:80px;background:#FFFBF1;border:2.5px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:8px 12px 10px;display:flex;flex-direction:column;gap:8px;pointer-events:none}
#hd .lc .n{width:36px;height:36px;border-radius:99px;border:2.5px solid ${INK};display:flex;align-items:center;justify-content:center;flex:none;background:#FBE3AE}
#hd .st{display:flex;gap:6px}
#hd .stp{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:26px;border-radius:999px;border:2px solid ${INK};font-size:12px;font-weight:700;line-height:16px;background:#FFFBF1;color:${INK}}
#hd .stp.done{background:#CBEBD0}
#hd .stp.cur{background:#F2B84B}
#hd .stp.todo{border-style:dashed;border-color:#4A5578;color:#4A5578}
#hd .stp .ic{width:14px;height:14px;stroke-width:3.5}
#hd .bub{position:absolute;left:24px;top:196px;max-width:calc(100% - 32px);background:#FFFBF1;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:4px 14px;font-size:20px;line-height:24px;pointer-events:none}
#hd .bub:after{content:"";position:absolute;left:-10px;top:14px;width:14px;height:14px;background:inherit;border-left:3px solid ${INK};border-bottom:3px solid ${INK};transform:rotate(45deg)}
#hd .bub.go{background:#F9D77E}
#hd .chipw{position:absolute;left:16px;bottom:146px;pointer-events:none}
#hd .chip2{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 12px;border-radius:999px;border:2.5px solid ${INK};background:#FFFBF1;font-weight:700;font-size:13px;box-shadow:3px 3px 0 ${INK}}
#hd .rb{position:absolute;border-radius:999px;border:3px solid ${INK};display:flex;align-items:center;justify-content:center;color:${INK};padding:0;background:#FFFBF1;box-shadow:4px 4px 0 ${INK};cursor:pointer;touch-action:none;font:inherit}
#hd .rb .ic{width:32px;height:32px}
#hd .rb.hint{background:#6FAF73;box-shadow:0 0 0 4px rgba(242,184,75,.65),4px 4px 0 ${INK}}
#hd .rb.on{background:#6FAF73;transform:translate(3px,3px);box-shadow:1px 1px 0 ${INK}}
#hd .rb.mk{background:#F2B84B;box-shadow:5px 5px 0 ${INK}}
#hd .rb.mk .ic{width:40px;height:40px}
#hd .rb.mk.hint{box-shadow:0 0 0 5px rgba(242,184,75,.65),5px 5px 0 ${INK}}
#hd .rb.mk.on{transform:translate(3px,3px);box-shadow:1px 1px 0 ${INK}}
#hd .cl{position:absolute;font-size:12px;line-height:14px;font-weight:700;text-align:center;background:#FFFBF1;border:2px solid ${INK};border-radius:8px;padding:1px 6px;white-space:nowrap;transform:translateX(-50%);pointer-events:none}
#hd .ring{position:absolute;pointer-events:none;transform:rotate(-90deg)}
#hd .intro{position:absolute;inset:0;background:rgba(30,42,58,.62);display:flex;align-items:center;justify-content:center;padding:16px}
#hd .card{width:100%;max-width:360px;background:#FFFBF1;border:2.5px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:18px 16px;display:flex;flex-direction:column;gap:14px}
#hd .card h2{margin:0;font-size:24px;line-height:28px;text-align:center}
#hd .row{display:flex;gap:12px;align-items:center;font-size:16px;line-height:21px}
#hd .row b{width:34px;height:34px;border-radius:99px;border:2.5px solid ${INK};display:flex;align-items:center;justify-content:center;flex:none;font-family:'Fredoka',system-ui,sans-serif;font-size:18px}
#hd .go{margin-top:2px;min-height:52px;border-radius:16px;border:3px solid ${INK};background:#6FAF73;box-shadow:4px 4px 0 ${INK};font-size:20px;cursor:pointer;color:${INK}}
#hd .go:active{transform:translate(3px,3px);box-shadow:1px 1px 0 ${INK}}
@keyframes hd-pop{0%{transform:scale(.2);opacity:0}30%{opacity:1}100%{transform:scale(1);opacity:0}}
@keyframes hd-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
#hd .pulse{animation:hd-pulse .7s ease-in-out infinite}
#hd .pop{transform-box:fill-box;transform-origin:center;animation:hd-pop .9s ease-out forwards}
#hd.still .pulse{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){#hd .pulse,#hd .pop{animation:none}}
`;

/** Where the leash clips to the collar, in scene units, for each pose (from the symbols' collar tag). */
const COLLAR: Record<Pose, [number, number]> = { stand: [163.5, 406], sit: [193.5, 384], open: [193.5, 392.5] };
/** The Handler's fist, where the leash is held (the sleeve comes up from below the screen). */
const FIST: [number, number] = [165, 706];
/** How far the Dog is drawn pulled toward the Handler when the leash is fully gathered. */
const PULL: [number, number] = [46, 26];

type Pose = 'stand' | 'sit' | 'open';

/** 0 to 1 and back every `periodMs`, eased like the old CSS ease-in-out. */
const wave = (now: number, periodMs: number): number => (1 - Math.cos((2 * Math.PI * now) / periodMs)) / 2;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

const icon = (id: string): string => `<svg class="ic" aria-hidden="true"><use href="#hd-${id}"/></svg>`;

export class HandDrillView {
  private root: HTMLDivElement;
  private q = <T extends Element>(sel: string): T => this.root.querySelector(sel) as T;
  /** Every element `render` writes, resolved once so a frame never queries the document. */
  private el!: {
    dogUse: Element; dog: Element; dogBob: Element; lo: Element; lp: Element; tempt: Element; reach: Element; reward: Element;
    sa: HTMLElement[]; sc: HTMLElement[]; steps: HTMLElement[]; bub: Element; chip: Element; gather: HTMLElement; mark: HTMLElement; ring: Element;
    sparks: Element[];
  };
  private markedAt = -Infinity;
  private reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private cache = new WeakMap<Element, Record<string, string>>();

  constructor(
    private t: Translate,
    private reward: 'toy' | 'treat',
    hooks: HandDrillHooks,
    introOpen: boolean,
  ) {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    const root = document.createElement('div');
    root.id = 'hd';
    root.innerHTML = this.markup();
    document.body.appendChild(root);
    this.root = root;
    const all = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
    this.el = {
      dogUse: this.q('#hd-dog-use'), dog: this.q('#hd-dog'), dogBob: this.q('#hd-dogbob'), lo: this.q('#hd-lo'), lp: this.q('#hd-lp'),
      tempt: this.q('#hd-tempt'), reach: this.q('#hd-reach'), reward: this.q('#hd-reward'),
      sa: Array.from(this.q('#hd-sa').children) as HTMLElement[], sc: Array.from(this.q('#hd-sc').children) as HTMLElement[],
      steps: all('.stp'), bub: this.q('#hd-bub'), chip: this.q('#hd-chip'), gather: this.q('#hd-gather'), mark: this.q('#hd-mark'), ring: this.q('#hd-ring'),
      sparks: all('.spark'),
    };
    this.labels();
    this.bindButtons(hooks);
    const intro = this.q<HTMLElement>('.intro');
    this.setStill(introOpen);
    if (introOpen) {
      this.q<HTMLButtonElement>('.go').addEventListener('click', () => {
        intro.remove();
        hooks.onStart();
      });
    } else intro.remove();
  }

  /** Pauses every endless animation (drill paused, ended or behind the how-to card); false lets them run again. */
  setStill(still: boolean): void {
    this.root.classList.toggle('still', still);
  }

  destroy(): void {
    this.root.remove();
  }

  /** The Dog was rewarded: the reward and a burst of sparkles show for a moment. */
  celebrate(now: number): void {
    this.markedAt = now;
    for (const s of this.el.sparks) {
      s.classList.remove('pop');
      void (s as SVGElement).getBoundingClientRect();
      s.classList.add('pop');
    }
  }

  private markup(): string {
    const rewardArt = this.reward === 'toy' ? '<use href="#hd-ball" x="-18" y="-18" width="36" height="36"/>' : '<use href="#hd-treat" x="-16" y="-11" width="32" height="23"/>';
    return `${HD_DEFS}
<svg class="bg w1" viewBox="0 0 390 844" preserveAspectRatio="xMidYMin slice" role="img">
<rect width="390" height="844" fill="#F3D9B8"/>
<rect width="390" height="844" fill="url(#hd-iso)"/>
<use href="#hd-stage" x="20" y="390" width="350" height="210"/>
<ellipse cx="80" cy="464" rx="20" ry="5" fill="${INK}" opacity=".16"/>
<g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
<ellipse cx="72" cy="418" rx="8" ry="18" fill="#6FAF73" transform="rotate(-28 72 418)"/>
<ellipse cx="89" cy="416" rx="8" ry="18" fill="#4C9A63" transform="rotate(28 89 416)"/>
<ellipse cx="80" cy="410" rx="8" ry="20" fill="#6FAF73"/>
<polygon points="65,436 95,436 90,462 70,462" fill="#E8795C"/>
</g>
<g id="hd-dog"><g id="hd-dogbob"><use id="hd-dog-use" href="#hd-dog-sit" x="61" y="250" width="300" height="275"/></g></g>
<g id="hd-leash"><path id="hd-lo" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path id="hd-lp" fill="none" stroke="#6FAF73" stroke-width="5" stroke-linecap="round"/></g>
<g id="hd-handler">
<path d="M126 900C138 810 158 760 165 716" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round"/>
<path d="M126 900C138 810 158 760 165 716" fill="none" stroke="#4F46E5" stroke-width="26" stroke-linecap="round"/>
<ellipse cx="${FIST[0]}" cy="${FIST[1]}" rx="19" ry="16" fill="#F3D9B8" stroke="${INK}" stroke-width="3"/>
</g>
<path id="hd-reach" d="M132 318C146 300 168 298 184 312" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 10"/>
<g id="hd-tempt-wrap"><g id="hd-tempt">
<path d="M-30 560C0 520 44 430 88 356" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round"/>
<path d="M-30 560C0 520 44 430 88 356" fill="none" stroke="#E8795C" stroke-width="26" stroke-linecap="round"/>
<use href="#hd-hand" x="66" y="326" width="80" height="48"/>
</g></g>
<g id="hd-reward" opacity="0"><g transform="translate(150 372)">${rewardArt}</g></g>
<use class="spark" href="#hd-sparkle" x="226" y="300" width="30" height="30" opacity="0"/>
<use class="spark" href="#hd-sparkle" x="104" y="286" width="20" height="20" opacity="0"/>
<use class="spark" href="#hd-sparkle" x="238" y="350" width="16" height="16" opacity="0"/>
</svg>

<div class="top"><div class="spacer"></div>
<div class="hp"><div class="t">${icon('i-ears')}<span data-t="close.meter.arousal"></span></div><div class="segs" id="hd-sa"><i></i><i></i><i></i></div></div>
<div class="hp"><div class="t">${icon('i-paw')}<span data-t="close.meter.calm"></span></div><div class="segs" id="hd-sc"><i></i><i></i><i></i></div></div>
</div>

<div class="lc">
<div style="display:flex;align-items:center;gap:10px">
<span class="n">${icon('i-paw')}</span>
<div style="line-height:20px;flex:1"><div class="fd" style="font-size:19px" data-t="close.intro.title"></div><div style="font-size:12px;color:#4A5578" data-t="close.sub"></div></div>
</div>
<div class="st" id="hd-steps"><span class="stp" data-step="1"></span><span class="stp" data-step="2"></span><span class="stp" data-step="3"></span></div>
</div>

<div class="bub fd" id="hd-bub"></div>
<div class="chipw"><span class="chip2"><svg viewBox="0 0 28 20" width="22" height="16" aria-hidden="true"><use href="#hd-treat"/></svg><span id="hd-chip"></span></span></div>

<button type="button" class="rb" id="hd-gather" style="right:16px;bottom:44px;width:84px;height:84px">${icon('i-down')}</button>
<span class="cl" style="left:58px;bottom:24px" data-t="hud.gather"></span>
<button type="button" class="rb" id="hd-poste" style="right:26px;bottom:154px;width:64px;height:64px">${icon('i-sit')}</button>
<span class="cl" style="right:58px;bottom:134px;transform:translateX(50%)" data-t="hud.poste"></span>
<svg class="ring" viewBox="0 0 100 100" width="104" height="104" style="right:6px;bottom:34px" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="${INK}" stroke-opacity=".25" stroke-width="4"/><circle id="hd-ring" cx="50" cy="50" r="46" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
<button type="button" class="rb mk" id="hd-mark" style="left:16px;bottom:44px;width:84px;height:84px">${icon('i-marker')}</button>
<span class="cl" style="left:58px;bottom:24px" data-t="hud.marker"></span>

<div class="intro"><div class="card">
<h2 class="fd" data-t="close.intro.title"></h2>
<div class="row"><b style="background:#F2B84B">1</b><span data-t="close.intro.1"></span></div>
<div class="row"><b style="background:#7FD0C8">2</b><span data-t="close.intro.2"></span></div>
<div class="row"><b style="background:#6FAF73">3</b><span data-t="close.intro.3"></span></div>
<button type="button" class="go fd" data-t="close.intro.go"></button>
</div></div>`;
  }

  private labels(): void {
    for (const el of Array.from(this.root.querySelectorAll<HTMLElement>('[data-t]'))) {
      const key = el.dataset.t as Parameters<Translate>[0];
      el.textContent = this.t(key);
    }
    this.q<HTMLElement>('#hd-gather').setAttribute('aria-label', this.t('hud.gather'));
    this.q<HTMLElement>('#hd-poste').setAttribute('aria-label', this.t('hud.poste'));
    this.q<HTMLElement>('#hd-mark').setAttribute('aria-label', this.t('hud.marker'));
    this.q<HTMLElement>('svg.bg').setAttribute('aria-label', this.t('close.intro.title'));
  }

  private bindButtons(hooks: HandDrillHooks): void {
    const hold = (el: HTMLElement, set: (down: boolean) => void) => {
      let down = false;
      const rel = () => {
        if (!down) return;
        down = false;
        el.classList.remove('on');
        set(false);
      };
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        el.setPointerCapture?.(e.pointerId);
        down = true;
        el.classList.add('on');
        set(true);
      });
      el.addEventListener('pointerup', rel);
      el.addEventListener('pointercancel', rel);
      el.addEventListener('lostpointercapture', rel);
    };
    hold(this.q('#hd-gather'), hooks.onGather);
    hold(this.q('#hd-poste'), hooks.onPoste);
    const mark = this.q<HTMLElement>('#hd-mark');
    mark.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      mark.classList.add('on');
      hooks.onMark();
    });
    const up = () => mark.classList.remove('on');
    mark.addEventListener('pointerup', up);
    mark.addEventListener('pointercancel', up);
    mark.addEventListener('pointerleave', up);
  }

  /** Sets an attribute or text only when it changed, so a 30 Hz redraw does not churn the DOM. */
  private set(el: Element, name: string, value: string): void {
    let seen = this.cache.get(el);
    if (!seen) this.cache.set(el, (seen = {}));
    const key = `attr-${name}`; // apart from toggle's `cls-` keys; never mix set(el,'class') and toggle on one element
    if (seen[key] === value) return;
    seen[key] = value;
    if (name === 'text') el.textContent = value;
    else if (name === 'html') el.innerHTML = value;
    else if (name === 'bg') (el as HTMLElement).style.background = value;
    else el.setAttribute(name, value);
  }

  private fillSegs(segs: HTMLElement[], n: number, color: string): void {
    segs.forEach((seg, i) => {
      const on = i < n;
      this.set(seg, 'class', on ? 'on' : '');
      this.set(seg, 'bg', on ? color : '');
    });
  }

  /** Toggles a class only when its state changed (the cache key is the class name). */
  private toggle(el: Element, cls: string, on: boolean): void {
    let seen = this.cache.get(el);
    if (!seen) this.cache.set(el, (seen = {}));
    const key = `cls-${cls}`;
    const value = on ? '1' : '0';
    if (seen[key] === value) return;
    seen[key] = value;
    el.classList.toggle(cls, on);
  }

  /** Draws the simulation's current state. `now` is the wall clock in ms, for the wobble of the Dog and the reward. */
  render(s: CloseExerciseState, now: number): void {
    domPerf.renders++;
    const cfg = s.config;
    const open = s.rewardWindow !== null;
    const justMarked = now - this.markedAt < 1000;
    const tempting = !s.isGathering && !open && !justMarked;
    const excited = s.tier !== 'calm' && !s.isGathering;

    // the Dog: sits when calm, stands and bounces toward the hand when worked up, mouth open at the reward
    const pose: Pose = justMarked ? 'open' : s.tier === 'calm' ? 'sit' : 'stand';
    this.set(this.el.dogUse, 'href', `#hd-dog-${pose === 'open' ? 'sit-open' : pose}`);
    const rest = Math.hypot(cfg.dogOffset.x, cfg.dogOffset.y);
    const pulled = clamp((rest - distance(s.handler, s.dog)) / Math.max(0.01, rest - cfg.leashMinLength), -0.7, 1);
    let dx = pulled * PULL[0];
    let dy = pulled * PULL[1];
    if (excited && !this.reduceMotion) {
      const hop = Math.abs(Math.sin(now / 110)) * (6 + Math.min(14, s.arousal / 4));
      dy -= hop;
      if (s.tier === 'reactive') dx -= 8 + 4 * Math.sin(now / 70);
    }
    this.set(this.el.dog, 'transform', `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`);
    // idle bob while sitting, drawn at the capped rate with the rest of the view (no display-rate SVG animation)
    const bob = pose === 'sit' && !this.reduceMotion ? -3 * wave(now, 2400) : 0;
    this.set(this.el.dogBob, 'transform', `translate(0 ${bob.toFixed(1)})`);

    // the leash: from the collar down to the Handler's fist; it straightens as it tightens
    const [cx, cy] = COLLAR[pose];
    const x0 = cx + dx;
    const y0 = cy + dy;
    const sag = s.tension === 'slack' ? 70 : s.tension === 'taut' ? 24 : 0;
    const d = `M${x0.toFixed(1)} ${y0.toFixed(1)}Q${((x0 + FIST[0]) / 2 + 36).toFixed(1)} ${((y0 + FIST[1]) / 2 + sag).toFixed(1)} ${FIST[0]} ${FIST[1]}`;
    this.set(this.el.lo, 'd', d);
    this.set(this.el.lp, 'd', d);
    this.set(this.el.lp, 'stroke', s.tension === 'rigid' ? '#E8795C' : s.tension === 'taut' ? '#F2B84B' : '#6FAF73');

    // the tempting hand wobbles while it is in reach and keeps still once the Dog is out of reach
    const nudge = tempting && !this.reduceMotion ? wave(now, 1600) : 0;
    this.set(this.el.tempt, 'transform', `translate(${(5 * nudge).toFixed(1)} ${(-5 * nudge).toFixed(1)})`);
    this.set(this.el.reach, 'opacity', tempting ? '1' : '0');

    // reward
    this.set(this.el.reward, 'opacity', justMarked ? '1' : '0');

    // meters: emotion toward the reactive threshold, calm toward the reward
    const frac = clamp(s.arousal / Math.max(1, s.dogTraits.reactivityThreshold), 0, 1);
    this.fillSegs(this.el.sa, s.arousal < 1 ? 0 : Math.max(1, Math.ceil(frac * 3 - 0.001)), s.tier === 'reactive' ? '#F29A86' : '#B9A2FF');
    const calmFrac = open ? 1 : clamp(s.calmElapsed / cfg.calmSeconds, 0, 1);
    this.fillSegs(this.el.sc, Math.ceil(calmFrac * 3 - 0.001), open ? '#F2B84B' : '#7FD0C8');

    // lesson card: Recoger, Calmar, Marcar
    const step = open || justMarked ? 3 : s.tier === 'calm' && s.calmElapsed > 0 ? 2 : 1;
    for (const el of this.el.steps) {
      const n = Number(el.dataset.step);
      const state = n < step ? 'done' : n === step ? 'cur' : 'todo';
      this.set(el, 'class', `stp ${state}`);
      const label = `${n < step ? '' : `${n} · `}${this.t(`close.step.${n}` as 'close.step.1')}`;
      const html = (n < step ? icon('i-check') : '') + label;
      this.set(el, 'html', html);
    }

    // the one instruction that applies right now
    const key = justMarked
      ? 'close.hint.good'
      : open
      ? 'close.hint.now'
      : excited
      ? 'close.hint.pull'
      : s.isGathering
      ? 'close.hint.wait'
      : s.time < cfg.settleSeconds
      ? 'close.hint.watch'
      : 'close.hint.hold';
    this.set(this.el.bub, 'text', this.t(key as 'close.hint.now'));
    this.set(this.el.bub, 'class', `bub fd${open || justMarked ? ' go' : ''}`);
    this.set(this.el.chip, 'text', this.t('close.chip.rewards').replace('{n}', String(Math.max(0, cfg.markBudget - s.telemetry.marksUsed))));

    // the controls to use now: Recoger when the Dog wants the hand, Marcar while the reward window is open
    this.toggle(this.el.gather, 'hint', excited);
    this.toggle(this.el.gather, 'pulse', excited && !this.reduceMotion);
    this.toggle(this.el.mark, 'hint', open);
    this.toggle(this.el.mark, 'pulse', open && !this.reduceMotion);
    const total = open ? Math.max(0.01, s.rewardWindow!.closesAt - s.rewardWindow!.openedAt) : 1;
    const left = open ? clamp((s.rewardWindow!.closesAt - s.time) / total, 0, 1) : 0;
    this.set(this.el.ring, 'stroke-dashoffset', open ? String((100 * (1 - left)).toFixed(1)) : '100');
  }
}
