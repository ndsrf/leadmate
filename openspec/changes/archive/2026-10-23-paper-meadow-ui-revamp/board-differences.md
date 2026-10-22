# Intentional differences from the Paper Meadow boards

Source: https://claude.ai/artifact/4hGN8N3SWTKZ3CLbjjJMrP (boards 00–17). Accepted as is on 2026-10-23 (task 5.3). Compared on copy only, from `src/i18n/es.ts` and the keys each screen uses; layouts were not compared pixel by pixel.

## Left out on purpose (design.md §8)

- **Breed step:** the funnel has no breed picker; the board's 3-step setup (breed, weight and equipment, coat and name) is not reproduced.
- **Walk Diary calendar:** not built. The Streak chip is restyled but keeps today's behavior and does not navigate to a Diary.
- **Plus copy:** the paywall has no feature list and no `[PRECIO]` line.
- **Splash tagline:** the board shows two taglines; the app shows only "Preparando el paseo…" (design.md §6).

## Spanish copy that differs (the app's wording is kept)

| Where | Board | App |
|---|---|---|
| Paywall title | Prueba LeadMate Plus siete días | Prueba gratis 7 días |
| Paywall dismiss | Quizá luego | Quizá más tarde |
| Paywall reassurance | Lo básico sigue siendo gratis… hoy y siempre | Puedes seguir jugando igualmente |
| Register title | Guarda vuestro progreso | Guarda tu progreso |
| Register dismiss | Ahora no, seguir sin cuenta | Ahora no |
| Account banner | Crea una cuenta cuando quieras. | Crea una cuenta para no perder el progreso de tu perro. |
| Rusty title | Perro oxidado / Hace tiempo que no paseáis | Tu perro está oxidado |
| Rusty warm-up | Calentar, "dos minutos" | Calentar (40 s), plus a Saltar button |
| Locked node | Bloqueado | Bloqueada |
| Locked hint | Se abre al terminar «X» | Primero completa: |
| Locked world | Termina «Umbral final» en el mundo 1… | Completa el mundo anterior para abrir este. |
| World names | Hogar y Umbrales, La Acera Tranquila, Navegación Urbana, Ruedas Veloces | Casa y umbrales, La calle tranquila, Rutas urbanas, Ruedas rápidas y excitación |
| Node names | Saludo en la puerta, Sentarse al timbre, Salir sin tirar… | El ritual del arnés, La alfombra del timbre… |
| Progress noun | "3 de 5 paseos" | "Lecciones completadas" |
| Primer sections | En la vida real / En el simulador | Manejo real del perro / Simulación con el perro virtual |
| Checkpoint | Chequeo rápido; "Eso es." / "Casi" | Pregunta rápida; "Pregunta previa: acertaste / repasa la teoría" |
| Debrief | Paseo completado, Seguir al mapa, Repetir paseo, "puntos de manejo" | Resultados del paseo, Continuar, Jugar de nuevo, "Puntuación del paseo … de 1000" |
| Practice tip | Para practicar hoy | Para practicar en la vida real |
| Strong pull | Tirón fuerte | Tirón rígido |
| Daily result | Nuevo mejor, Seguir, Repetir el Paseo del Día | ¡Nueva mejor puntuación de hoy!, Volver, Repetir |
| Unlock card | Un mundo nuevo se abre / Ver el mapa | Mundo desbloqueado |
| Equipment | Collar | Collar plano |
| Timer off | Sin | Sin límite |
| HUD call button | Vamos / Déjalo | `hud.cue` = Llamar |

The board's own string catalog (board 16) gives `paywall.later` as "Quizá luego", so the app's "Quizá más tarde" differs from the board's catalog too.

## Board content that contradicts what is built (not implemented)

- **Trigger profile:** the board has a multi-select of 10 triggers plus pull and recovery questions; the app rates 6 kinds (children, bicycles, dogs, skateboards, food, other) as Nunca / Un poco / A menudo / Mucho.
- **Diagnostic:** the board has a 15 s "Marca cuando te mire" minigame with ear, tail and gaze cues; the app has a reaction-time "tap when green" test.
- **Diagnostic card:** the board shows Reactividad, Tirón de correa and Recuperación with a world-by-world plan and "Empezar mi plan"; the app shows a reaction-time band, "Tu plan de paseo" and "Continuar".
- **Two dogs on sign-in:** the board offers "Mantener los dos perfiles" and deletes nothing; the app keeps one dog and backs the other up for 30 days.
- **Settings:** the board has an ES/EN switch, a Reduce motion toggle, an Account row and a voice pack; the app is Spanish-only and follows the system reduced-motion setting. The app adds equipment, reactivity, coat, custom call recording and the Reset section in danger style.

## Board states with no matching copy in the app

Offline screen and toast, exit-walk confirmation ("¿Salir del paseo?"), empty diary, media empty state.
