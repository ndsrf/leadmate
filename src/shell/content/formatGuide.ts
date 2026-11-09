import {
  CATEGORY_SCHEMA_FIELDS,
  LESSON_SCHEMA_FIELDS,
  MISSION_SCHEMA_FIELDS,
  NODE_SCHEMA_FIELDS,
  PACK_SCHEMA_FIELDS,
  PRODUCT_SCHEMA_FIELDS,
  RECOMMENDATION_SCHEMA_FIELDS,
  SHOP_SCHEMA_FIELDS,
  SUBCATEGORY_SCHEMA_FIELDS,
  WORLD_SCHEMA_FIELDS,
  type FieldDoc,
} from './schema';

/**
 * Renders an array of FieldDoc definitions into a GitHub-flavored Markdown table.
 */
export function renderFieldTable(fields: readonly FieldDoc[]): string {
  const header = '| Field | Type | Required | Allowed Values | Description |\n| --- | --- | --- | --- | --- |';
  const rows = fields.map((f) => {
    const allowed = f.allowedValues ? f.allowedValues.map((v) => `\`${v}\``).join(', ') : '-';
    return `| \`${f.name}\` | \`${f.type}\` | ${f.required ? '**Yes**' : 'No'} | ${allowed} | ${f.description} |`;
  });
  return [header, ...rows].join('\n');
}

/**
 * Returns the exact generated markdown tables for each file kind.
 */
export function getGeneratedTables() {
  return {
    packTable: renderFieldTable(PACK_SCHEMA_FIELDS),
    worldTable: renderFieldTable(WORLD_SCHEMA_FIELDS),
    lessonTable: renderFieldTable(LESSON_SCHEMA_FIELDS),
    nodeTable: renderFieldTable(NODE_SCHEMA_FIELDS),
    missionTable: renderFieldTable(MISSION_SCHEMA_FIELDS),
    shopTable: renderFieldTable(SHOP_SCHEMA_FIELDS),
    categoryTable: renderFieldTable(CATEGORY_SCHEMA_FIELDS),
    subcategoryTable: renderFieldTable(SUBCATEGORY_SCHEMA_FIELDS),
    productTable: renderFieldTable(PRODUCT_SCHEMA_FIELDS),
    recommendationTable: renderFieldTable(RECOMMENDATION_SCHEMA_FIELDS),
  };
}
