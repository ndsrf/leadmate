# LeadMate Content Pack Format Guide

The Content Pack is a plain-file description of LeadMate's Worlds, Lessons, Nodes, Missions, translations, and illustrations. It enables authors and AI agents to add, edit, reorder, retire, validate, promote, and publish content without modifying compiled application code.

Packs live in the repository under two channels:
- `content/beta/`: Working pack where authors and AI agents make and test edits.
- `content/stable/`: Promoted pack shipped as the bundled baseline in the app and followed by default.

---

## 1. Directory Layout

Everything belonging to one Lesson, Node, Mission, or Shop item lives together in a single folder:

```
content/<channel>/                 channel = beta | stable
  pack.yaml                        formatVersion, minAppVersion, languages, retired IDs
  worlds/<world-id>.yaml           stretches (ordered Stops), unlocks, tier
  worlds/<world-id>/<lang>.md      world title and topics per language
  lessons/<lesson-id>/
    lesson.yaml                    structure: kind, images, animation, youtube, steps
    es.md                          Spanish text (required)
    en.md                          optional additional languages
    media/*.png                    illustrations belonging to this lesson
  nodes/<node-id>/
    node.yaml                      mode, prerequisites, simulation, exercises
    es.md                          Spanish text (title, primer, checkpoint, exercises)
    media/*.png                    illustrations belonging to this node
  missions/<mission-id>/
    mission.yaml                   technique, reps, trains, problems
    es.md                          Spanish text (title, target, success, problem fixes)
    media/*.png                    illustrations belonging to this mission
  shop/
    shop.yaml                      ordered list of categories
    categories/<cat-id>/
      category.yaml                ordered list of subcategories
      es.md                        title and description
      media/*.png                  illustrations belonging to this category
    subcategories/<sub-id>/
      subcategory.yaml             ordered list of products
      es.md                        title and description
      media/*.png                  illustrations belonging to this subcategory
    products/<product-id>/
      product.yaml                 source, urls, price, priceCheckedAt, image
      es.md                        name and description
      media/*.png                  illustrations / photos belonging to this product
```

---

## 2. Identifier Rules

- Every item identifier (`id`) MUST be lowercase kebab-case (matching `^[a-z0-9]+(-[a-z0-9]+)*$`).
- IDs MUST be unique across all content items (Worlds, Lessons, Nodes, Missions, Categories, Subcategories, Products).
- Published IDs are permanent: once published, an ID must never be deleted without being added to `retired` in `pack.yaml`.

---

## 3. Schema Reference Tables

<!-- Generated from src/shell/content/schema.ts - do not edit tables manually -->

### 3.1 `pack.yaml`

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `formatVersion` | `number` | **Yes** | - | Version of the pack file format (positive integer, e.g. 1) |
| `contentVersion` | `number` | **Yes** | - | Monotonic curriculum content release version (positive integer, e.g. 1) |
| `minAppVersion` | `string` | **Yes** | - | Minimum semver app version required to load this pack (e.g. "1.0.0") |
| `languages` | `string[]` | **Yes** | - | List of language codes in use; must include "es" |
| `retired` | `string[]` | No | - | List of retired content item IDs to preserve user progress |

### 3.2 `worlds/<world-id>.yaml`

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | **Yes** | - | Unique kebab-case identifier for the World |
| `worldNumber` | `number` | **Yes** | - | Display number (1-based integer) |
| `tier` | `string` | No | `free`, `plus` | Curriculum tier ("free" or "plus") |
| `unlockedBy` | `string` | No | - | ID of previous World that unlocks this one (absent for World 1) |
| `preview` | `boolean` | No | - | Whether this World is an unplayable roadmap preview |
| `nodeCount` | `number` | No | - | Planned Stop count for preview Worlds |
| `stretches` | `Stop[][]` | **Yes** | - | Ordered array of Stretches, each containing ordered Stops |

### 3.3 `lessons/<lesson-id>/lesson.yaml`

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | **Yes** | - | Unique kebab-case identifier for the Lesson |
| `kind` | `string` | **Yes** | `theory`, `how-to-play` | Lesson kind ("theory" or "how-to-play") |
| `day` | `number` | No | - | Suggested day (1-5) for Library first-week lessons |
| `images` | `string[]` | No | - | Bundled art keys or relative image paths in media/ |
| `compare` | `object` | No | - | Optional illustration keys for do and dont mistakes ({ do?: string, dont?: string }) |
| `animation` | `string` | No | - | Lesson Animation key in hosted media bucket |
| `youtube` | `Record<string, string>` | No | - | Map of language code to 11-char YouTube video ID |
| `notice` | `string` | No | - | Optional safety notice key or text shown before the Lesson body |
| `steps` | `number` | No | - | Number of how-to steps (theory lessons, typically 3-6) |
| `takeaways` | `number` | No | - | Number of takeaway bullet points (typically 2-4) |
| `controls` | `number` | No | - | Number of control recap sections (for how-to-play lessons) |
| `recommendations` | `object[]` | No | - | Optional list of shop recommendations ({ id, target, when }) |

### 3.4 `nodes/<node-id>/node.yaml`

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | **Yes** | - | Unique kebab-case identifier for the Node |
| `mode` | `string` | **Yes** | `stage`, `minigame`, `close_exercise` | Node mode ("stage", "minigame", "close_exercise") |
| `prerequisites` | `string[]` | **Yes** | - | IDs of Nodes that must be completed before this one is available |
| `opensAfterLesson` | `string` | No | - | Lesson ID whose reading alone unlocks this Node in its Stretch |
| `simulation` | `object` | No | - | Stage/close scenario config or scenario name, or minigame kind |
| `exercises` | `object[]` | No | - | Array of exercises targeting metrics ({ metric, key? }) |
| `primerCards` | `object[]` | No | - | Structured recap cards ({ kind, media?, tutorialUrl? }) |
| `checkpoint` | `object[]` | No | - | Quiz questions ({ question, options, explanation }) |
| `debrief` | `object` | No | - | Hand drill debrief text keys ({ calm, notCalm }) |
| `recommendations` | `object[]` | No | - | Optional list of shop recommendations ({ id, target, when }) |

### 3.5 `missions/<mission-id>/mission.yaml`

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | **Yes** | - | Unique kebab-case identifier for the Mission |
| `technique` | `string` | **Yes** | - | Technique trained by this Mission |
| `reps` | `number` | **Yes** | - | Target repetition count (positive integer) |
| `place` | `string` | No | `home` | "home" for missions done at home; absent for walks |
| `trains` | `Stop[]` | **Yes** | - | Stops that train the target of this Mission |
| `problems` | `object[]` | **Yes** | - | List of problem items ({ id, label?, practise? }) |
| `sharedNote` | `string` | No | - | Shared safety note key substituted into problem fixes |
| `recommendations` | `object[]` | No | - | Optional list of shop recommendations ({ id, target, when }) |

### 3.6 `shop/shop.yaml`

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `categories` | `string[]` | **Yes** | - | Ordered list of Category IDs in the shop |

### 3.7 `shop/categories/<category-id>/category.yaml`

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | **Yes** | - | Unique kebab-case identifier for the Category |
| `subcategories` | `string[]` | **Yes** | - | Ordered list of Subcategory IDs in this Category |

### 3.8 `shop/subcategories/<subcategory-id>/subcategory.yaml`

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | **Yes** | - | Unique kebab-case identifier for the Subcategory |
| `products` | `string[]` | **Yes** | - | Ordered list of Product IDs in this Subcategory |

### 3.9 `shop/products/<product-id>/product.yaml`

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | **Yes** | - | Unique kebab-case identifier for the Product |
| `source` | `string` | No | `amazon`, `manual` | Product origin ("amazon" or "manual") |
| `urls` | `Record<string, string>` | **Yes** | - | Map of language code to HTTPS buy link (es required) |
| `price` | `string` | No | - | Optional approximate display price (e.g. "24,99 €") |
| `priceCheckedAt` | `string` | No | - | Month price was checked in YYYY-MM format |
| `image` | `string` | No | - | Optional relative media path in media/ |

### 3.10 `recommendations` (`lesson.yaml`, `node.yaml`, `mission.yaml`)

| Field | Type | Required | Allowed Values | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | **Yes** | - | Unique kebab-case identifier for the Recommendation |
| `target` | `string` | **Yes** | - | Target Product, Subcategory, or Category ID |
| `when` | `string` | **Yes** | - | Trigger condition ("view", "poste-trouble", "poor-score", or "problem:<id>") |

---

## 4. Markdown Format (`<lang>.md`)

Markdown files hold the human text of each item.

### Rules
- **No Raw HTML**: Any raw HTML tags (e.g. `<div>`, `<script>`, `<img>`, `<span>`) are strictly forbidden and rejected during validation.
- **Allowed formatting**: Bold (`**text**`), italics (`*text*`), template variables (`{name}` for the dog's name), and standard lists.
- **Spanish required**: An `es.md` file is required for every item. Other languages (`en.md`, etc.) are optional and fall back section-by-section to Spanish.

### Theory Lesson Sections
1. `# Title`: Visible title of the lesson
2. `## notice` *(optional)*: Safety notice shown at the top
3. `## heading`: Main heading
4. `## hook`: Recognition hook (40-70 words)
5. `## why`: Scientific/behavioural explanation (60-110 words)
6. `## steps`: Numbered how-to steps (12-30 words each)
7. `## animation` *(optional)*: `- alt:` and `- caption:` for the Lesson Animation
8. `## example`: `### Title` followed by worked walk story (60-110 words)
9. `## compare`: `### do` and `### dont` common mistakes
10. `## video` *(optional)*: `- alt:` and `- caption:` for the YouTube video
11. `## tip`: "Prueba hoy" concrete takeaway for the next walk (15-35 words)
12. `## takeaways`: Bulleted summary (2-4 bullets, 5-15 words each)
13. `## images`: `### <filename>` with `- alt:` and `- caption:` for each image

### Shop Item Sections
- **Categories and Subcategories**:
  1. `# Title`: Category or subcategory title
  2. `## description`: Brief description (10-40 words)
- **Products**:
  1. `# Name`: Visible product name
  2. `## description`: Product description (20-60 words)

### Recommendations Section (Lessons, Nodes, Missions)
Any Lesson, Node, or Mission can include an optional `## recommendations` section in its `<lang>.md`:
```markdown
## recommendations
### <recommendation-id>
Explanation text shown to the user on the recommendation card or popup.
```

---

## 5. Media, Animations, and Videos

- **Images**: Placed under the item's `media/` folder (e.g. `lessons/<id>/media/step-1.png` or `shop/products/<id>/media/product.png`). References in YAML or Markdown must be relative file names inside the folder (no `../` or `/`).
- **Animations**: Hosted clip key specified in `animation:` in `lesson.yaml`. Clip timelines live in `docs/content/animations/`.
- **YouTube Videos**: 11-character video ID per language in `lesson.yaml` (e.g. `youtube: { es: "dQw4w9WgXcQ" }`).

---

## 6. Authoring Workflow

### Adding or Editing Content
1. Work in `content/beta/`.
2. To create a new Lesson:
   - Create `content/beta/lessons/<id>/lesson.yaml` and `es.md`.
   - Place illustrations in `content/beta/lessons/<id>/media/`.
   - Add `{ kind: "lesson", id: "<id>" }` to a World's stretch in `content/beta/worlds/<world>.yaml`.
3. To add or edit Shop items:
   - Create Categories in `content/beta/shop/categories/<cat-id>/` and list them in `shop/shop.yaml`.
   - Create Subcategories in `content/beta/shop/subcategories/<sub-id>/` and list them in the parent Category's `category.yaml`.
   - Create Products in `content/beta/shop/products/<product-id>/` and list them in the parent Subcategory's `subcategory.yaml`.
   - Alternatively, import products from Amazon:
     ```bash
     npm run content:shop-import -- <amazon-url> [--lang <code>] [--sub <subcategory-id>] [--id <product-id>] [--overwrite]
     ```
     Affiliate tags are resolved from environment variables or `.env.local` using `AMAZON_AFFILIATE_TAG_<SUFFIX>` (e.g. `AMAZON_AFFILIATE_TAG_ES`, `AMAZON_AFFILIATE_TAG_COM`, `AMAZON_AFFILIATE_TAG_CO_UK`). These tags are author-time only and never bundled in the app.
4. Validate your edits:
   ```bash
   npm run content:validate -- --channel beta
   ```
5. Promote to stable when ready:
   ```bash
   npm run content:promote
   ```
6. Publish:
   ```bash
   npm run content:publish -- --channel beta
   ```

### Retiring Content
To remove an item without breaking user progress:
1. Remove its Stop from the World's stretch (or Category/Subcategory list).
2. Delete its folder from `lessons/`, `nodes/`, `missions/`, or `shop/`.
3. Add its ID to `retired:` in `content/beta/pack.yaml`.
4. Validate and promote.

---

## 7. Worked Examples

### Worked Lesson Example

#### `lessons/sample-leash-focus/lesson.yaml`
```yaml
id: sample-leash-focus
kind: theory
images:
  - sample-diagram.png
  - sample-scene.png
compare:
  do: sample-do
  dont: sample-dont
animation: sample-focus-anim
youtube:
  es: dQw4w9WgXcQ
steps: 3
takeaways: 2
```

#### `lessons/sample-leash-focus/es.md`
```markdown
# Atención en el paseo

## heading
El valor de la mirada tranquila

## hook
Cuando vas por la calle con {name}, un segundo de atención hacia ti antes de que la correa se tense cambia por completo el paseo.

## why
Los perros responden a los estímulos que capturan su interés. Si aprende que mirarte es más gratificante que lanzarse hacia adelante, elegirá conectar contigo de forma voluntaria.

## steps
1. En cuanto {name} reduzca la velocidad o gire una oreja hacia ti, di su nombre con voz suave.
2. Espera a que sus ojos busquen los tuyos sin tirar de la correa.
3. Marca ese instante con tu palabra de premio y dale un trozo de comida junto a tu pierna.

## animation
- alt: Animación del giro de cabeza y contacto visual
- caption: El momento exacto de marcar la mirada

## example
### La esquina concurrida
Al doblar la esquina de la panadería con {name}, aparece una persona caminando deprisa. Antes de que la correa se estire, te detienes con calma. Dices su nombre una sola vez. {name} gira la cabeza, te mira y recibe su premio mientras la persona pasa a tres metros.

## compare
### do
Frena tu propio paso y espera a que la decisión de mirarte nazca del perro.
### dont
No des tirones ni repitas su nombre en ráfaga; si no responde, aumenta la distancia con calma.

## video
- alt: Demostración en vídeo del ejercicio de atención
- caption: Cómo construir la mirada voluntaria en la calle

## tip
Prueba hoy en tres momentos tranquilos del paseo cuando no haya distracciones cerca.

## takeaways
- Una sola llamada tranquila vale más que diez repeticiones en tensión.
- La atención se premia siempre al lado de tu pierna.

## images
### sample-diagram.png
- alt: Esquema de la zona de calma y distancia de seguridad
- caption: La distancia adecuada permite que el perro pueda pensar y elegir

### sample-scene.png
- alt: Persona paseando con perro relajado en la acera
- caption: Correa floja formando una U entre la mano y el arnés
```

### Worked Mission Example

#### `missions/sample-loose-walk/mission.yaml`
```yaml
id: sample-loose-walk
technique: loose-leash
reps: 3
trains:
  - kind: node
    id: walk-distraction
problems:
  - id: pulls-ahead
    practise:
      kind: node
      id: walk-distraction
```

#### `missions/sample-loose-walk/es.md`
```markdown
# Paseo en U

## target
Completar tres tramos de 20 metros manteniendo la correa holgada.

## success
{name} camina al paso sin tensar la correa y se detiene cuando tú te detienes.

## problems
### pulls-ahead
- label: Se adelanta y tensa la correa
- reassure: Es muy habitual en zonas con olores nuevos.
- cause: La anticipación olfativa acelera su marcha.
- c1: Detente como un poste sin dar ningún tirón.
- c2: Espera a que destense por iniciativa propia.
- easier: Reduce el tramo a diez pasos antes de premiar.
- alt: Perro esperando relajado
- caption: Parada suave ante la tensión

## general
- reassure: No pasa nada si hoy el paseo ha sido más corto.
- cause: El exceso de estímulos agota la concentración.
- c1: Termina con unos minutos de olfateo tranquilo en una zona verde.
- easier: Elige una calle con menos tránsito mañana.
- alt: Sesión corta
- caption: Calma y descanso
```

### Worked Shop Example

#### `shop/categories/sample-collares/category.yaml`
```yaml
id: sample-collares
subcategories:
  - sample-arneses
```

#### `shop/categories/sample-collares/es.md`
```markdown
# Collares y arneses

## description
Material ergonómico y cómodo para pasear sin tensiones innecesarias.
```

#### `shop/subcategories/sample-arneses/subcategory.yaml`
```yaml
id: sample-arneses
products:
  - sample-arnes-antitiro
```

#### `shop/subcategories/sample-arneses/es.md`
```markdown
# Arneses en Y

## description
Arneses diseñados para respetar el movimiento natural de los hombros y el cuello.
```

#### `shop/products/sample-arnes-antitiro/product.yaml`
```yaml
id: sample-arnes-antitiro
source: manual
urls:
  es: https://example.com/arnes-antitiro
price: 34,95 €
priceCheckedAt: 2026-03
image: arnes.png
```

#### `shop/products/sample-arnes-antitiro/es.md`
```markdown
# Arnés ergonómico en Y

## description
Arnés en forma de Y con anilla frontal y dorsal para un paseo equilibrado y sin presión en la tráquea.
```

---

## 8. Agent Checklist

Before completing an edit or adding new content:
- [ ] All IDs are lowercase kebab-case and unique.
- [ ] `pack.yaml` lists `"es"` and all other languages present.
- [ ] Every item has an `es.md` file with all required sections.
- [ ] No raw HTML tags are present in any Markdown file.
- [ ] All image references are simple filenames inside `media/` or known art names.
- [ ] YouTube IDs are exactly 11 characters.
- [ ] Every Lesson and Node is listed in a World's `stretches` or explicitly marked as library/home.
- [ ] Every Product has an HTTPS buy link under `urls.es`.
- [ ] Subcategories belong to a Category and Products belong to a Subcategory.
- [ ] Run `npm run content:validate -- --channel beta` and ensure zero errors.
