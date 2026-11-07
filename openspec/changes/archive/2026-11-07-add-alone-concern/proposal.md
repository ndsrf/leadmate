# Proposal

## Why

Muchos dueños de cachorros y perros jóvenes tienen perros que lloran, rompen cosas o no toleran quedarse solos, pero el onboarding solo deja elegir tres preocupaciones principales y hoy no existe ninguna sobre soledad. Queremos ofrecer un curso de soledad y espacios seguros solo a quien lo necesita, y preguntarlo cuando el usuario ya está dentro de la app, no en el onboarding.

## What Changes

- Añadir una sexta preocupación de casa, `alone` ("quedarse solo"), con su Stretch en el mundo 2: Lección(es), Nodo (minijuego de elegir la acción, p. ej. "¿abro o no abro?") y una Misión de varios días que recoge el protocolo paso a paso.
- Contenido basado en el curso "Dominio de la soledad y espacios seguros": psicología del espacio reducido, parque más transportín, protocolo sin fuerza (puerta abierta, distancia, micro-cierre con la señal de liberación), rutina previa y gestión del llanto, y distinción entre frustración y pánico.
- **Tarjeta de pregunta inicial** en la sección "Para tu perro" del mundo 2, mostrada una sola vez: "¿Cómo lleva {name} quedarse solo en casa?" con cuatro respuestas (muy bien / a veces llora o se inquieta / mal: llora, rompe cosas, ladra / aún no lo sé).
  - La respuesta se traduce al nivel 1 a 3 de preocupación que ya existe; "muy bien" no crea preocupación y "aún no lo sé" deja el Stretch disponible en "Otros comportamientos de casa".
  - Responder no cuenta como progreso: sin estrellas, racha ni entrada en el Diario.
  - Se guarda que ya se preguntó, para no repetir la tarjeta; se sincroniza con la cuenta.
  - El Stretch se puede activar después desde "Otros comportamientos de casa".
- Ajustes de seguridad del contenido:
  - suavizar o retirar el "tensión vertical hacia abajo con la correa" de la Lección 3.2, incompatible con el método sin fuerza;
  - poner la nota de pánico y cuándo parar **antes** del protocolo, como ya se hace con la nota de ayuda profesional en los mordiscos;
  - límites de tiempo y de edad para la regla de no abrir durante el llanto (un cachorro pequeño no puede esperar 45 minutos).
- Decisión de alcance: un solo Stretch por preocupación, como el resto de Home Behaviours; el paso a paso vive en la Misión.

Depende de `home-rest-safe-space-and-world-two-sections` (secciones del mapa y lección ampliada), ya completada: la tarjeta va directamente en "Para tu perro".

Fuera de alcance: un mundo nuevo, renumerar mundos, cambios en el onboarding o en el límite de tres preocupaciones principales.

## Capabilities

### New Capabilities

- `alone-check`: la tarjeta de pregunta única sobre quedarse solo, sus respuestas, su traducción a nivel de preocupación, la marca de "ya preguntado" y que no cuenta como progreso.

### Modified Capabilities

- `dog-concerns-plan`: la lista de preocupaciones de casa incluye `alone` con nivel 1 a 3 y el plan personal lo ordena como las demás.
- `home-behaviour-training`: el contenido de cada Home Behaviour incluye `alone` (Lección, Nodo y Misión), con la nota de pánico y ayuda profesional primero.
- `account-sync`: la marca de "ya preguntado" y el nivel de `alone` se fusionan al sincronizar (regla nueva en la resolución de conflictos).

## Impact

- Datos: `src/shell/concerns.ts` (`HOME_CONCERNS`), `src/shell/homeBehaviours.ts` (`HOME_BEHAVIOUR_CONTENT`, `REQUIRED_PARTS`), `src/shell/dogRecord.ts` (campo nuevo, subida de versión, migración, fusión de sync).
- UI: `WorldMapScreen.tsx` / `HomeBehavioursSection.tsx` para la tarjeta y la entrada en "Otros"; textos en `src/i18n/`.
- Contenido: nueva lección, nodo y misión en `content/beta/` y promoción a `stable`; regenerar `baseline.generated.ts`.
- Tests: cobertura de contenido de Home Behaviours (`KNOWN_GAPS`), migración del registro y sincronización.
- Riesgo: contenido sensible (ansiedad por separación); conviene la nota de ayuda profesional y revisión del texto antes de publicar.

Nota: `real-world-missions` se retiró de las capacidades modificadas. La Misión de soledad es una Misión de casa normal (`place: home`) y los requisitos "Home Missions" y de check-in ya la cubren; el "varios días" lo aportan el texto del brief y los ciclos de Fix existentes, sin regla nueva.
