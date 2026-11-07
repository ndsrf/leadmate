// Exports current compiled TypeScript content (Worlds, Lessons, Nodes, Missions,
// Spanish catalog text, illustrations) into the Content Pack layout under content/beta/.
// Usage: node scripts/content-export.mjs [outDir]

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import createJITI from 'jiti';
import { stringify } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const outDir = process.argv[2] ? resolve(ROOT, process.argv[2]) : join(ROOT, 'content/beta');

const jiti = createJITI(ROOT);
const { WORLDS } = jiti('./src/shell/world.ts');
const { LESSONS } = jiti('./src/shell/lessons/content.ts');
const { lessonArtNames } = jiti('./src/shell/lessons/lesson.ts');
const { ALL_NODES } = jiti('./src/shell/nodes/content.ts');
const { MISSIONS } = jiti('./src/shell/missions/content.ts');
const { es } = jiti('./src/i18n/es.ts');
const { loadPackFromDisk } = jiti('./src/shell/content/loader.ts');
const { validatePack } = jiti('./src/shell/content/validator.ts');

const LESSON_MEDIA = {
  'calm-leash': { animation: 'calm-leash', youtube: { es: '8Ba10_ycocY' } },
  'body-language': { animation: 'body-language', youtube: { es: '76DSS5xNwtk' } },
  'smile-leash': { animation: 'smile-leash', youtube: { es: 'VgnWd0Yu_Rk' } },
  'marking-rewarding': { animation: 'marking-rewarding' },
  'sniffing-decompression': { animation: 'sniffing-decompression' },
};

console.log(`Exporting content to ${outDir}...`);
mkdirSync(outDir, { recursive: true });

// 1. pack.yaml
const packYaml = {
  formatVersion: 1,
  minAppVersion: '1.0.0',
  languages: ['es'],
  retired: [],
};
writeFileSync(join(outDir, 'pack.yaml'), stringify(packYaml));

// 2. Worlds
const worldsDir = join(outDir, 'worlds');
mkdirSync(worldsDir, { recursive: true });

for (const w of WORLDS) {
  const worldYaml = {
    id: w.id,
    worldNumber: w.worldNumber,
    ...(w.tier ? { tier: w.tier } : {}),
    ...(w.unlockedBy ? { unlockedBy: w.unlockedBy } : {}),
    ...(w.preview !== undefined ? { preview: w.preview } : {}),
    ...(w.nodeCount !== undefined ? { nodeCount: w.nodeCount } : {}),
    stretches: w.stretches.map((stretch) => stretch.map((s) => ({ kind: s.kind, id: s.id }))),
  };
  writeFileSync(join(worldsDir, `${w.id}.yaml`), stringify(worldYaml));

  const worldSubDir = join(worldsDir, w.id);
  mkdirSync(worldSubDir, { recursive: true });
  const title = es[w.title] ?? w.id;
  const topics = es[w.topics] ?? '';
  const worldMd = `# ${title}\n\n## topics\n${topics}\n`;
  writeFileSync(join(worldSubDir, 'es.md'), worldMd);
}

// 3. Lessons
const lessonsDir = join(outDir, 'lessons');
mkdirSync(lessonsDir, { recursive: true });

for (const l of LESSONS) {
  const itemDir = join(lessonsDir, l.id);
  const mediaDir = join(itemDir, 'media');
  mkdirSync(mediaDir, { recursive: true });

  const mediaConfig = LESSON_MEDIA[l.id];
  const images = l.blocks.filter((b) => b.type === 'image').map((b) => b.art);
  const allMediaImages = lessonArtNames(l.blocks);

  // Copy PNGs
  for (const img of allMediaImages) {
    const srcPng = join(ROOT, 'assets/lessons', `${img}.png`);
    if (existsSync(srcPng)) {
      copyFileSync(srcPng, join(mediaDir, `${img}.png`));
    }
  }

  // Find notice, animation, video, compare, etc.
  let noticeKey;
  let animBlock;
  let vidBlock;
  let compareBlock;
  let stepsBlock;
  let takeawaysBlock;
  let exampleBlock;
  let hookBlock;
  let whyBlock;
  let tipBlock;
  const imageBlocks = [];
  const controls = [];

  if (l.kind === 'how-to-play') {
    let currentControl = null;
    for (const b of l.blocks) {
      if (b.type === 'text' && !currentControl) {
        hookBlock = b;
      } else if (b.type === 'heading') {
        currentControl = { heading: es[b.text] };
        controls.push(currentControl);
      } else if (b.type === 'text' && currentControl) {
        currentControl.text = es[b.text];
      } else if (b.type === 'image' && currentControl) {
        currentControl.alt = es[b.alt];
        currentControl.caption = es[b.caption];
      } else if (b.type === 'tip') {
        tipBlock = b;
      }
    }
  } else {
    for (const b of l.blocks) {
      if (b.type === 'notice') noticeKey = b.text;
      else if (b.type === 'text' && !hookBlock) hookBlock = b;
      else if (b.type === 'text' && hookBlock && !whyBlock) whyBlock = b;
      else if (b.type === 'steps') stepsBlock = b;
      else if (b.type === 'video' && b.source.kind === 'animation') animBlock = b;
      else if (b.type === 'video' && b.source.kind === 'youtube') vidBlock = b;
      else if (b.type === 'example') exampleBlock = b;
      else if (b.type === 'compare') compareBlock = b;
      else if (b.type === 'image') imageBlocks.push(b);
      else if (b.type === 'tip') tipBlock = b;
      else if (b.type === 'takeaways') takeawaysBlock = b;
    }
  }

  const lessonYaml = {
    id: l.id,
    kind: l.kind,
    ...(l.day !== undefined ? { day: l.day } : {}),
    ...(images.length > 0 ? { images } : {}),
    ...(compareBlock ? { compare: { ...(compareBlock.do.art ? { do: compareBlock.do.art } : {}), ...(compareBlock.dont.art ? { dont: compareBlock.dont.art } : {}) } } : {}),
    ...(mediaConfig?.animation ? { animation: mediaConfig.animation } : {}),
    ...(mediaConfig?.youtube ? { youtube: mediaConfig.youtube } : {}),
    ...(noticeKey ? { notice: noticeKey } : {}),
    ...(stepsBlock ? { steps: stepsBlock.items.length } : {}),
    ...(takeawaysBlock ? { takeaways: takeawaysBlock.items.length } : {}),
    ...(controls.length > 0 ? { controls: controls.length } : {}),
  };
  writeFileSync(join(itemDir, 'lesson.yaml'), stringify(lessonYaml));

  // Build Markdown
  let md = '';
  if (l.kind === 'how-to-play') {
    md += `# ${es[l.title] ?? l.id}\n\n`;
    if (hookBlock) md += `## intro\n${es[hookBlock.text]}\n\n`;
    controls.forEach((c, idx) => {
      md += `## Control ${idx + 1}\n### ${c.heading}\n${c.text}\n- alt: ${c.alt}\n- caption: ${c.caption}\n\n`;
    });
    if (tipBlock) md += `## tip\n${es[tipBlock.text]}\n\n`;
  } else {
    if (noticeKey) md += `## notice\n${es[noticeKey]}\n\n`;
    md += `# ${es[l.title] ?? l.id}\n\n`;
    const headingBlock = l.blocks.find((b) => b.type === 'heading' && b.text !== 'lesson.section.why' && b.text !== 'lesson.section.how' && b.text !== 'lesson.section.mistakes');
    if (headingBlock) md += `## heading\n${es[headingBlock.text]}\n\n`;
    if (hookBlock) md += `## hook\n${es[hookBlock.text]}\n\n`;
    if (whyBlock) md += `## why\n${es[whyBlock.text]}\n\n`;
    if (stepsBlock) {
      md += `## steps\n`;
      stepsBlock.items.forEach((item, idx) => {
        md += `${idx + 1}. ${es[item]}\n`;
      });
      md += '\n';
    }
    if (animBlock) {
      md += `## animation\n- alt: ${es[animBlock.alt]}\n- caption: ${es[animBlock.caption]}\n\n`;
    }
    if (exampleBlock) {
      md += `## example\n### ${es[exampleBlock.title]}\n${es[exampleBlock.text]}\n\n`;
    }
    if (compareBlock) {
      md += `## compare\n### do\n${es[compareBlock.do.text]}\n### dont\n${es[compareBlock.dont.text]}\n\n`;
    }
    if (vidBlock) {
      md += `## video\n- alt: ${es[vidBlock.alt]}\n- caption: ${es[vidBlock.caption]}\n\n`;
    }
    if (tipBlock) md += `## tip\n${es[tipBlock.text]}\n\n`;
    if (takeawaysBlock) {
      md += `## takeaways\n`;
      takeawaysBlock.items.forEach((item) => {
        md += `- ${es[item]}\n`;
      });
      md += '\n';
    }
    if (imageBlocks.length > 0) {
      md += `## images\n`;
      for (const ib of imageBlocks) {
        md += `### ${ib.art}\n- alt: ${es[ib.alt]}\n- caption: ${es[ib.caption]}\n\n`;
      }
    }
  }

  writeFileSync(join(itemDir, 'es.md'), md);
}

// 4. Nodes
const nodesDir = join(outDir, 'nodes');
mkdirSync(nodesDir, { recursive: true });

for (const n of ALL_NODES) {
  const itemDir = join(nodesDir, n.id);
  const mediaDir = join(itemDir, 'media');
  mkdirSync(mediaDir, { recursive: true });

  // Copy any primer card media
  for (const c of n.primerCards) {
    if (typeof c !== 'string' && c.media?.art) {
      const srcPng = join(ROOT, 'assets/lessons', `${c.media.art}.png`);
      if (existsSync(srcPng)) {
        copyFileSync(srcPng, join(mediaDir, `${c.media.art}.png`));
      }
    }
  }

  const nodeYaml = {
    id: n.id,
    mode: n.mode,
    prerequisites: n.prerequisites,
    ...(n.opensAfterLesson ? { opensAfterLesson: n.opensAfterLesson } : {}),
    ...(n.simulation ? { simulation: n.simulation } : {}),
    ...(n.exercises ? { exercises: n.exercises.map((e) => ({ metric: e.metric, key: e.key })) } : {}),
    ...(n.primerCards ? {
      primerCards: n.primerCards.map((c) => (typeof c === 'string' ? { kind: 'real-world' } : {
        kind: c.kind,
        ...(c.media ? { media: { type: c.media.type, url: c.media.url, ...(c.media.art ? { art: c.media.art } : {}), ...(c.media.placeholder ? { placeholder: c.media.placeholder } : {}) } } : {}),
        ...(c.tutorialUrl ? { tutorialUrl: c.tutorialUrl } : {}),
      })),
    } : {}),
  };
  writeFileSync(join(itemDir, 'node.yaml'), stringify(nodeYaml));

  // Build Markdown
  let md = `# ${es[n.title] ?? n.id}\n\n`;
  if (n.primerCards.length > 0) {
    md += `## primer\n`;
    n.primerCards.forEach((c, idx) => {
      const cardText = typeof c === 'string' ? es[c] : es[c.text];
      md += `### card ${idx + 1}\n${cardText}\n`;
      if (typeof c !== 'string' && c.media?.caption) {
        md += `- caption: ${es[c.media.caption]}\n`;
      }
      md += '\n';
    });
  }

  if (n.checkpoint.length > 0) {
    md += `## checkpoint\n`;
    n.checkpoint.forEach((q, idx) => {
      md += `### tq${idx + 1}\n${es[q.question]}\n`;
      q.options.forEach((opt) => {
        md += `- [${opt.correct ? 'x' : ' '}] ${es[opt.text]}\n`;
      });
      md += `- why: ${es[q.explanation]}\n\n`;
    });
  }

  if (n.exercises.length > 0) {
    md += `## exercises\n`;
    n.exercises.forEach((e) => {
      md += `- ${e.metric}: ${es[e.key]}\n`;
    });
    md += '\n';
  }

  if (n.debrief) {
    md += `## debrief\n- calm: ${es[n.debrief.calm]}\n- notCalm: ${es[n.debrief.notCalm]}\n\n`;
  }

  writeFileSync(join(itemDir, 'es.md'), md);
}

// 5. Missions
const missionsDir = join(outDir, 'missions');
mkdirSync(missionsDir, { recursive: true });

for (const m of MISSIONS) {
  const itemDir = join(missionsDir, m.id);
  mkdirSync(itemDir, { recursive: true });

  const fourthBlockText = m.problems[0]?.fix.blocks[3]?.text;
  const sharedNote = typeof fourthBlockText === 'string' && fourthBlockText.includes('.note.') ? fourthBlockText : undefined;

  const missionYaml = {
    id: m.id,
    technique: m.technique,
    reps: m.reps,
    ...(m.place ? { place: m.place } : {}),
    ...(sharedNote ? { sharedNote } : {}),
    trains: m.trains.map((s) => ({ kind: s.kind, id: s.id })),
    problems: m.problems.map((p) => ({
      id: p.id,
      label: p.id,
      ...(p.fix.practise ? { practise: { kind: p.fix.practise.kind, id: p.fix.practise.id } } : {}),
    })),
  };
  writeFileSync(join(itemDir, 'mission.yaml'), stringify(missionYaml));

  // Build Markdown
  let md = `# ${es[m.title] ?? m.id}\n\n`;
  md += `## target\n${es[m.target]}\n\n`;
  md += `## success\n${es[m.successSign]}\n\n`;

  md += `## problems\n`;
  for (const p of m.problems) {
    md += `### ${p.id}\n`;
    md += `- label: ${es[p.label]}\n`;
    md += `- reassure: ${es[p.fix.blocks[0].text]}\n`;
    md += `- cause: ${es[p.fix.blocks[1].text]}\n`;
    md += `- c1: ${es[p.fix.blocks[2].text]}\n`;
    md += `- c2: ${es[p.fix.blocks[3].text]}\n`;
    md += `- easier: ${es[p.fix.easierTarget]}\n`;
    const imgBlock = p.fix.blocks.find((b) => b.type === 'image');
    if (imgBlock && imgBlock.type === 'image') {
      md += `- alt: ${es[imgBlock.alt]}\n`;
      md += `- caption: ${es[imgBlock.caption]}\n`;
    }
    md += '\n';
  }

  md += `## general\n`;
  md += `- reassure: ${es[m.generalFix.blocks[0].text]}\n`;
  md += `- cause: ${es[m.generalFix.blocks[1].text]}\n`;
  md += `- c1: ${es[m.generalFix.blocks[2].text]}\n`;
  md += `- c2: ${es[m.generalFix.blocks[3].text]}\n`;
  md += `- easier: ${es[m.generalFix.easierTarget]}\n`;
  const genImg = m.generalFix.blocks.find((b) => b.type === 'image');
  if (genImg && genImg.type === 'image') {
    md += `- alt: ${es[genImg.alt]}\n`;
    md += `- caption: ${es[genImg.caption]}\n`;
  }
  md += '\n';

  writeFileSync(join(itemDir, 'es.md'), md);
}

// 6. Validate exported pack
console.log('Validating exported pack...');
const pack = loadPackFromDisk(outDir);
const report = validatePack(pack);

if (!report.valid) {
  console.error(`Validation failed with ${report.errors.length} errors:`);
  for (const err of report.errors) {
    console.error(`✗ [${err.file ?? 'pack'}] ${err.field ? `${err.field}: ` : ''}${err.message}`);
    if (err.hint) console.error(`  Hint: ${err.hint}`);
  }
  process.exit(1);
}

if (report.warnings.length > 0) {
  console.warn(`Validation passed with ${report.warnings.length} warnings:`);
  for (const w of report.warnings) {
    console.warn(`! [${w.file ?? 'pack'}] ${w.field ? `${w.field}: ` : ''}${w.message}`);
  }
}

console.log(`✓ Content successfully exported to ${outDir} and passed validation!`);
