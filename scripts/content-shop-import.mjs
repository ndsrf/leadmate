#!/usr/bin/env node
/**
 * CLI command to import a product from Amazon into a LeadMate Content Pack.
 * Usage:
 *   npm run content:shop-import -- <amazon-url> [--channel beta|stable] [--lang <code>] [--sub <subcategory-id>] [--id <product-id>] [--overwrite]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import createJITI from 'jiti';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const jiti = createJITI(ROOT);
const {
  extractProductFromHtml,
  isAmazonUrl,
  getMarketplaceSuffix,
  cleanAmazonUrl,
} = jiti('./src/shell/content/shopImport.ts');

/**
 * Loads the affiliate tag for the given marketplace suffix from process.env or .env.local.
 * Environment variables take precedence over .env.local.
 */
export function loadAffiliateTag(suffix, rootDir = ROOT, env = process.env) {
  if (!suffix) return null;
  const envVarName = `AMAZON_AFFILIATE_TAG_${suffix.toUpperCase()}`;

  // 1. Check real environment variables first
  if (env[envVarName] && env[envVarName].trim()) {
    return env[envVarName].trim();
  }

  // 2. Check .env.local file
  const envLocalPath = join(rootDir, '.env.local');
  if (existsSync(envLocalPath)) {
    try {
      const content = readFileSync(envLocalPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          // Remove wrapping quotes if present
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (key === envVarName && val) {
            return val;
          }
        }
      }
    } catch {
      // ignore read error
    }
  }

  return null;
}

/**
 * Derives a kebab-case identifier from a title string or ASIN.
 */
export function slugifyTitle(title, asin) {
  if (title) {
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const parts = slug.split('-').filter(Boolean).slice(0, 5);
    if (parts.length > 0) {
      return parts.join('-');
    }
  }
  if (asin) {
    return `prod-${asin.toLowerCase()}`;
  }
  return `prod-${randomBytes(4).toString('hex')}`;
}

/**
 * Extracts ASIN from an Amazon URL if possible.
 */
export function extractAsin(urlStr) {
  try {
    const u = new URL(urlStr);
    const m = /\/(?:dp|gp\/product|d)\/([A-Z0-9]{10})/i.exec(u.pathname);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Resizes an image buffer to max dimension <= 600px and saves to destPath.
 */
export function saveAndResizeImage(imageBuffer, destPath) {
  const tempInput = join(tmpdir(), `leadmate-img-${randomBytes(6).toString('hex')}`);
  try {
    writeFileSync(tempInput, imageBuffer);
    try {
      // Try ImageMagick convert
      execFileSync('convert', [tempInput, '-resize', '600x600>', destPath], { stdio: 'pipe' });
      return true;
    } catch {
      try {
        // Try Python PIL
        const pyScript = `
from PIL import Image
im = Image.open("${tempInput}")
im.thumbnail((600, 600))
im.save("${destPath}")
`;
        execFileSync('python3', ['-c', pyScript], { stdio: 'pipe' });
        return true;
      } catch {
        // Fallback: write original image directly
        writeFileSync(destPath, imageBuffer);
        return true;
      }
    }
  } finally {
    try {
      if (existsSync(tempInput)) {
        writeFileSync(tempInput, '');
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Main import runner.
 */
export async function runShopImport(options, context = {}) {
  const fetchFn = context.fetch ?? globalThis.fetch;
  const env = context.env ?? process.env;
  const rootDir = context.rootDir ?? ROOT;
  const log = context.log ?? console.log;
  const warn = context.warn ?? console.warn;
  const error = context.error ?? console.error;

  const {
    url: rawUrl,
    channel = 'beta',
    lang = 'es',
    sub: subId,
    id: userProductId,
    overwrite = false,
  } = options;

  if (!rawUrl) {
    error('Error: An Amazon product URL is required.');
    return { success: false, error: 'URL required' };
  }

  // 1. Amazon domain validation
  if (!isAmazonUrl(rawUrl)) {
    error(`Error: "${rawUrl}" is not a recognized Amazon product URL or short link.`);
    return { success: false, error: 'Not an Amazon URL' };
  }

  // 2. Fetch page (handling short-link redirects)
  log(`Fetching Amazon product: ${rawUrl}`);
  let finalUrl = rawUrl;
  let html = '';

  try {
    const res = await fetchFn(rawUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': `${lang},en;q=0.9`,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (res.url) {
      finalUrl = res.url;
    }

    if (res.status !== 200) {
      error(`Failed to fetch product page (HTTP status ${res.status}). Cannot extract automatically; please author the product by hand.`);
      return { success: false, error: `HTTP ${res.status}` };
    }

    html = await res.text();
  } catch (err) {
    error(`Network error fetching product page: ${err.message}. Please author the product by hand.`);
    return { success: false, error: err.message };
  }

  // 3. Extract metadata
  const extracted = extractProductFromHtml(html);
  if (extracted.isRobotCheck) {
    error('Amazon robot check / CAPTCHA detected. Cannot extract automatically; please author the product by hand.');
    return { success: false, error: 'Robot check detected' };
  }

  // 4. Determine ASIN & ID
  const asin = extractAsin(finalUrl);
  const productId = userProductId || slugifyTitle(extracted.title, asin);

  // 5. Affiliate tag handling
  const suffix = getMarketplaceSuffix(finalUrl);
  const affiliateTag = suffix ? loadAffiliateTag(suffix, rootDir, env) : null;
  if (suffix && !affiliateTag) {
    warn(`Warning: No affiliate tag configured for marketplace ${suffix} (AMAZON_AFFILIATE_TAG_${suffix}). Proceeding without tag.`);
  }

  const cleanedUrl = cleanAmazonUrl(finalUrl, affiliateTag ?? undefined);

  // 6. Check destination paths
  const packDir = join(rootDir, 'content', channel);
  const productsDir = join(packDir, 'shop', 'products');
  const targetDir = join(productsDir, productId);

  if (existsSync(targetDir) && !overwrite) {
    error(`Error: Product "${productId}" already exists at ${targetDir}. Use --overwrite to replace.`);
    return { success: false, error: 'Product already exists' };
  }

  mkdirSync(targetDir, { recursive: true });

  // 7. Download and resize image if available
  let savedImageFilename;
  if (extracted.imageUrl) {
    try {
      log(`Downloading product image: ${extracted.imageUrl}`);
      const imgRes = await fetchFn(extracted.imageUrl);
      if (imgRes.status === 200) {
        const rawBuf = await imgRes.arrayBuffer();
        const buf = Buffer.isBuffer(rawBuf) ? rawBuf : Buffer.from(rawBuf);
        const mediaDir = join(targetDir, 'media');
        mkdirSync(mediaDir, { recursive: true });
        savedImageFilename = 'product.png';
        const destPath = join(mediaDir, savedImageFilename);
        saveAndResizeImage(buf, destPath);
      }
    } catch (err) {
      warn(`Warning: Could not download image (${err.message}). Proceeding without image.`);
    }
  }

  // 8. Write product.yaml
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const productYamlObj = {
    id: productId,
    source: 'amazon',
    urls: {
      [lang]: cleanedUrl,
    },
    ...(extracted.price ? { price: extracted.price, priceCheckedAt: yearMonth } : {}),
    ...(savedImageFilename ? { image: savedImageFilename } : {}),
  };

  // Convert to YAML
  const yamlLines = [
    `id: ${productYamlObj.id}`,
    `source: ${productYamlObj.source}`,
    `urls:`,
    `  ${lang}: ${productYamlObj.urls[lang]}`,
  ];
  if (productYamlObj.price) {
    yamlLines.push(`price: ${productYamlObj.price}`);
    yamlLines.push(`priceCheckedAt: ${productYamlObj.priceCheckedAt}`);
  }
  if (productYamlObj.image) {
    yamlLines.push(`image: ${productYamlObj.image}`);
  }

  writeFileSync(join(targetDir, 'product.yaml'), yamlLines.join('\n') + '\n', 'utf8');

  // 9. Write markdown file(s)
  const productTitle = extracted.title || productId;
  const productDesc = extracted.description || 'Descripción del producto.';

  const mdContent = `# ${productTitle}\n\n## description\n${productDesc}\n`;
  writeFileSync(join(targetDir, `${lang}.md`), mdContent, 'utf8');
  if (lang !== 'es') {
    // Content packs require es.md
    writeFileSync(join(targetDir, 'es.md'), mdContent, 'utf8');
  }

  // 10. Append to Subcategory if specified
  let appendedToSub = false;
  if (subId) {
    const subcatYamlPath = join(packDir, 'shop', 'subcategories', subId, 'subcategory.yaml');
    if (existsSync(subcatYamlPath)) {
      try {
        const subYamlContent = readFileSync(subcatYamlPath, 'utf8');
        const match = /products:\s*([\s\S]*?)(?:\n[a-z]|$)/.exec(subYamlContent);
        if (match) {
          const lines = subYamlContent.split('\n');
          const productsIdx = lines.findIndex((l) => l.startsWith('products:'));
          if (productsIdx >= 0) {
            const hasProduct = lines.some((l) => l.trim() === `- ${productId}`);
            if (!hasProduct) {
              lines.splice(productsIdx + 1, 0, `  - ${productId}`);
              writeFileSync(subcatYamlPath, lines.join('\n'), 'utf8');
              appendedToSub = true;
            } else {
              appendedToSub = true;
            }
          }
        }
      } catch (err) {
        warn(`Warning: Could not append product to subcategory "${subId}": ${err.message}`);
      }
    } else {
      warn(`Warning: Subcategory "${subId}" not found at ${subcatYamlPath}. Product was not attached.`);
    }
  }

  // 11. Report
  log('');
  log(`✓ Successfully imported product "${productId}" into ${channel}:`);
  log(`  - Title:            ${productTitle}`);
  log(`  - Description:      ${productDesc.slice(0, 80).replace(/\n/g, ' ')}${productDesc.length > 80 ? '...' : ''}`);
  log(`  - Price:            ${extracted.price || '(none)'}`);
  log(`  - Price checked at: ${extracted.price ? yearMonth : '(none)'}`);
  log(`  - Buy URL (${lang}):    ${cleanedUrl}`);
  log(`  - Image:            ${savedImageFilename ? `media/${savedImageFilename}` : '(none)'}`);
  log(`  - Subcategory:      ${subId ? (appendedToSub ? `appended to "${subId}"` : `not found: "${subId}"`) : '(none specified)'}`);
  log('');

  return {
    success: true,
    productId,
    extracted,
    cleanedUrl,
    affiliateTag,
  };
}

// CLI Execution entry point
if (process.argv[1] && process.argv[1].endsWith('content-shop-import.mjs')) {
  const args = process.argv.slice(2);
  const flags = {};
  let urlArg = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--overwrite') {
      flags.overwrite = true;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1];
      if (val && !val.startsWith('--')) {
        flags[key] = val;
        i++;
      }
    } else if (!urlArg) {
      urlArg = arg;
    }
  }

  if (!urlArg) {
    console.error('Usage: npm run content:shop-import -- <amazon-url> [--channel beta|stable] [--lang <code>] [--sub <subcategory-id>] [--id <product-id>] [--overwrite]');
    process.exit(1);
  }

  runShopImport({
    url: urlArg,
    channel: flags.channel || 'beta',
    lang: flags.lang || 'es',
    sub: flags.sub,
    id: flags.id,
    overwrite: Boolean(flags.overwrite),
  }).then((res) => {
    if (!res.success) {
      process.exit(1);
    }
  });
}
