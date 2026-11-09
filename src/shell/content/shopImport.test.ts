import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  cleanAmazonUrl,
  decodeHtmlEntities,
  extractProductFromHtml,
  getMarketplaceSuffix,
  isAmazonRobotCheck,
  isAmazonUrl,
} from './shopImport';

describe('shopImport extractor', () => {
  const fixturesDir = join(__dirname, '__fixtures__/shop');

  it('extracts complete product metadata from a full Amazon product page', () => {
    const html = readFileSync(join(fixturesDir, 'amazon-product-full.html'), 'utf8');
    const result = extractProductFromHtml(html);

    expect(result.isRobotCheck).toBe(false);
    expect(result.title).toBe('Arnés Antitirones Ergonómico Transpirable con Anilla Delantera');
    expect(result.price).toBe('29,99 €');
    expect(result.imageUrl).toBe('https://m.media-amazon.com/images/I/71example_hires.jpg');
    expect(result.description).toContain('Diseño en Y que evita la presión sobre el cuello');
    expect(result.description).toContain('Doble anilla metálica resistente');
  });

  it('extracts metadata when price is absent (e.g. out of stock product)', () => {
    const html = readFileSync(join(fixturesDir, 'amazon-product-no-price.html'), 'utf8');
    const result = extractProductFromHtml(html);

    expect(result.isRobotCheck).toBe(false);
    expect(result.title).toBe('Correa Multiposición de Adiestramiento 2 Metros');
    expect(result.price).toBeUndefined();
    expect(result.imageUrl).toBe('https://m.media-amazon.com/images/I/61leash.jpg');
    expect(result.description).toContain('Tres posiciones de longitud');
  });

  it('identifies Amazon robot-check / CAPTCHA challenge pages', () => {
    const html = readFileSync(join(fixturesDir, 'amazon-robot-check.html'), 'utf8');
    expect(isAmazonRobotCheck(html)).toBe(true);

    const result = extractProductFromHtml(html);
    expect(result.isRobotCheck).toBe(true);
    expect(result.title).toBeUndefined();
    expect(result.price).toBeUndefined();
  });

  it('falls back to OpenGraph metadata when Amazon DOM selectors are missing', () => {
    const html = readFileSync(join(fixturesDir, 'amazon-opengraph-only.html'), 'utf8');
    const result = extractProductFromHtml(html);

    expect(result.isRobotCheck).toBe(false);
    expect(result.title).toBe('Cama Calmante para Perros');
    expect(result.description).toBe('Cama redonda supersuave antiestrés y lavable para mascotas.');
    expect(result.imageUrl).toBe('https://m.media-amazon.com/images/I/81bed.jpg');
  });

  it('decodes HTML entities correctly', () => {
    expect(decodeHtmlEntities('Harn&eacute;s &amp; Correa &quot;Pro&quot; &#39;Special&#39;')).toBe(
      'Harnés & Correa "Pro" \'Special\''
    );
  });
});

describe('shopImport URL and marketplace helpers', () => {
  it('validates Amazon domains including short-links and international marketplaces', () => {
    expect(isAmazonUrl('https://www.amazon.es/dp/B08XYZ123')).toBe(true);
    expect(isAmazonUrl('https://amazon.com/gp/product/B08XYZ123')).toBe(true);
    expect(isAmazonUrl('https://www.amazon.co.uk/dp/B08XYZ123')).toBe(true);
    expect(isAmazonUrl('https://amazon.com.mx/dp/B08XYZ123')).toBe(true);
    expect(isAmazonUrl('https://amzn.to/3example')).toBe(true);
    expect(isAmazonUrl('https://a.co/d/example')).toBe(true);
    expect(isAmazonUrl('https://example.com/dp/B08XYZ123')).toBe(false);
    expect(isAmazonUrl('not-a-url')).toBe(false);
  });

  it('resolves the correct environment variable marketplace suffix', () => {
    expect(getMarketplaceSuffix('https://www.amazon.es/dp/123')).toBe('ES');
    expect(getMarketplaceSuffix('https://amazon.com/dp/123')).toBe('COM');
    expect(getMarketplaceSuffix('https://www.amazon.co.uk/dp/123')).toBe('CO_UK');
    expect(getMarketplaceSuffix('https://amazon.com.mx/dp/123')).toBe('COM_MX');
    expect(getMarketplaceSuffix('https://amazon.de/dp/123')).toBe('DE');
    expect(getMarketplaceSuffix('https://amzn.to/3xyz')).toBeNull();
    expect(getMarketplaceSuffix('https://otherstore.com/dp/123')).toBeNull();
  });

  it('strips tracking parameters and attaches affiliate tag if provided', () => {
    const dirtyUrl = 'https://www.amazon.es/dp/B08XYZ123?ref_=ast_sto_dp&th=1&psc=1&qid=1600000000';
    expect(cleanAmazonUrl(dirtyUrl)).toBe('https://www.amazon.es/dp/B08XYZ123');
    expect(cleanAmazonUrl(dirtyUrl, 'leadmate-21')).toBe('https://www.amazon.es/dp/B08XYZ123?tag=leadmate-21');
  });
});
