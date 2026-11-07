# Proposal

## Why

La lección "En casa se descansa" habla del rincón seguro pero no dice qué tamaño ni qué lugar es el mejor, ni por qué no conviene darle la casa entera al perro. Esa base ayuda a todos los perros y es la que necesita el contenido de soledad que llegará después (`add-alone-concern`).

Además, el mundo 2 va a crecer (Home Stretches personalizados más los Stretches de umbrales, y pronto el de soledad) y mezcla lo que el usuario declaró como problema con contenido general de casa. Separarlos en el mapa lo hace más fácil de recorrer sin tocar la cadena de mundos.

## What Changes

- Ampliar la lección `theory-home-rest` (solo `es.md`; no tiene versión en inglés) con:
  - el mito de la libertad total: más metros significan más vigilancia, más riesgos y menos control higiénico;
  - el criterio de tamaño del espacio: que pueda ponerse de pie, girar 360° y tumbarse de lado estirado;
  - dónde ponerlo: zona tranquila, sin pasillos de mucho tráfico.
  Revisar la comparación do/dont y las dos ilustraciones para que sigan encajando.
- Partir el mundo 2 en **dos secciones en el mapa**, sin crear un mundo nuevo:
  - **"Para tu perro"**: los Home Stretches de las preocupaciones declaradas, en el orden del plan personal.
  - **"Más cosas de casa"**: los Stretches fijos de umbrales (Harness Ritual, Doorbell Mat, Poste practice).
- El mundo 2 sigue siendo un solo mundo: no cambian `worldNumber`, `unlockedBy`, `FIRST_WALKING_WORLD` ni los escenarios, y no se renumera nada.
- Cuando "Para tu perro" está vacía, la sección no se muestra.

Fuera de alcance: la preocupación `alone`, su Stretch y la tarjeta de pregunta inicial (van en `add-alone-concern`); cualquier cambio de reglas de desbloqueo o de finalización del mundo.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `world-map-screen`: el mundo 2 se muestra en dos secciones, "Para tu perro" y "Más cosas de casa", y oculta la primera cuando está vacía.
- `home-behaviour-training`: los Home Stretches de World 2 se agrupan en la sección "Para tu perro" y los Stretches de umbrales en "Más cosas de casa"; el orden y la pertenencia al mundo no cambian.
- `theory-lessons`: la lección "En casa se descansa" cubre el tamaño, el lugar y el mito de la libertad total del espacio de descanso.

## Impact

- Contenido: `content/beta/lessons/theory-home-rest/es.md` (y después promoción a `stable`), posibles ajustes de imágenes.
- Código: `src/shell/screens/WorldMapScreen.tsx` y `src/shell/mapModel.ts` (agrupar en secciones), textos en `src/i18n/`.
- Specs: los tres anteriores. Sin cambios de modelo de datos ni de versión del registro.
- Riesgo bajo: es presentación y contenido; no toca el progreso ni el desbloqueo.
