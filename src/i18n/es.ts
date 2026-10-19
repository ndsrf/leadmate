/** Spanish text catalog, the only language shipped and the fallback for every other one. */
export const es = {
  'app.title': 'LeadMate',
  'hud.marker': 'Marcar',
  'hud.joystick': 'Mover',
  'hud.loading': 'Cargando…',
  'hint.taut': 'La correa se tensa: frena para que el perro vuelva a tu lado.',
  'hint.rigid': 'Tirón rígido: no tires del perro, detente y espera.',
  'pause.title': 'Pausa',
  'pause.resume': 'Continuar',
  'results.title': 'Resultados del paseo',
  'results.duration': 'Duración',
  'results.seconds': 's',
  'results.slack': 'Correa floja',
  'results.taut': 'Correa tensa',
  'results.pull': 'Tirón rígido',
  'results.markerAccuracy': 'Precisión del marcador',
  'results.markerAccuracyNone': 'Sin acierto',
  'results.ms': 'ms',
  'results.hits': 'Aciertos',
  'results.misses': 'Fallos',
  'results.reactive': 'Marcadores reactivos',
  'results.missed': 'Oportunidades perdidas',
  'results.checkIns': 'Miradas premiadas',
  'results.marks': 'Marcas usadas',
  'results.seed': 'Semilla',
  'results.playAgain': 'Jugar de nuevo',
  'error.loadFailed': 'No se pudo cargar la simulación.',
  'error.retry': 'Reintentar',
} as const;

export type TextKey = keyof typeof es;
export type Catalog = Partial<Record<TextKey, string>>;
