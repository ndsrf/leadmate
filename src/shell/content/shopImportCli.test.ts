import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
// @ts-ignore
import createJITI from 'jiti';

const jiti = createJITI(__filename);
const {
  extractAsin,
  loadAffiliateTag,
  runShopImport,
  slugifyTitle,
} = jiti('../../../scripts/content-shop-import.mjs');

describe('content:shop-import CLI runner', () => {
  const fixturesDir = join(__dirname, '__fixtures__/shop');
  const fullHtml = readFileSync(join(fixturesDir, 'amazon-product-full.html'), 'utf8');
  const noPriceHtml = readFileSync(join(fixturesDir, 'amazon-product-no-price.html'), 'utf8');
  const robotCheckHtml = readFileSync(join(fixturesDir, 'amazon-robot-check.html'), 'utf8');

  // Minimal valid 1x1 PNG image buffer
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  let tempDir: string;
  let subcatPath: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `leadmate-test-shop-${randomBytes(6).toString('hex')}`);
    const shopDir = join(tempDir, 'content', 'beta', 'shop');
    mkdirSync(join(shopDir, 'products'), { recursive: true });
    mkdirSync(join(shopDir, 'subcategories', 'arneses'), { recursive: true });

    subcatPath = join(shopDir, 'subcategories', 'arneses', 'subcategory.yaml');
    writeFileSync(subcatPath, 'id: arneses\nproducts: []\n', 'utf8');
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  });

  it('handles success case: imports full product, downloads/resizes image, appends to subcategory, writes report', async () => {
    const logs: string[] = [];
    const mockFetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('images') || url.includes('.jpg')) {
        return Promise.resolve({
          status: 200,
          url,
          arrayBuffer: () => Promise.resolve(samplePngBuffer),
        });
      }
      return Promise.resolve({
        status: 200,
        url: 'https://www.amazon.es/dp/B08EXAMPLE',
        text: () => Promise.resolve(fullHtml),
        arrayBuffer: () => Promise.resolve(samplePngBuffer),
      });
    });

    const res = await runShopImport(
      {
        url: 'https://www.amazon.es/dp/B08EXAMPLE',
        channel: 'beta',
        lang: 'es',
        sub: 'arneses',
        id: 'arnes-full-test',
      },
      {
        fetch: mockFetch,
        rootDir: tempDir,
        env: { AMAZON_AFFILIATE_TAG_ES: 'leadmate-es-21' },
        log: (msg: string) => logs.push(msg),
      }
    );

    expect(res.success).toBe(true);
    expect(res.productId).toBe('arnes-full-test');
    expect(res.cleanedUrl).toBe('https://www.amazon.es/dp/B08EXAMPLE?tag=leadmate-es-21');

    // Check product.yaml
    const prodYamlPath = join(tempDir, 'content', 'beta', 'shop', 'products', 'arnes-full-test', 'product.yaml');
    expect(existsSync(prodYamlPath)).toBe(true);
    const prodYaml = readFileSync(prodYamlPath, 'utf8');
    expect(prodYaml).toContain('id: arnes-full-test');
    expect(prodYaml).toContain('source: amazon');
    expect(prodYaml).toContain('es: https://www.amazon.es/dp/B08EXAMPLE?tag=leadmate-es-21');
    expect(prodYaml).toContain('price: 29,99 €');
    expect(prodYaml).toContain('image: product.png');

    // Check es.md
    const prodMdPath = join(tempDir, 'content', 'beta', 'shop', 'products', 'arnes-full-test', 'es.md');
    expect(existsSync(prodMdPath)).toBe(true);
    const prodMd = readFileSync(prodMdPath, 'utf8');
    expect(prodMd).toContain('# Arnés Antitirones Ergonómico');
    expect(prodMd).toContain('## description');

    // Check media
    const imgPath = join(tempDir, 'content', 'beta', 'shop', 'products', 'arnes-full-test', 'media', 'product.png');
    expect(existsSync(imgPath)).toBe(true);

    // Check subcategory append
    const updatedSubcat = readFileSync(subcatPath, 'utf8');
    expect(updatedSubcat).toContain('- arnes-full-test');

    // Check field report
    expect(logs.some((l) => l.includes('Successfully imported product "arnes-full-test"'))).toBe(true);
  });

  function createMockFetch(html: string) {
    return jest.fn().mockImplementation((url: string) =>
      Promise.resolve({
        status: 200,
        url,
        text: () => Promise.resolve(html),
        arrayBuffer: () => Promise.resolve(samplePngBuffer),
      })
    );
  }

  it('handles partial case: product without price or image still imports cleanly', async () => {
    const mockFetch = createMockFetch(noPriceHtml);

    const res = await runShopImport(
      {
        url: 'https://www.amazon.es/dp/B08LEASH',
        channel: 'beta',
        id: 'correa-no-price',
      },
      {
        fetch: mockFetch,
        rootDir: tempDir,
        env: { AMAZON_AFFILIATE_TAG_ES: 'leadmate-es-21' },
        log: () => {},
      }
    );

    expect(res.success).toBe(true);
    const prodYamlPath = join(tempDir, 'content', 'beta', 'shop', 'products', 'correa-no-price', 'product.yaml');
    const prodYaml = readFileSync(prodYamlPath, 'utf8');
    expect(prodYaml).not.toContain('price:');
    expect(prodYaml).not.toContain('priceCheckedAt:');
  });

  it('handles blocked case: Amazon robot-check fails without writing files', async () => {
    const errors: string[] = [];
    const mockFetch = jest.fn().mockImplementation((url: string) =>
      Promise.resolve({
        status: 200,
        url,
        text: () => Promise.resolve(robotCheckHtml),
      })
    );

    const res = await runShopImport(
      {
        url: 'https://www.amazon.es/dp/B08BLOCKED',
        channel: 'beta',
        id: 'blocked-item',
      },
      {
        fetch: mockFetch,
        rootDir: tempDir,
        error: (msg: string) => errors.push(msg),
      }
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe('Robot check detected');
    expect(errors.some((e) => e.includes('Amazon robot check / CAPTCHA detected'))).toBe(true);

    const prodDir = join(tempDir, 'content', 'beta', 'shop', 'products', 'blocked-item');
    expect(existsSync(prodDir)).toBe(false);
  });

  it('handles non-Amazon case: rejects invalid domain without fetching', async () => {
    const errors: string[] = [];
    const mockFetch = jest.fn();

    const res = await runShopImport(
      {
        url: 'https://www.petco.com/shop/en/petcostore/product/sample',
        channel: 'beta',
      },
      {
        fetch: mockFetch,
        rootDir: tempDir,
        error: (msg: string) => errors.push(msg),
      }
    );

    expect(res.success).toBe(false);
    expect(res.error).toBe('Not an Amazon URL');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(errors.some((e) => e.includes('not a recognized Amazon product URL'))).toBe(true);
  });

  it('handles existing-id case: fails without --overwrite, succeeds with --overwrite', async () => {
    const mockFetch = createMockFetch(noPriceHtml);

    // First import succeeds
    const first = await runShopImport(
      {
        url: 'https://www.amazon.es/dp/B08EXIST',
        id: 'existing-product',
      },
      {
        fetch: mockFetch,
        rootDir: tempDir,
        log: () => {},
      }
    );
    expect(first.success).toBe(true);

    // Second import without overwrite fails
    const errors: string[] = [];
    const second = await runShopImport(
      {
        url: 'https://www.amazon.es/dp/B08EXIST',
        id: 'existing-product',
        overwrite: false,
      },
      {
        fetch: mockFetch,
        rootDir: tempDir,
        error: (msg: string) => errors.push(msg),
      }
    );
    expect(second.success).toBe(false);
    expect(second.error).toBe('Product already exists');
    expect(errors.some((e) => e.includes('already exists'))).toBe(true);

    // Third import with overwrite succeeds
    const third = await runShopImport(
      {
        url: 'https://www.amazon.es/dp/B08EXIST',
        id: 'existing-product',
        overwrite: true,
      },
      {
        fetch: mockFetch,
        rootDir: tempDir,
        log: () => {},
      }
    );
    expect(third.success).toBe(true);
  });

  describe('Affiliate Tag Resolution', () => {
    it('reads affiliate tag from .env.local file', () => {
      writeFileSync(join(tempDir, '.env.local'), 'AMAZON_AFFILIATE_TAG_ES=local-file-tag-21\n', 'utf8');
      const tag = loadAffiliateTag('ES', tempDir, {});
      expect(tag).toBe('local-file-tag-21');
    });

    it('prefers environment variable over .env.local file', () => {
      writeFileSync(join(tempDir, '.env.local'), 'AMAZON_AFFILIATE_TAG_ES=file-tag-21\n', 'utf8');
      const tag = loadAffiliateTag('ES', tempDir, { AMAZON_AFFILIATE_TAG_ES: 'env-tag-override-21' });
      expect(tag).toBe('env-tag-override-21');
    });

    it('warns and leaves tag unset when marketplace tag is not configured', async () => {
      const warnings: string[] = [];
      const mockFetch = createMockFetch(noPriceHtml);

      const res = await runShopImport(
        {
          url: 'https://www.amazon.co.uk/dp/B08UKPROD',
          id: 'uk-prod-notag',
        },
        {
          fetch: mockFetch,
          rootDir: tempDir,
          env: {}, // no CO_UK tag
          warn: (msg: string) => warnings.push(msg),
          log: () => {},
        }
      );

      expect(res.success).toBe(true);
      expect(res.cleanedUrl).toBe('https://www.amazon.co.uk/dp/B08UKPROD');
      expect(warnings.some((w) => w.includes('No affiliate tag configured for marketplace CO_UK'))).toBe(true);
    });

    it('never applies an .es affiliate tag to a .com link', async () => {
      const mockFetch = createMockFetch(noPriceHtml);

      const res = await runShopImport(
        {
          url: 'https://www.amazon.com/dp/B08USPROD',
          id: 'us-prod-no-es-tag',
        },
        {
          fetch: mockFetch,
          rootDir: tempDir,
          env: { AMAZON_AFFILIATE_TAG_ES: 'es-tag-should-not-apply' },
          warn: () => {},
          log: () => {},
        }
      );

      expect(res.success).toBe(true);
      expect(res.cleanedUrl).toBe('https://www.amazon.com/dp/B08USPROD');
      expect(res.cleanedUrl).not.toContain('es-tag-should-not-apply');
    });
  });

  describe('slugify & ASIN helpers', () => {
    it('generates valid kebab-case ids from titles', () => {
      expect(slugifyTitle('Arnés Ergonómico para Perros Grandes', 'B012345678')).toBe('arnes-ergonomico-para-perros-grandes');
      expect(slugifyTitle('', 'B012345678')).toBe('prod-b012345678');
    });

    it('extracts ASIN from amazon URLs', () => {
      expect(extractAsin('https://www.amazon.es/dp/B08EXAMPLE?tag=foo')).toBe('B08EXAMPLE');
      expect(extractAsin('https://www.amazon.com/Product-Name/dp/B08EXAMPLE/ref=foo')).toBe('B08EXAMPLE');
      expect(extractAsin('https://www.amazon.com/gp/product/B08EXAMPLE')).toBe('B08EXAMPLE');
    });
  });
});
