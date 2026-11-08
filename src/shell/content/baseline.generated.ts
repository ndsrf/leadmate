// generated from content/stable — do not edit
import type { ContentPack } from './validator';

export const BASELINE_PACK: ContentPack = {
  "pack": {
    "formatVersion": 1,
    "contentVersion": 1,
    "minAppVersion": "1.0.0",
    "languages": [
      "es"
    ],
    "retired": []
  },
  "worlds": {
    "basics": {
      "config": {
        "id": "basics",
        "worldNumber": 1,
        "tier": "free",
        "stretches": [
          [
            {
              "kind": "lesson",
              "id": "theory-named-behaviours"
            },
            {
              "kind": "lesson",
              "id": "theory-dog-as-dog"
            },
            {
              "kind": "lesson",
              "id": "howto-choose-action"
            },
            {
              "kind": "node",
              "id": "dog-as-dog"
            },
            {
              "kind": "mission",
              "id": "mission-dog-as-dog"
            }
          ],
          [
            {
              "kind": "lesson",
              "id": "theory-home-rest"
            },
            {
              "kind": "node",
              "id": "home-rest"
            },
            {
              "kind": "mission",
              "id": "mission-home-rest"
            }
          ],
          [
            {
              "kind": "lesson",
              "id": "theory-calm-first"
            },
            {
              "kind": "node",
              "id": "calm-first"
            },
            {
              "kind": "mission",
              "id": "mission-calm-first"
            }
          ]
        ]
      },
      "text": {
        "es": "# Un perro es un perro\n\n## topics\ntiene nombre, en casa se descansa, primero calma\n"
      }
    },
    "cafe": {
      "config": {
        "id": "cafe",
        "worldNumber": 7,
        "tier": "plus",
        "unlockedBy": "recall",
        "preview": true,
        "nodeCount": 4,
        "stretches": []
      },
      "text": {
        "es": "# Terrazas y Cafeterías\n\n## topics\npermanencia quieto, paso de camareros, relajación en mesa\n"
      }
    },
    "crowds": {
      "config": {
        "id": "crowds",
        "worldNumber": 9,
        "tier": "plus",
        "unlockedBy": "trails",
        "preview": true,
        "nodeCount": 5,
        "stretches": []
      },
      "text": {
        "es": "# Tráfico y Multitudes\n\n## topics\naglomeraciones urbanas, transporte público, ruido intenso\n"
      }
    },
    "home": {
      "config": {
        "id": "home",
        "worldNumber": 2,
        "tier": "free",
        "unlockedBy": "basics",
        "stretches": [
          [
            {
              "kind": "lesson",
              "id": "theory-harness"
            },
            {
              "kind": "lesson",
              "id": "howto-tap-hold"
            },
            {
              "kind": "node",
              "id": "harness-ritual"
            },
            {
              "kind": "mission",
              "id": "mission-harness"
            }
          ],
          [
            {
              "kind": "lesson",
              "id": "theory-doorbell"
            },
            {
              "kind": "node",
              "id": "doorbell-mat"
            },
            {
              "kind": "mission",
              "id": "mission-doorbell"
            }
          ],
          [
            {
              "kind": "lesson",
              "id": "theory-poste"
            },
            {
              "kind": "node",
              "id": "poste-practice"
            },
            {
              "kind": "mission",
              "id": "mission-poste"
            }
          ]
        ]
      },
      "text": {
        "es": "# Casa y umbrales\n\n## topics\npuertas, timbre, escaleras\n"
      }
    },
    "park": {
      "config": {
        "id": "park",
        "worldNumber": 5,
        "tier": "free",
        "unlockedBy": "urban",
        "stretches": [
          [
            {
              "kind": "lesson",
              "id": "theory-long-leash"
            },
            {
              "kind": "lesson",
              "id": "howto-long-leash"
            },
            {
              "kind": "node",
              "id": "park-jogger"
            },
            {
              "kind": "mission",
              "id": "mission-park-jogger"
            }
          ],
          [
            {
              "kind": "lesson",
              "id": "theory-park-mix"
            },
            {
              "kind": "node",
              "id": "park-mix"
            },
            {
              "kind": "mission",
              "id": "mission-park-mix"
            }
          ]
        ]
      },
      "text": {
        "es": "# Ruedas rápidas y excitación\n\n## topics\ncorredores, mezclas con movimiento, calma\n"
      }
    },
    "recall": {
      "config": {
        "id": "recall",
        "worldNumber": 6,
        "tier": "plus",
        "unlockedBy": "park",
        "preview": true,
        "nodeCount": 4,
        "stretches": []
      },
      "text": {
        "es": "# El Parque y la Llamada\n\n## topics\nllamada fiable, distracciones abiertas, juego regulado\n"
      }
    },
    "sidewalk": {
      "config": {
        "id": "sidewalk",
        "worldNumber": 3,
        "tier": "free",
        "unlockedBy": "home",
        "stretches": [
          [
            {
              "kind": "lesson",
              "id": "theory-loose-leash"
            },
            {
              "kind": "lesson",
              "id": "howto-walking"
            },
            {
              "kind": "node",
              "id": "walk-distraction"
            },
            {
              "kind": "mission",
              "id": "mission-walk"
            }
          ],
          [
            {
              "kind": "lesson",
              "id": "theory-blind-corner"
            },
            {
              "kind": "node",
              "id": "blind-corner"
            },
            {
              "kind": "mission",
              "id": "mission-corners"
            }
          ],
          [
            {
              "kind": "lesson",
              "id": "theory-slack-u"
            },
            {
              "kind": "node",
              "id": "slack-u"
            },
            {
              "kind": "mission",
              "id": "mission-u-leash"
            }
          ]
        ]
      },
      "text": {
        "es": "# La calle tranquila\n\n## topics\ndistracciones suaves, esquinas ciegas, pasear en U\n"
      }
    },
    "trails": {
      "config": {
        "id": "trails",
        "worldNumber": 8,
        "tier": "plus",
        "unlockedBy": "cafe",
        "preview": true,
        "nodeCount": 4,
        "stretches": []
      },
      "text": {
        "es": "# Senderos y Naturaleza\n\n## topics\nolores intensos, fauna silvestre, paseos largos en calma\n"
      }
    },
    "urban": {
      "config": {
        "id": "urban",
        "worldNumber": 4,
        "tier": "free",
        "unlockedBy": "sidewalk",
        "stretches": [
          [
            {
              "kind": "lesson",
              "id": "theory-leave-it"
            },
            {
              "kind": "lesson",
              "id": "howto-cues"
            },
            {
              "kind": "node",
              "id": "leave-it-intro"
            },
            {
              "kind": "mission",
              "id": "mission-leave-it"
            }
          ],
          [
            {
              "kind": "lesson",
              "id": "theory-visual-shields"
            },
            {
              "kind": "node",
              "id": "calm-zone-intro"
            },
            {
              "kind": "node",
              "id": "scooter-crossing"
            },
            {
              "kind": "mission",
              "id": "mission-shields"
            }
          ],
          [
            {
              "kind": "lesson",
              "id": "theory-choosing-cue"
            },
            {
              "kind": "node",
              "id": "close-narrow-street-pass"
            },
            {
              "kind": "node",
              "id": "urban-mix"
            },
            {
              "kind": "mission",
              "id": "mission-cue-choice"
            }
          ]
        ]
      },
      "text": {
        "es": "# Rutas urbanas\n\n## topics\ncomida en el suelo, patinetes, cruces urbanos\n"
      }
    }
  },
  "lessons": {
    "body-language": {
      "config": {
        "id": "body-language",
        "kind": "theory",
        "day": 2,
        "images": [
          "body-language-1",
          "body-language-2"
        ],
        "compare": {},
        "animation": "body-language",
        "youtube": {
          "es": "76DSS5xNwtk"
        },
        "steps": 6,
        "takeaways": 4
      },
      "text": {
        "es": "# Leer el lenguaje corporal\n\n## heading\nParece que ladra sin avisar\n\n## hook\nVas por la acera y, de repente, {name} ladra a un perro que pasa por enfrente. Parece que ha salido de la nada: hace un segundo iba olfateando como siempre. Pero casi nunca es así. Antes de ladrar o de lanzarse, tu perro te ha ido avisando con el cuerpo, en silencio. Solo hace falta saber dónde mirar.\n\n## why\nTu perro no te cuenta cómo se siente con palabras, sino con las orejas, la cola, la boca y el peso del cuerpo. Cuando algo le preocupa o le emociona, el cuerpo cambia poco a poco: la boca se cierra, se queda inmóvil, el peso se va hacia delante. Si nada cambia a su alrededor, la emoción sigue subiendo hasta que solo le queda ladrar o tirar. No lo hace por desafiarte: está desbordado, y un perro desbordado no puede aprender. Leerle a tiempo te da lo más valioso del paseo: unos segundos para ayudarle antes de que pase nada.\n\n## steps\n1. En casa, cuando descanse, fíjate en sus orejas, su cola, su boca y su postura. Así es tu perro tranquilo: tu punto de partida.\n2. En el paseo, échale un vistazo cada poco y siempre en el mismo orden: orejas, cola, peso del cuerpo y boca. Bastan dos segundos.\n3. Busca los cambios: la boca se cierra, se queda inmóvil, el peso pasa a las patas delanteras, la cola sube y se pone rígida.\n4. Fíjate también en las señales de calma, gestos con los que pide espacio: bostezar sin sueño, lamerse el hocico, girar la cabeza o sacudirse.\n5. En cuanto veas la primera señal, gana distancia: date la vuelta con calma, cruza la calle o aléjate unos pasos. Si dudas, más distancia.\n6. Cuando vuelva a olfatear o a mirarte con la boca suelta, márcalo con un «bien» suave, que le señala el momento exacto, y dale una golosina.\n\n## example\n### {name} y el perro del parque\nEntráis en el parque y, al fondo, aparece un perro gris. {name} se para en seco: las orejas van hacia delante, la boca se cierra y la cola sube, rígida. Todavía no ha ladrado. Te das la vuelta con calma, le dices «vamos» en voz suave y os alejáis unos veinte pasos, hasta el banco. La primera vez le cuesta despegar la mirada del otro perro. Al poco, la cola baja y se pone a olfatear la hierba: «bien», y una golosina. Desde ahí veis pasar al perro gris sin un ladrido. Otro día quizá podáis estar un poco más cerca.\n\n## compare\n### do\nMirar el cuerpo entero, no solo la cola. Si la cola se mueve pero la boca está cerrada y el cuerpo rígido, gana distancia.\n### dont\nPensar que, como mueve la cola, está contento, y seguir acercándote. Una cola alta, rígida y que se agita deprisa suele ser tensión, no alegría.\n\n## video\n- alt: Vídeo: Lenguaje corporal: entender a tu perro más allá de la cola\n- caption: Lenguaje corporal: entender a tu perro más allá de la cola\n\n## tip\nPrueba hoy: antes de salir, mira a tu perro un minuto mientras descansa. Fíjate en sus orejas, su cola y su boca: así es cuando está tranquilo.\n\n## takeaways\n- Antes de ladrar o tirar, su cuerpo te avisa.\n- Mira siempre en orden: orejas, cola, peso y boca.\n- Una cola que se mueve no siempre es alegría.\n- A la primera señal, más distancia; si se calma, premio.\n\n## images\n### body-language-1\n- alt: Dos dibujos de {name}: a la izquierda, en calma, con la oreja caída, la boca abierta, la cola baja y el peso repartido; a la derecha, en tensión, con la oreja de punta, la boca cerrada, la cola alta y rígida y el peso hacia delante\n- caption: Relajado, todo suelto; tenso, todo rígido y hacia delante\n\n### body-language-2\n- alt: En el parque, lejos de un perro gris, {name} olfatea la hierba junto a su persona con la correa floja\n- caption: Con más distancia, vuelve a olfatear\n\n"
      },
      "files": [
        "media/body-language-1.png",
        "media/body-language-2.png"
      ]
    },
    "calm-leash": {
      "config": {
        "id": "calm-leash",
        "kind": "theory",
        "day": 1,
        "images": [
          "calm-leash-1",
          "calm-leash-2"
        ],
        "compare": {},
        "animation": "calm-leash",
        "youtube": {
          "es": "8Ba10_ycocY"
        },
        "steps": 5,
        "takeaways": 3
      },
      "text": {
        "es": "# Lo básico de un paseo tranquilo\n\n## heading\nUn paseo tranquilo empieza antes de salir\n\n## hook\nCoges la correa y {name} ya da vueltas en la entrada. Abres la puerta, sale como un cohete y los primeros minutos son un tira y afloja: tú intentas frenar y {name} intenta llegar a todo. Al volver os queda menos energía que al salir. No es que tu perro no sepa pasear: el paseo empezó acelerado y nadie le ha enseñado otro ritmo.\n\n## why\nTu perro aprende por lo que le funciona. Si cada vez que salta la puerta se abre, saltar se convierte en la forma de salir. Si cada vez que tira avanzáis, tirar se convierte en la forma de pasear. Además, la excitación se acumula: un perro que sale ya alterado tarda mucho en calmarse y reacciona más a todo lo que encuentra. Por eso los dos primeros minutos marcan el resto del paseo. La buena noticia es que el mismo mecanismo juega a tu favor: si la calma es lo que abre la puerta y lo que os hace avanzar, tu perro la elegirá cada vez más.\n\n## steps\n1. Antes de coger la correa, baja tu propio ritmo: muévete despacio y háblale en voz baja, sin tono de fiesta.\n2. Pon la correa y espera junto a la puerta. Ábrela solo cuando tenga las cuatro patas en el suelo; si se lanza, ciérrala con calma y vuelve a esperar.\n3. Salid a la vez y camina a un paso tranquilo y constante, sin acelerones ni cambios bruscos de dirección.\n4. Deja que la correa cuelgue en forma de J: floja, con la curva cerca de ti. Esa holgura es lo que quieres conservar.\n5. Si la correa se tensa, párate del todo y espera. En cuanto se afloja, seguid andando: ir contigo es lo que os mueve.\n\n## example\n### {name} y la puerta del portal\nSon las ocho y {name} ya gime junto a la puerta del portal. Te pones la chaqueta despacio y le enganchas la correa sin decir nada. Pones la mano en el pomo y {name} salta. Retiras la mano y esperas. A los pocos segundos se sienta, y la puerta se abre. En la acera tira hacia el árbol de la esquina: te paras. {name} mira atrás, la correa se afloja y seguís. El primer día tardáis cinco minutos en llegar a la esquina. Una semana después, apenas uno.\n\n## compare\n### do\nEsperar con la mano en el pomo a que tenga las cuatro patas en el suelo, y abrir entonces. La calma es la llave.\n### dont\nAbrir mientras salta o gime «para que se tranquilice fuera». Así aprende que saltar es lo que abre la puerta.\n\n## video\n- alt: Vídeo: Qué hacer si tu perro tira de la correa\n- caption: Qué hacer si tu perro tira de la correa\n\n## tip\nPrueba hoy: cuenta cuántas veces se tensa la correa en los primeros cinco minutos. No tienes que corregir nada; solo saber de dónde partís.\n\n## takeaways\n- La calma es lo que abre la puerta y os hace avanzar.\n- La correa en J: floja y con la curva cerca de ti.\n- Correa tensa, te paras; correa floja, seguís.\n\n## images\n### calm-leash-1\n- alt: Dos escenas: a la izquierda, una persona y {name} caminan con la correa colgando en forma de J; a la derecha, {name} tira y la correa va recta y tensa\n- caption: Correa en J, sí; correa tensa, no\n\n### calm-leash-2\n- alt: {name} se sienta junto a la puerta mientras su persona espera con la mano en el pomo\n- caption: La puerta se abre cuando hay calma\n\n"
      },
      "files": [
        "media/calm-leash-1.png",
        "media/calm-leash-2.png"
      ]
    },
    "howto-choose-action": {
      "config": {
        "id": "howto-choose-action",
        "kind": "how-to-play",
        "images": [
          "howto-choose-action-1",
          "howto-choose-action-2"
        ],
        "controls": 2
      },
      "text": {
        "es": "# Cómo se juega: elegir la acción\n\n## intro\nEn los minijuegos de casa, tu perro aparece en cada paso de una manera distinta. Tu trabajo es leerlo y tocar la acción que le ayuda. Aquí ves cómo, sobre la pantalla real.\n\n## Control 1\n### Mira a tu perro\nEncima de los botones ves a tu perro y una frase que dice lo que hace, como «Pide que lo cojas» o «Subido al sofá». Fíjate en su cuerpo, sus orejas y su cola.\n- alt: Captura del minijuego del salón: el perro pide que lo cojas y la frase que lo describe está rodeada\n- caption: Lee a tu perro\n\n## Control 2\n### Toca la acción\nAbajo hay cuatro botones, como Ignorar, A su cama, Marcar o Achucharlo. Toca el que le ayuda en ese momento; un toque basta. Si te equivocas, verás cómo reacciona y una pista te dirá qué mirar.\n- alt: Captura del minijuego del salón con los cuatro botones de acción y el botón Ignorar rodeado\n- caption: Tocar la acción que le ayuda\n\n## tip\nNo hay prisa: tienes unos segundos en cada paso. Mira primero y toca después.\n\n"
      },
      "files": [
        "media/howto-choose-action-1.png",
        "media/howto-choose-action-2.png"
      ]
    },
    "howto-cues": {
      "config": {
        "id": "howto-cues",
        "kind": "how-to-play",
        "images": [
          "howto-cues-1",
          "howto-cues-2"
        ],
        "controls": 2
      },
      "text": {
        "es": "# Cómo se juega: las señales\n\n## intro\nAhora tienes botones de señal. Aquí ves dónde están y cuándo usar cada uno.\n\n## Control 1\n### Déjalo\nEn las calles con comida en el suelo tienes el botón Déjalo, la mano abierta. Púlsalo cuando tu perro mira la comida, antes de que llegue a ella.\n- alt: Captura del paseo con el botón Déjalo y comida en el suelo\n- caption: El botón Déjalo\n\n## Control 2\n### Vamos\nCon dos señales, el bocadillo verde dice Vamos: le pide que te siga y se aleje de algo que se mueve rápido. Úsalo con patinetes y bicis.\n- alt: Captura del paseo con el botón Vamos y un patinete acercándose\n- caption: El botón Vamos\n\n## tip\nUna señal a tiempo vale más que dos tarde.\n\n"
      },
      "files": [
        "media/howto-cues-1.png",
        "media/howto-cues-2.png"
      ]
    },
    "howto-long-leash": {
      "config": {
        "id": "howto-long-leash",
        "kind": "how-to-play",
        "images": [
          "howto-long-leash-1",
          "howto-long-leash-2"
        ],
        "controls": 2
      },
      "text": {
        "es": "# Cómo se juega: la correa larga\n\n## intro\nEn el parque la correa mide 3 metros. Se ve igual que la corta, pero tu perro llega mucho más lejos.\n\n## Control 1\n### Más correa\nCon 3 metros tu perro puede alejarse y oler mientras la correa sigue colgando verde. Solo se tensa cuando llega al final.\n- alt: Captura del parque con el perro lejos de la persona y la correa larga colgando floja, rodeada\n- caption: Lejos, pero con la correa floja\n\n## Control 2\n### Frenar a tiempo\nCuando la correa se pone recta y amarilla, aparece el aviso de frenar. Suelta el joystick y haz poste: con 3 metros, el perro llega lanzado al final.\n- alt: Captura del parque con la correa larga tensa y el aviso de frenar arriba, rodeado\n- caption: Frenar cuando la correa se tensa\n\n## tip\nEn el parque, mira más lejos todavía: los corredores llegan rápido.\n\n"
      },
      "files": [
        "media/howto-long-leash-1.png",
        "media/howto-long-leash-2.png"
      ]
    },
    "howto-tap-hold": {
      "config": {
        "id": "howto-tap-hold",
        "kind": "how-to-play",
        "images": [
          "howto-tap-hold-1",
          "howto-tap-hold-2"
        ],
        "controls": 2
      },
      "text": {
        "es": "# Cómo se juega: tocar y mantener\n\n## intro\nEn los minijuegos de casa usas dos gestos: tocar, que ya conoces, y mantener. Aquí ves cada uno sobre la pantalla real.\n\n## Control 1\n### Tocar\nComo en el salón: mira cómo está tu perro y toca la acción que le ayuda. Aquí son Esperar, Llamar, Marcar o la del paso.\n- alt: Captura del ritual del arnés: el perro olfatea el suelo y el botón Llamar está rodeado\n- caption: Tocar la acción que le ayuda\n\n## Control 2\n### Mantener\nEn la práctica del Poste, mantén pulsado el botón para no moverte mientras el perro tira. Suelta solo cuando se haya calmado y la correa afloje.\n- alt: Captura de la práctica del Poste con el botón de mantener pulsado rodeado\n- caption: Mantener para hacer poste\n\n## tip\nMira al perro, no al botón: sus orejas y su cola te dicen cuándo soltar.\n\n"
      },
      "files": [
        "media/howto-tap-hold-1.png",
        "media/howto-tap-hold-2.png"
      ]
    },
    "howto-walking": {
      "config": {
        "id": "howto-walking",
        "kind": "how-to-play",
        "images": [
          "howto-walking-1",
          "howto-walking-2",
          "howto-walking-3",
          "howto-walking-4"
        ],
        "controls": 4
      },
      "text": {
        "es": "# Cómo se juega: pasear\n\n## intro\nDesde ahora paseas por la calle. Estos son los controles del paseo, sobre la pantalla real.\n\n## Control 1\n### El joystick\nArrastra el joystick para caminar. Cuanto más lo alejas del centro, más rápido vas. Suéltalo para pararte.\n- alt: Captura del paseo con el joystick abajo a la izquierda y una flecha de dirección\n- caption: Caminar con el joystick\n\n## Control 2\n### La correa\nLa correa cuelga verde cuando va floja, se pone recta y amarilla cuando se tensa, y roja y más gruesa si se convierte en un tirón rígido.\n- alt: Captura del paseo con la correa recta y tensa entre la persona y el perro, rodeada\n- caption: Correa tensa: recta y amarilla\n\n## Control 3\n### El Poste\nSi sueltas el joystick cuando la correa se tensa, haces poste: aparece un aro claro a tus pies. Espera a que el perro vuelva y la correa se afloje.\n- alt: Captura del paseo con el joystick suelto y el aro de poste a los pies de la persona, rodeado\n- caption: Hacer poste\n\n## Control 4\n### Olfatear\nCuando tu perro ha caminado bien, aparece un rato el botón Olfatear, con un aro que se va vaciando. Tócalo antes de que se acabe: oler es su premio.\n- alt: Captura del paseo con el botón Olfatear resaltado\n- caption: Dejar olfatear\n\n## tip\nPrueba los controles sin prisa: el primer paseo es para aprender, no para puntuar.\n\n"
      },
      "files": [
        "media/howto-walking-1.png",
        "media/howto-walking-2.png",
        "media/howto-walking-3.png",
        "media/howto-walking-4.png"
      ]
    },
    "marking-rewarding": {
      "config": {
        "id": "marking-rewarding",
        "kind": "theory",
        "day": 4,
        "images": [
          "marking-rewarding-1",
          "marking-rewarding-2"
        ],
        "compare": {},
        "animation": "marking-rewarding",
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Marcar y recompensar\n\n## heading\nLe das premios, pero no sabe por qué\n\n## hook\n{name} se sienta en el bordillo y te parece perfecto. Buscas la golosina en el bolsillo, la sacas, te agachas… y cuando llega a su boca ya se ha levantado para olfatear una farola. Le has premiado, sí, pero para {name} el premio ha llegado mientras olía la farola. Has pagado un momento distinto del que querías.\n\n## why\nTu perro relaciona el premio con lo que hacía justo antes de recibirlo, en el último segundo. Sacar una golosina tarda más que eso, así que muchas veces pagas otra cosa. Marcar resuelve el problema: marcar es decir una palabra corta, siempre la misma, en el instante exacto en que hace lo que te gusta. Aquí usamos un «bien» suave. Significa «eso, justo ahora» y le avisa de que el premio está en camino, así que el premio puede llegar un poco después sin perder el sentido. Pero la palabra solo vale si cumple lo que promete: si dices «bien» y no llega nada, deja de significar algo.\n\n## steps\n1. En casa, antes del paseo, di «bien» en voz suave y dale justo después una golosina pequeña y blanda. Repítelo diez veces, sin pedirle nada.\n2. Elige una sola conducta para el paseo de hoy: que te mire, que la correa cuelgue floja o que se siente en el bordillo.\n3. Di «bien» en el instante en que ocurre, con las manos quietas. Primero la palabra; la mano no va al bolsillo hasta después.\n4. Paga enseguida, en uno o dos segundos: una golosina junto a tu pierna, seguir andando o dejarle olfatear. Cada «bien» lleva su premio.\n5. Si se te escapa el momento, no marques tarde: espera a la siguiente vez. Pocas marcas a tiempo enseñan más que muchas a destiempo.\n\n## example\n### {name} y el árbol de la parada\nVais por la acera hacia la parada del autobús, con la correa floja. {name} olfatea el alcorque de un árbol y levanta la cabeza hacia ti, pero cuando abres la boca ya ha vuelto al suelo: te callas y seguís. Medio minuto después te mira otra vez. En ese mismo instante dices «bien», con las manos quietas, y luego sacas una golosina y se la das junto a tu pierna. A los pocos pasos te vuelve a mirar. Hoy cazas cuatro miradas antes de llegar a la parada; mañana, alguna más.\n\n## compare\n### do\nDecir «bien» con las manos quietas en el instante justo y, solo después, sacar la golosina. La palabra marca el momento; el premio puede tardar un segundo.\n### dont\nMeter la mano en el bolsillo antes de marcar. {name} acaba pendiente de tu mano y no de lo que hace, y el «bien» llega tarde.\n\n## tip\nPrueba hoy: en los primeros cinco minutos del paseo, di «bien» cada vez que te mire y paga justo después. Cuenta cuántas miradas cazas.\n\n## takeaways\n- «Bien» significa «eso, justo ahora».\n- Primero la palabra; después, la mano y el premio.\n- Cada «bien» lleva su premio, siempre.\n- Si llegas tarde, no marques: espera la siguiente vez.\n\n## images\n### marking-rewarding-1\n- alt: Tres escenas numeradas unidas por flechas: {name} se sienta; su persona, de pie, dice una palabra; la persona, agachada, le da una golosina\n- caption: Primero la conducta, luego el «bien», después el premio\n\n### marking-rewarding-2\n- alt: En la acera, junto a un árbol, {name} camina con la correa floja y levanta la cabeza hacia su persona, que le dice una palabra\n- caption: Te mira: «bien» en ese mismo instante\n\n"
      },
      "files": [
        "media/marking-rewarding-1.png",
        "media/marking-rewarding-2.png"
      ]
    },
    "puppy-bite": {
      "config": {
        "id": "puppy-bite",
        "kind": "theory",
        "images": [
          "body-language-1",
          "theory-dog-as-dog-1"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Inhibición del mordisco y dientes de aguja\n\n## heading\nDientes afilados y manos en juego\n\n## hook\nEstás jugando con {name} en el suelo y, de repente, te clava esos dientes finos como agujas en los dedos o en la manga. Duele de verdad. Dices «ay» o intentas apartar la mano rápido, pero {name} se excita todavía más y salta a morder otra vez como si fuera una presa que escapa.\n\n## why\nMorderlo todo es la forma natural en que un cachorro explora el mundo y alivia el dolor de encías al cambiar la boca. No muerde por maldad ni por dominar: muerde porque está aprendiendo cuánta fuerza tienen sus mandíbulas. En la camada, sus hermanos chillan y dejan de jugar si aprieta demasiado. Si mueves las manos rápido, gritas o forcejeas, conviertes tus dedos en un juguete interactivo. La clave es enseñarle dos cosas: que la piel humana es hipersensible y que la diversión se acaba al instante si los dientes tocan la piel.\n\n## steps\n1. Ten siempre mordedores y juguetes adecuados a mano en las zonas donde pase el día. Cuando se acerque con ganas de morder, ofrécele el juguete antes de que toque tu piel.\n2. Si sus dientes rozan tu mano o tu ropa, quédate totalmente inmóvil, sin hablar y sin forcejear. Mover la mano rápido despierta su instinto de persecución.\n3. Si continúa mordiendo con excitación, aplica un «tiempo fuera inverso»: levántate con calma, dale la espalda o sal de la habitación cerrando la puerta durante 20 a 30 segundos.\n4. Practica el juego del intercambio: si coge algo prohibido (como una zapatilla), jamás le abras la boca a la fuerza. Ofrécele un premio delicioso o su juguete favorito a cambio.\n5. Cuando elija morder y masticar su propio juguete tranquilamente, felicítalo con un «bien» suave y déjalo concentrarse en su juguete.\n\n## example\n### {name} y las zapatillas en el pasillo\nVas caminando por el pasillo y {name} se lanza al bajo de tus pantalones con sus dientes de aguja. En vez de sacudir la pierna o reñirle, te detienes por completo como una estatua. {name} suelta la tela al ver que no se mueve. En ese instante exacto sacas un mordedor de cuerda de tu bolsillo y lo mueves por el suelo. {name} muerde la cuerda con ganas. Dices «bien» y juegas dos minutos con el mordedor. Has enseñado qué se muerde sin enfados.\n\n## compare\n### do\nQuedarte inmóvil si muerde piel o ropa, redirigir siempre a sus mordedores y salir de la estancia con calma si sube la excitación.\n### dont\nApartar las manos rápido, gritar, empujarlo o abrirle la mandíbula a la fuerza. Eso solo aumenta la excitación y el forcejeo.\n\n## tip\nPrueba hoy: reparte tres mordedores seguros por el salón y mantén las manos relajadas como una estatua la próxima vez que intente jugar con tus dedos.\n\n## takeaways\n- La piel humana y la ropa jamás son juguetes.\n- El tiempo fuera inverso enseña que morder interrumpe la atención.\n- Intercambiar por juguetes mejores previene la protección de recursos.\n- Sin castigos físicos: el cachorro necesita aprender a usar su boca con calma.\n\n## images\n### body-language-1\n- alt: Un cachorro muerde un mordedor blando de cuerda mientras la persona mantiene las manos relajadas y quietas\n- caption: Redirigir a juguetes adecuados antes de que toque la piel\n\n### theory-dog-as-dog-1\n- alt: La persona se levanta con calma y da la espalda con los brazos cruzados mientras el cachorro se sienta a mirar\n- caption: El tiempo fuera inverso: morder acaba el juego\n"
      },
      "files": [
        "media/body-language-1.png",
        "media/theory-dog-as-dog-1.png"
      ]
    },
    "puppy-sound": {
      "config": {
        "id": "puppy-sound",
        "kind": "theory",
        "images": [
          "theory-calm-first-1",
          "theory-home-rest-1"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Desensibilización sonora\n\n## heading\nSonidos de casa sin miedo\n\n## hook\nPones la aspiradora, suena el timbre de la puerta o retumba un trueno a lo lejos y {name} se sobresalta, corre a esconderse bajo la mesa o empieza a ladrar con alarma. Si no se trabaja a tiempo, estos pequeños sustos pueden convertirse en fobias sonoras graves durante la edad adulta.\n\n## why\nDurante los primeros meses de vida, los cachorros atraviesan su ventana crítica de socialización y habituación. Todo estímulo sonoro que experimenten asociado a calma y sensaciones agradables pasará a formar parte de su normalidad cotidiana. Si el volumen supera su umbral de tolerancia y siente pánico, se produce sensibilización (cada vez tendrá más miedo). La desensibilización sistemática consiste en presentar el sonido a un volumen mínimo, subumbral, mientras el cachorro disfruta de algo muy rico o descansa, subiendo la intensidad solo cuando el nivel anterior resulta completamente indiferente.\n\n## steps\n1. Elige un sonido cotidiano que suela alterarle: el timbre de casa, la aspiradora, fuegos artificiales o una tormenta, preparado en un móvil o altavoz.\n2. Coloca el sonido al volumen más bajo posible, casi imperceptible, en otra habitación o a buena distancia mientras {name} descansa o come de una alfombrilla de lamer.\n3. Observa su lenguaje corporal: si continúa comiendo o descansando sin levantar las orejas ni tensar el cuerpo, el volumen es el correcto.\n4. Realiza sesiones muy cortas de apenas dos o tres minutos y apaga el sonido antes de que pierda el interés por su comida.\n5. Aumenta el volumen muy poco a poco en días sucesivos. Si en algún momento se tensa o deja de comer, baja el volumen de inmediato al nivel anterior.\n\n## example\n### {name} y el timbre del teléfono\nCada vez que suena el timbre {name} da un salto de alarma. Preparas una grabación del sonido del timbre en tu teléfono con el volumen casi al mínimo. Le das a {name} un hueso prensado o un juguete con paté en su cama. Mientras mastica con tranquilidad, reproduces el sonido una vez a volumen bajo. {name} mueve una oreja pero sigue masticando sin levantarse. Dices «bien» con voz pausada. Repites dos veces y guardas el teléfono. Al día siguiente podrás subir un único punto de volumen.\n\n## compare\n### do\nTrabajar a volumen mínimo e imperceptible, asociando el sonido a masticación o descanso placentero.\n### dont\nExponerlo al ruido fuerte de golpe pensando que «se acostumbrará». La inundación genera miedo crónico y pánico.\n\n## tip\nPrueba hoy: pon una pista de tormenta o aspiradora en tu teléfono al volumen más bajo posible durante dos minutos mientras tu cachorro disfruta de su cena.\n\n## takeaways\n- Trabajar siempre por debajo del umbral de alerta del cachorro.\n- Emparejar el estímulo sonoro con comida rica o masticación relajante.\n- Si se asusta o deja de comer, reduce el volumen y amplía la distancia.\n- Pocos minutos diarios durante la etapa de cachorro previenen fobias adultas.\n\n## images\n### theory-calm-first-1\n- alt: Un cachorro tumbado sobre una alfombra mordisqueando un juguete relleno mientras un altavoz reproduce sonidos a bajo volumen\n- caption: Exposición subumbral emparejada con calma y masticación\n\n### theory-home-rest-1\n- alt: Gráfico que muestra la distancia y el volumen bajo manteniendo al cachorro en la zona verde de calma\n- caption: Bajar el volumen y aumentar la distancia si aparece alerta\n"
      },
      "files": [
        "media/theory-calm-first-1.png",
        "media/theory-home-rest-1.png"
      ]
    },
    "puppy-vet": {
      "config": {
        "id": "puppy-vet",
        "kind": "theory",
        "images": [
          "calm-leash-1",
          "body-language-2"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Manipulación corporal y veterinario\n\n## heading\nTocar patas, orejas y boca con calma\n\n## hook\nLlega el momento de cortarle las uñas, limpiarle las orejas tras un paseo o ponerle una vacuna y {name} se revuelve, aparta las patas con fuerza e intenta zafarse desesperadamente. Sujetarlo a la fuerza solo genera desconfianza y hace que la próxima visita al veterinario sea una auténtica batalla.\n\n## why\nEl cuidado cooperativo enseña al cachorro que la manipulación física humana es predecible, respetuosa y siempre trae consecuencias agradables. Los perros no nacen sabiendo tolerar que les sujeten las almohadillas, les abran la boca o les miren dentro de los oídos. Si forzamos la inmovilización, aprenden a defenderse con gruñidos o mordiscos por miedo. Al desglosar el contacto en toques brevísimos de uno o dos segundos premiados de inmediato, el cachorro aprende a relajarse y colaborar de forma voluntaria.\n\n## steps\n1. Empieza siempre en momentos de relajación, cuando {name} esté en reposo y en calma, nunca en pleno juego o excitación.\n2. Toca suavemente una de sus patas delanteras durante uno o dos segundos. Suelta, di «bien» en tono tranquilo y entrega un premio delicioso.\n3. Avanza hacia las orejas y el contorno de los ojos: acaricia con suavidad y levanta el pabellón de una oreja un instante sin apretar. Marca con «bien» y premia.\n4. Acostumbra su hocico a la revisión veterinaria posando tu mano sobre su morro y levantando suavemente un labio para ver los colmillos antes de premiar.\n5. Practica la mesa de exploración en casa sobre una esterilla antideslizante con toques breves y premios ricos; si retira la pata, respeta su pausa.\n\n## example\n### {name} y las patitas limpias\nTras un paseo en el que se ha manchado, te sientas con {name} en la alfombra con una toalla suave y premios cortados pequeños. En lugar de agarrar su pata y frotar con prisa, apoyas la toalla sobre su pata un segundo, marcas «bien» y le das un trozo de pavo. {name} se queda en calma esperando el siguiente trozo. Pasas la toalla por la otra pata, marcas y premias. En tres minutos las cuatro patas están secas y limpias sin un solo tirón ni forcejeo.\n\n## compare\n### do\nHacer toques brevísimos en patas, ojos, orejas y hocico, marcar con «bien» y practicar revisiones en mesa antideslizante con premios ricos.\n### dont\nInmovilizar al cachorro a la fuerza mientras protesta. Eso le enseña que el contacto humano es una trampa de la que huir.\n\n## tip\nPrueba hoy: toca con suavidad las cuatro almohadillas y el contorno del hocico, un segundo por zona, premiando tras cada toque.\n\n## takeaways\n- Contacto breve y predecible: un par de segundos en patas, ojos, orejas y boca antes de marcar y premiar.\n- Cuidado cooperativo: si se incomoda, dale espacio y reduce la dificultad.\n- Simulacros de mesa y tacto de hocico preparan las revisiones veterinarias sin miedo ni forcejeos.\n- Las visitas sociales a la clínica veterinaria crean asociaciones positivas para toda la vida.\n\n## images\n### calm-leash-1\n- alt: Una persona sujeta con delicadeza la punta de la pata delantera de un cachorro mientras le ofrece un premio con la otra mano\n- caption: Toques breves de dos segundos seguidos de premio\n\n### body-language-2\n- alt: El cachorro subido tranquilamente en una superficie elevada con una esterilla antideslizante recibiendo mimos del veterinario\n- caption: Visitas veterinarias sociales y divertidas\n"
      },
      "files": [
        "media/body-language-2.png",
        "media/calm-leash-1.png"
      ]
    },
    "smile-leash": {
      "config": {
        "id": "smile-leash",
        "kind": "theory",
        "day": 3,
        "images": [
          "smile-leash-1",
          "smile-leash-2"
        ],
        "compare": {},
        "animation": "smile-leash",
        "youtube": {
          "es": "VgnWd0Yu_Rk"
        },
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# La correa en sonrisa\n\n## heading\nCamina bien y nadie se lo dice\n\n## hook\nYa sabes pararte cuando la correa se tensa. Pero fíjate en el resto del paseo: {name} camina diez metros a tu lado, con la correa colgando, y tú vas pensando en tus cosas. Nadie le dice nada. En cuanto tira, en cambio, os paráis y toda tu atención va hacia {name}. Sin querer, los mejores momentos pasan sin premio.\n\n## why\nTu perro repite lo que le sale a cuenta. Pararte cuando tira hace que tirar no funcione, pero no le enseña dónde está lo bueno. Para eso hay que pagar lo que quieres. La «sonrisa» se ve enseguida: la correa cuelga en una curva suave, más baja que tu mano y que el arnés, porque ninguno de los dos tira. Da igual que la curva quede más cerca de ti, como la J del primer día: lo que cuenta es que cuelga. Y el sitio del premio importa tanto como el momento. Si la golosina aparece siempre junto a tu pierna, ese se convierte en el mejor lugar del paseo.\n\n## steps\n1. Antes de salir, llena el bolsillo del lado de tu perro con golosinas pequeñas y blandas, del tamaño de un garbanzo.\n2. Mientras camináis, mira la correa de vez en cuando. Si cuelga en sonrisa, di «bien» en voz suave: esa palabra le señala el momento exacto que te gusta.\n3. Lleva la golosina a la costura de tu pantalón, a la altura de su boca, y deja que venga a cogerla junto a tu pierna.\n4. Al principio paga mucho: una sonrisa cada pocos pasos. Cuando la mantenga sin esfuerzo, espacia los premios poco a poco, sin quitarlos de golpe.\n5. Si la sonrisa se convierte en una línea recta, párate como el primer día. Cuando vuelva a colgar, seguid andando y paga la siguiente sonrisa.\n\n## example\n### {name} en la calle del mercado\nEs sábado por la mañana y vais por la calle del mercado. La correa cuelga en sonrisa y {name} olfatea el bordillo a tu lado. Dices «bien» y le llevas una golosina a la costura del pantalón; se la come y te mira. Cuatro pasos después, otra sonrisa, otro «bien». Junto a la frutería ve una paloma, la correa se pone recta y te paras. Tarda un poco, pero se gira hacia ti y la correa vuelve a colgar. Seguís, y la siguiente sonrisa se paga junto a tu pierna. A los diez minutos, {name} pasa más rato a tu lado que delante de ti.\n\n## compare\n### do\nLlevar la golosina a tu pierna, a la altura de su boca, para que venga a cogerla a tu lado. Así el mejor sitio del paseo está junto a ti.\n### dont\nDarle el premio con el brazo estirado hacia delante, o dejarlo caer por delante de ti. Así aprende que lo bueno está delante y se adelanta a buscarlo.\n\n## video\n- alt: Vídeo: Consejos para mejorar el paseo con correa\n- caption: Consejos para mejorar el paseo con correa\n\n## tip\nPrueba hoy: mete diez golosinas en el bolsillo al salir y gástalas todas en sonrisas durante los primeros cinco minutos del paseo.\n\n## takeaways\n- La sonrisa es la correa colgando: ninguno de los dos tira.\n- Pararte quita el premio al tirón; pagar la sonrisa enseña dónde ir.\n- El premio, junto a tu pierna, nunca por delante.\n- Paga mucho al principio y espacia los premios poco a poco.\n\n## images\n### smile-leash-1\n- alt: Dos escenas: a la izquierda, {name} camina con la correa colgando en curva y arriba hay un corazón; a la derecha, {name} tira con la correa recta, la persona está parada y arriba hay un símbolo de pausa\n- caption: Correa en sonrisa, premio; correa recta, pausa\n\n### smile-leash-2\n- alt: En una calle con tiendas, {name} camina junto a la pierna de su persona, con la correa floja, y coge una golosina de su mano junto a la cadera\n- caption: El premio llega junto a tu pierna\n\n"
      },
      "files": [
        "media/smile-leash-1.png",
        "media/smile-leash-2.png"
      ]
    },
    "sniffing-decompression": {
      "config": {
        "id": "sniffing-decompression",
        "kind": "theory",
        "day": 5,
        "images": [
          "sniffing-decompression-1",
          "sniffing-decompression-2"
        ],
        "compare": {
          "do": "sniffing-decompression-do",
          "dont": "sniffing-decompression-dont"
        },
        "animation": "sniffing-decompression",
        "steps": 5,
        "takeaways": 3
      },
      "text": {
        "es": "# Olfatear y descomprimir\n\n## heading\nVuelve del paseo igual de nervioso\n\n## hook\nDas una vuelta larga a buen paso y, al volver a casa, {name} sigue dando vueltas, mordisquea lo que encuentra y no se tumba. Por la calle apenas le has dejado parar: cada vez que acerca la nariz a un árbol, tú ya estás andando. Parece que le faltan kilómetros, pero lo que le falta es otra cosa: tiempo para oler.\n\n## why\nPara tu perro, oler es leer el barrio: quién ha pasado, cuándo y hacia dónde. Ese trabajo de la nariz le ocupa la cabeza y le baja las revoluciones: al olfatear con calma respira más despacio y el cuerpo se le suelta. Por eso un rato de olfato le cansa más que una carrera, que lo acelera todavía más. A eso lo llamamos descomprimir: soltar la tensión que trae de casa o de un tramo con ruido. Y como oler es algo que desea mucho, es también un gran premio: si llega cuando la correa va floja, le enseña además a pasear contigo.\n\n## steps\n1. Elige un sitio tranquilo para el rato de olfato: un parque, un descampado o una calle con setos y poco tráfico.\n2. Cuando la correa vaya floja, dale permiso para oler con una palabra suave, siempre la misma, como «huele».\n3. Deja que él elija el rumbo y el ritmo. Tú le sigues despacio, sin tensar la correa y sin meterle prisa.\n4. Mientras huele, espera sin moverte ni hablarle. Es normal que pase un minuto entero en la misma mata: no le interrumpas.\n5. Cuando levante la cabeza y te mire, seguid andando. Dedica así al menos diez minutos de cada paseo.\n\n## example\n### {name} y los setos del parque\nSalís del portal y en la avenida hay obras y mucho ruido. {name} camina con las orejas hacia delante y la correa se tensa cada pocos pasos. Al llegar a los setos del parque, esperas a que la correa cuelgue y, en cuanto cuelga, dices «huele» en voz baja. {name} mete la nariz en el primer seto y no se mueve. Tú esperas sin moverte, aunque pasa casi un minuto. Luego va a otro seto, y a otro. Al principio olfatea a toda prisa; a los diez minutos camina despacio, con la cola baja y suelta. En casa se tumba enseguida. Al día siguiente se suelta antes.\n\n## compare\n### do\nEsperar a que la correa cuelgue y, entonces, decir «huele» y acompañarle hasta el seto. Así la calma es lo que le lleva a los olores.\n### dont\nDejarle llegar al seto mientras tira hacia él, porque «total, solo quiere oler». Así aprende que tirar es lo que le acerca a los olores.\n\n## tip\nPrueba hoy: en un tramo tranquilo, deja que tu perro decida el rumbo durante diez minutos. Al volver, fíjate en si se tumba antes que otros días.\n\n## takeaways\n- Oler le calma y le cansa más que correr.\n- El olfato es un premio: llega con la correa floja.\n- Mientras huele, tú esperas; él decide cuándo termina.\n\n## images\n### sniffing-decompression-1\n- alt: Dos escenas: a la izquierda, en la acera, {name} tira hacia delante con la correa tensa; a la derecha, en la hierba, olfatea el suelo con la correa colgando mientras su persona espera sin moverse\n- caption: Con la nariz en el suelo, la tensión baja\n\n### sniffing-decompression-2\n- alt: En un parque, {name} olfatea un seto con la correa colgando mientras su persona espera sin moverse\n- caption: Tú esperas; él decide cuándo ha terminado\n\n"
      },
      "files": [
        "media/sniffing-decompression-1.png",
        "media/sniffing-decompression-2.png",
        "media/sniffing-decompression-do.png",
        "media/sniffing-decompression-dont.png"
      ]
    },
    "theory-alone-space": {
      "config": {
        "id": "theory-alone-space",
        "kind": "theory",
        "images": [
          "theory-home-rest-1",
          "theory-home-rest-2"
        ],
        "compare": {},
        "notice": "lesson.note.alone",
        "steps": 6,
        "takeaways": 4
      },
      "text": {
        "es": "## notice\nSi {name} babea mucho, intenta escapar, no quiere ni las golosinas, se hace daño o destroza la puerta cuando se queda solo, para el entrenamiento, abre la puerta y consulta con tu veterinario o con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n\n# Quedarse solo y el espacio seguro\n\n## heading\nLlora, ladra o rompe cosas cuando te vas\n\n## hook\nCoges las llaves y {name} ya te sigue por el pasillo. Te vas diez minutos y, al volver, oyes los lloros desde la escalera, o encuentras un cojín destrozado junto a la puerta. Si el ladrido o el destrozo ocurren solo cuando no estás, es de esto de lo que trata este curso: aprender a estar solo sin sufrir.\n\n## why\nQuedarse solo no es algo que los perros sepan hacer sin más: se aprende, poco a poco. Un espacio pequeño y conocido, como un parque con su transportín abierto, le da límites claros y le ayuda a calmarse, siempre como refugio y nunca como castigo. Si el paso es demasiado grande, el perro no se acostumbra: se asusta. Por eso se avanza con pasos tan cortos que lo lleve bien, con la puerta abierta primero, sin forzarlo y sin cerrarle de golpe.\n\n## steps\n1. Prepara el espacio de descanso de {name}, el que ya conoces de la lección de descanso en casa, y añade un parque con el transportín abierto. Nunca lo uses como castigo.\n2. Con la puerta abierta, deja que entre solo a por una golosina y salga cuando quiera. Repite hasta que entre tranquilo; no le cierres nada todavía.\n3. Cuando se tumbe dentro, aléjate unos pasos y vuelve antes de que se inquiete. Haz el rato un poco más largo cada día, sin forzar ni llamarle.\n4. Haz el microcierre: cierra la puerta un segundo, ábrela y dile tu señal de liberación, la palabra que significa «ya puedes salir». Nunca es una orden.\n5. Antes de salir, da un paseo y haz una despedida tranquila, sin fiestas. Al volver, saluda sin alboroto hasta que se haya calmado.\n6. Si llora, distingue la protesta del pánico. Con cachorros menores de 4 meses, espera como mucho 2 minutos; con perros de 4 meses o más, hasta 10 minutos seguidos de llanto. En cuanto haya pánico, o se pase ese tiempo, abre la puerta.\n\n## example\n### {name} y la puerta del parque\nEs sábado y {name} lleva tres días practicando. Hoy entra al parque, se tumba y masca su hueso. Te alejas dos pasos, vuelves y le dices «ya puedes salir». Luego cierras la puerta un segundo; {name} gimotea una vez, pero respira normal y sigue mascando. Esperas, abres y lo celebras sin alboroto. Más tarde, en otro intento, babea y araña la puerta: abres enseguida y mañana vuelves a un paso más corto. No es un fracaso: así se ajusta el ritmo.\n\n## compare\n### do\nAbrir la puerta en cuanto haya pánico o se pase el tiempo, y volver a un paso más corto al día siguiente.\n### dont\nDejarle llorar «hasta que se canse», sin límite de tiempo. Si hay pánico, el llanto no es aprendizaje: es miedo.\n\n## tip\nPrueba hoy: con la puerta abierta, deja una golosina dentro del espacio de descanso y fíjate en si {name} entra solo y se queda un momento.\n\n## takeaways\n- Estar solo se aprende en pasos cortos y sin forzar.\n- El espacio pequeño es un refugio, nunca un castigo.\n- Protesta, se espera; pánico o tiempo cumplido, se abre.\n- Cachorros menores de 4 meses esperan mucho menos que adultos.\n\n## images\n### theory-home-rest-1\n- alt: En el salón, {name} descansa en su cama dentro de un parque con la puerta abierta\n- caption: Un espacio pequeño y conocido, con la puerta abierta\n\n### theory-home-rest-2\n- alt: La persona se aleja unos pasos mientras {name} sigue en su espacio, con calma\n- caption: Te alejas poco a poco, sin forzar\n"
      },
      "files": [
        "media/theory-home-rest-1.png",
        "media/theory-home-rest-2.png"
      ]
    },
    "theory-bark-home": {
      "config": {
        "id": "theory-bark-home",
        "kind": "theory",
        "images": [
          "theory-calm-first-1",
          "theory-calm-first-2"
        ],
        "compare": {},
        "steps": 6,
        "takeaways": 4
      },
      "text": {
        "es": "# Ladra en casa\n\n## heading\nLadra cada vez que pasa algo\n\n## hook\nPasa un vecino por el rellano y {name} ladra. Suena el ascensor, ladra. Ve a otro perro desde la ventana, ladra. Tú le dices «¡calla!» y ladra más. Los ladridos agotan, y los vecinos empiezan a quejarse. Hay una forma tranquila de bajar el volumen, y empieza por entender para qué ladra.\n\n## why\nLadrar es la forma de hablar de un perro: avisa, se emociona, pide atención o se aburre. Cada vez que ladra y algo se va (el vecino se aleja, tú le haces caso), aprende que ladrar funciona. Si le gritas, para él es como si ladraras con él y la excitación sube. Lo que baja el ladrido es quitar el motivo, no pagar el ruido, y premiar el silencio. Si solo ladra, aúlla o destroza cosas cuando te vas, puede ser ansiedad por separación: consulta con un profesional.\n\n## steps\n1. Anota cuándo ladra: a la ventana, al timbre, cuando te ve en el sofá o cuando se queda solo. Cada motivo tiene su solución.\n2. Quita lo que lo dispara siempre que puedas: cierra la cortina o tapa la parte baja del cristal, y ofrécele un sitio de descanso lejos de la ventana.\n3. Si ya ladra sin parar, espera sin hablarle ni mirarle a que haga una pausa. Añadir voz o gritos solo le sube más.\n4. En cuanto haga una pausa en silencio, dile «bien» con voz suave y dale una golosina. Con los días, alarga la pausa antes de premiar.\n5. Si ladra para pedirte atención, no lo mires, no le hables ni lo toques. Cuando se calle o se tumbe, dale la atención y un «bien».\n6. Dale algo que hacer: un juguete relleno de comida, paseos con tiempo para olfatear y juego diario. Un perro con la cabeza ocupada ladra menos.\n\n## example\n### {name} y la ventana del salón\nCada tarde pasa el cartero y {name} ladra desde el sofá. Una tarde cierras media cortina y dejas una esterilla lejos de la ventana. Cuando oye al cartero se levanta, pero no ladra; esperas unos segundos y, en cuanto se queda en silencio, le dices «bien» y le das una golosina. El primer día cuesta; el tercero, ya se sienta a mirarte esperando el premio.\n\n## compare\n### do\nQuitar el motivo (la cortina, otra habitación) y premiar los silencios, aunque sean de dos segundos.\n### dont\nGritarle «¡calla!» o darle una golosina mientras ladra: lo primero suma ruido y lo segundo premia el ladrido.\n\n## tip\nHoy: cuenta cuántos segundos de silencio consigue {name} antes del primer premio y apúntalo. Mañana intenta que sea uno más.\n\n## takeaways\n- Ladra por un motivo: búscalo.\n- Quita el disparador antes de entrenar.\n- Premia el silencio, aunque dure poco.\n- Gritar suma ruido: espera con calma.\n\n## images\n### theory-calm-first-1\n- alt: Un perro ladra junto a una ventana y, al cerrar la cortina, se queda tumbado y en silencio\n- caption: Sin motivo, hay menos ladrido\n\n### theory-calm-first-2\n- alt: En el salón, la persona premia con una golosina a un perro que se queda en silencio\n- caption: El silencio tiene premio\n\n"
      },
      "files": [
        "media/theory-calm-first-1.png",
        "media/theory-calm-first-2.png"
      ]
    },
    "theory-bite-others": {
      "config": {
        "id": "theory-bite-others",
        "kind": "theory",
        "images": [
          "body-language-2",
          "theory-visual-shields-1"
        ],
        "compare": {},
        "notice": "plan.note.professional",
        "steps": 6,
        "takeaways": 4
      },
      "text": {
        "es": "## notice\nSi {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n\n# Si muerde a otras personas\n\n## heading\nMuerde a alguien que no eres tú\n\n## hook\nUna visita le tiende la mano, un niño se acerca corriendo o un desconocido intenta acariciarlo en la calle. {name} gruñe, se lanza o muerde. Te quedas con el susto, con la vergüenza y con el miedo a que vuelva a pasar. No es culpa tuya, pero sí está en tu mano evitar que se repita, y se empieza por proteger a las personas.\n\n## why\nCasi siempre es miedo. Un perro que se siente acorralado o invadido primero avisa: se aparta, bosteza, se lame los labios, mira de lado, pone el cuerpo rígido, gruñe. Si esos avisos no sirven, o se castigan, solo le queda morder. También puede morder por dolor, por proteger algo o por exceso de excitación. Cuanto más se repite, más aprende que morder funciona para que la gente se aleje.\n\n## steps\n1. Protege a las personas ahora: ponle la correa en la calle, usa una puerta o una valla en casa cuando haya visitas y no lo dejes nunca a solas con niños.\n2. Pide a las visitas que lo ignoren: que no lo miren, no le hablen ni le tiendan la mano. Que sea {name} quien se acerque, si quiere.\n3. Aprende sus avisos: bostezos, lamerse los labios, mirar de lado, cuerpo rígido, gruñido. Cuando los veas, aumenta la distancia al instante.\n4. Evita lo que lo desborda: calles con mucha gente, desconocidos que quieren acariciarlo, niños que se le acercan corriendo. Si dudas, más distancia.\n5. Cuando una persona aparezca a una distancia a la que {name} todavía come con calma, dale una golosina. Así asocia a las personas con algo bueno, sin acercarte más de lo que aguanta.\n6. Pide ayuda a un profesional del comportamiento antes de exponerlo a más gente. Un plan a medida es más seguro que probar por tu cuenta.\n\n## example\n### {name} y la visita de las ocho\nLlega una amiga a cenar. Antes de abrir la puerta, llevas a {name} a otra habitación con un juguete relleno y cierras la puerta. Tu amiga entra sin mirar al perro. Más tarde, con {name} a unos metros y la correa puesta, tu amiga lanza una golosina al suelo sin acercarse. {name} la come con calma y te mira. Hoy no hay más: la visita termina antes de que aparezca el miedo, y eso también es un éxito.\n\n## compare\n### do\nDar espacio a {name} en cuanto aparezcan los avisos y presentar a las personas poco a poco, con un profesional del comportamiento si ya ha mordido.\n### dont\nObligarle a saludar o dejar que un desconocido lo acaricie «para que se acostumbre»: aumenta el miedo y el riesgo de mordisco.\n\n## tip\nHoy: anota las tres situaciones con personas que más le cuestan a {name} y decide cómo evitar cada una esta semana. Para practicar la calma con las manos cerca, juega «Manos y correa en calma», en el Mundo 1: es práctica de calma, no un ejercicio contra mordiscos.\n\n## takeaways\n- La seguridad de las personas va primero.\n- Casi siempre muerde por miedo, no por maldad.\n- Respeta los avisos y aumenta la distancia.\n- Un profesional del comportamiento te guía con seguridad.\n\n## images\n### body-language-2\n- alt: Un perro con el cuerpo rígido mira de lado a una persona que se acerca, y una persona lo ve y retrocede\n- caption: Aprende sus avisos antes del mordisco\n\n### theory-visual-shields-1\n- alt: Una persona se queda lejos de un perro que come una golosina con calma\n- caption: A la distancia justa, lo bueno llega solo\n\n"
      },
      "files": [
        "media/body-language-2.png",
        "media/theory-visual-shields-1.png"
      ]
    },
    "theory-bite-owner": {
      "config": {
        "id": "theory-bite-owner",
        "kind": "theory",
        "images": [
          "body-language-1",
          "theory-dog-as-dog-1"
        ],
        "compare": {},
        "notice": "plan.note.professional",
        "steps": 6,
        "takeaways": 4
      },
      "text": {
        "es": "## notice\nSi {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n\n# Si te muerde a ti\n\n## heading\nTe muerde y no sabes qué hacer\n\n## hook\nJuegas con {name} y, de pronto, te atrapa la mano con los dientes. O intentas quitarle un hueso y gruñe. O lo apartas del sofá y te muerde. Duele, asusta y cuesta no reaccionar a gritos. Es normal sentirse así. Antes de seguir, una cosa importante: la seguridad va primero, y entender por qué muerde viene después.\n\n## why\nUn perro no muerde por maldad ni para mandar sobre ti. Muerde porque le pasa algo: se excita jugando y no sabe parar, protege algo que valora (comida, un juguete, su sitio), tiene miedo o dolor, o está frustrado. Muchas veces avisó antes: puso el cuerpo rígido, gruñó o te evitó. Si lo castigas por avisar, aprende a no avisar, y el siguiente mordisco llega sin aviso. Por eso lo primero es evitar la situación, no ganarle el pulso.\n\n## steps\n1. Pon una puerta o una valla entre {name} y los niños, las visitas o los otros animales. Nadie debe quedarse a solas con un perro que ha mordido.\n2. Anota cuándo muerde: jugando, con comida, en el sofá, al cogerlo o al despertarlo. El patrón te dice qué situación evitar por ahora.\n3. Respeta sus avisos: si pone el cuerpo rígido, gruñe o te evita, retrocede y dale espacio. Nunca lo riñas por avisar.\n4. Evita las situaciones que disparan el mordisco: da la comida y los huesos en otra habitación con la puerta cerrada y llámalo con una golosina en vez de moverlo del sofá a la fuerza.\n5. Si te muerde jugando, corta el juego en silencio: levántate, cruza los brazos y sal de la habitación unos segundos. Al volver, ofrécele un juguete en vez de tu mano.\n6. Premia lo que quieres ver: una golosina cuando está tumbado o juega con su juguete con calma. Lo que se premia se repite.\n\n## example\n### {name} y el hueso del sofá\nTarde de sábado en el salón. {name} mordisquea un hueso en el sofá y, cuando te acercas, pone el cuerpo rígido y gruñe. En vez de quitárselo, retrocedes un paso y lanzas una golosina lejos del sofá. Cuando baja a comérsela, recoges el hueso y lo guardas. Desde entonces le das los huesos en su cama, a solas y con la puerta cerrada. Al cabo de unas semanas gruñe menos, pero lo anotas todo y lo consultas con un profesional del comportamiento.\n\n## compare\n### do\nRetroceder, dar espacio a {name} y pedir ayuda a un profesional del comportamiento si ha mordido con fuerza o más de una vez.\n### dont\nReñirle, castigarle o forzarle cuando gruñe: aprende a no avisar y el siguiente mordisco puede llegar sin aviso.\n\n## tip\nHoy: anota en el móvil las tres últimas veces que mordió o gruñó, con la hora y lo que pasaba justo antes. Te servirá para evitarlas y para el profesional. Para practicar la calma con las manos cerca, juega «Manos y correa en calma», en el Mundo 1: es práctica de calma, no un ejercicio contra mordiscos.\n\n## takeaways\n- La seguridad de las personas va primero.\n- Un gruñido es un aviso: respétalo.\n- Evita las situaciones que disparan el mordisco.\n- Pide ayuda profesional si muerde con fuerza o con frecuencia.\n\n## images\n### body-language-1\n- alt: Una persona se aparta con calma de un perro que gruñe, dejándole espacio\n- caption: Un gruñido es un aviso: da espacio\n\n### theory-dog-as-dog-1\n- alt: Un perro come un hueso en su cama mientras la persona lo deja tranquilo\n- caption: La comida, en su sitio y sin molestarlo\n\n"
      },
      "files": [
        "media/body-language-1.png",
        "media/theory-dog-as-dog-1.png"
      ]
    },
    "theory-blind-corner": {
      "config": {
        "id": "theory-blind-corner",
        "kind": "theory",
        "images": [
          "theory-blind-corner-1",
          "theory-blind-corner-2"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Las esquinas ciegas\n\n## heading\nDe golpe, una bici en la esquina\n\n## hook\nVais por la acera y {name} va un metro por delante. Llega a la esquina antes que tú y, justo al doblar, aparece una bici a un palmo de su hocico. Se echa atrás, ladra o se lanza, y tú solo notas el tirón. Ni tú ni {name} lo visteis venir.\n\n## why\nA tu perro no le asusta tanto lo que aparece como lo cerca y lo de repente que aparece. La distancia le da tiempo: a diez metros, una bici es algo que mirar; a un palmo, algo de lo que defenderse. Una esquina ciega, la que una pared o un seto no te deja ver, borra esa distancia. Además, él suele oír u oler lo que viene antes que tú, y llega a la esquina ya alerta. Si encima va delante y con la correa tensa, se lo encuentra primero y sin tu ayuda. Doblar despacio, a tu lado y lejos de la pared le devuelve el margen.\n\n## steps\n1. En cuanto veas una esquina sin visibilidad, empieza a frenar tres o cuatro pasos antes, no en la misma esquina.\n2. Di su nombre una vez, en voz suave. Cuando llegue a tu lado con la correa floja, dale una golosina a la altura de tu cadera.\n3. Abre la curva: sepárate de la pared y dobla por la parte más ancha de la acera, sin bajar a la calzada.\n4. Dobla despacio y juntos. Así ves la otra calle antes que él, y lo que venga te encuentra a unos metros.\n5. Si aparece algo y sigue tranquilo, márcalo con un «bien» suave, que le señala el momento exacto, y dale una golosina. Si se tensa, date la vuelta y alejaos.\n\n## example\n### {name} y la esquina de la farmacia\nVolvéis a casa y ves la esquina de la farmacia, con su pared alta. {name} va delante, con las orejas hacia delante: ha oído algo en la otra calle. Tres pasos antes empiezas a frenar y dices su nombre bajito. La primera vez tarda en volver, pero llega a tu lado y le das una golosina junto a la cadera. Os separáis de la pared y dobláis por la parte ancha. Una bici baja por la otra calle y la ves a varios metros. {name} la mira y luego te mira a ti: «bien», y otra golosina. En la esquina siguiente viene a tu lado antes.\n\n## compare\n### do\nFrenar unos pasos antes, recogerlo a tu lado con una golosina y doblar por la parte ancha de la acera, despacio y con la correa floja.\n### dont\nDoblar pegado a la pared con tu perro por delante, para no perder el ritmo. Así se encuentra lo que venga de frente y a un palmo.\n\n## tip\nPrueba hoy: elige dos esquinas de tu manzana con buena visibilidad y practica en ellas frenar antes y recogerlo a tu lado. Las ciegas, después.\n\n## takeaways\n- Lo que asusta es lo cerca y lo de repente.\n- Frena tres o cuatro pasos antes, no en la esquina.\n- Dobla con él a tu lado y la correa floja.\n- Por la parte ancha de la acera ves antes y desde lejos.\n\n## images\n### theory-blind-corner-1\n- alt: Vista desde arriba de una esquina, en dos escenas: a la izquierda, la persona y {name} doblan junto a la pared y su línea de vista choca con el edificio; a la derecha, van por la parte ancha de la acera y la línea de vista llega hasta una bici que baja por la otra calle\n- caption: Por la parte ancha de la acera, ves venir lo que aparece\n\n### theory-blind-corner-2\n- alt: En la acera, unos pasos antes de la esquina de un edificio, la persona está parada y {name}, a su lado con la correa floja, se gira hacia ella; detrás de la esquina suena algo que aún no se ve\n- caption: Antes de la esquina: a tu lado y con la correa floja\n\n"
      },
      "files": [
        "media/theory-blind-corner-1.png",
        "media/theory-blind-corner-2.png"
      ]
    },
    "theory-calm-first": {
      "config": {
        "id": "theory-calm-first",
        "kind": "theory",
        "images": [
          "theory-calm-first-1",
          "theory-calm-first-2"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Primero, calma\n\n## heading\nLadra y no te escucha\n\n## hook\nLlega una visita y {name} empieza a ladrar sin parar. Le dices «siéntate», y nada. Lo repites más fuerte, y nada. Le enseñas una golosina, y ladra todavía más. Parece que no te oye. En cierto modo, es así: en ese momento no puede oírte.\n\n## why\nUn perro muy excitado no puede aprender. Cuando ladra sin parar o corre a toda velocidad por la casa, su cuerpo está en alerta: el corazón va rápido y la cabeza solo atiende a lo que lo ha disparado. En ese estado, tus palabras son ruido. Si le pides algo, falla y aprende a no escucharte. Si le das una golosina, premias la excitación. Y si gritas, añades más energía. Lo primero es bajar de nivel: esperar a que se calme, sin añadir nada. Solo entonces puede escucharte y aprender.\n\n## steps\n1. Cuando ladre sin parar o corra por la casa, no le pidas nada. Ni órdenes, ni golosinas, ni gritos: cualquier energía que añadas lo sube más.\n2. Espera sin moverte, sin hablarle ni mirarle. Respira despacio y deja los brazos bajados: tu calma le ayuda a bajar.\n3. Si corre a toda velocidad por la casa, camina con calma hacia su espacio, sin tocarlo, para frenarlo. Luego vuelve a esperar.\n4. En cuanto se siente o se tumbe y te mire, ya puede escuchar. Entonces sí: pídele algo fácil con tu señal.\n5. Premia la calma: un «bien» suave y una golosina cuando se tumbe y suelte el cuerpo.\n\n## example\n### {name} y la visita\nSuena el timbre, entra tu hermana y {name} empieza a ladrar y a dar vueltas por el salón. Antes le decías «siéntate» una y otra vez. Hoy no dices nada: te quedas de pie, sin moverte, con los brazos bajados. {name} ladra un poco más, cada vez menos. Al final se sienta y te mira. Ahora sí: le pides que se tumbe con tu señal, y se tumba. Le dices «bien» y le das una golosina. La primera vez tarda casi dos minutos; a la semana, menos de uno.\n\n## compare\n### do\nEsperar sin moverte ni hablar a que se calme, y pedirle algo solo cuando se siente o se tumbe y te mire.\n### dont\nRepetirle «siéntate» o «calla» cada vez más fuerte mientras ladra: no puede escucharte y aprende a no hacerte caso.\n\n## tip\nPrueba hoy: la próxima vez que ladre sin parar, no digas nada y cuenta los segundos hasta que se calme. Apúntalo para compararlo.\n\n## takeaways\n- Un perro muy excitado no puede aprender.\n- Primero, calma; después, la señal.\n- No añadas energía: ni órdenes, ni gritos, ni golosinas.\n- Premia la calma en cuanto llegue.\n\n## images\n### theory-calm-first-1\n- alt: Dos escenas: a la izquierda, el perro ladra con la boca abierta y la persona espera de pie, sin moverse; a la derecha, el perro se sienta y mira a la persona\n- caption: Primero la calma; después, la señal\n\n### theory-calm-first-2\n- alt: En el salón, el perro se tumba en calma y la persona, agachada, le da una golosina\n- caption: La calma tiene premio\n\n"
      },
      "files": [
        "media/theory-calm-first-1.png",
        "media/theory-calm-first-2.png"
      ]
    },
    "theory-choosing-cue": {
      "config": {
        "id": "theory-choosing-cue",
        "kind": "theory",
        "images": [
          "theory-choosing-cue-1"
        ],
        "compare": {
          "do": "theory-choosing-cue-do",
          "dont": "theory-choosing-cue-dont"
        },
        "steps": 5,
        "takeaways": 3
      },
      "text": {
        "es": "# Elegir la señal\n\n## heading\nComida, patinete, otro perro: ¿qué le dices?\n\n## hook\nVas por una calle con mucho movimiento. {name} descubre un trozo de bocadillo en la acera y, casi a la vez, un patinete asoma por la esquina. Ya conoces «Déjalo» y «Vamos», pero en ese segundo te quedas en blanco. Dices una, luego la otra, y cuando quieres reaccionar {name} ya está tirando. No te faltan señales: te falta saber cuándo toca cada una.\n\n## why\nCada señal resuelve un problema distinto. Lo que está quieto en el suelo no se va a ninguna parte: {name} puede dejarlo, mirarte y cobrar su premio de tu mano. Por eso «Déjalo» funciona con la comida. Lo que se mueve, en cambio, se acerca, y cada segundo le emociona o le asusta un poco más. Pedirle que lo ignore mientras se le acerca es pedirle demasiado. Alejaros juntos con «Vamos» le da distancia, y la distancia es lo que baja la excitación. Si mezclas o repites las señales, ninguna le dice nada claro. Una sola, a tiempo, sí.\n\n## steps\n1. Mira la calle por delante, no solo a tu perro. Fíjate pronto en lo que pueda interesarle: comida, ruedas, otros perros.\n2. Hazte una sola pregunta: ¿está quieto o se mueve? Quieto en el suelo, «Déjalo». Si se mueve o se acerca, «Vamos».\n3. Di la señal una vez, con voz tranquila, antes de que llegue a ello o de que se quede mirándolo.\n4. Paga enseguida: con «Déjalo», golosina de tu mano cuando te mire; con «Vamos», premio en cuanto se gire y te siga.\n5. Si ninguna encaja o no responde, no le pidas más: gana distancia. Cruza de acera, cambia de ruta o vuelve a casa.\n\n## example\n### {name} y la calle del mercado\nEs sábado y paseáis por la calle del mercado. {name} levanta la nariz: hay un trozo de pan junto a un banco. Está quieto, así que dices «Déjalo» una vez, a dos metros. {name} lo mira, duda y te mira a ti: golosina de tu mano. Un poco más allá, un perro grande sale de un portal y viene hacia vosotros. {name} se pone en tensión, con las orejas hacia delante. Eso se mueve: «Vamos», te giras y echáis a andar en sentido contrario. La primera vez tarda un segundo en seguirte; cuando lo hace, premio. Diez metros después ya camina a tu lado con la correa floja.\n\n## compare\n### do\nDecidir pronto y decir una sola señal. Si no responde, la distancia hace el resto: os alejáis juntos y se lo vuelves a pedir más lejos.\n### dont\nEsperar a ver qué hace hasta tenerlo encima y entonces repetir la señal cada vez más alto. Cuanto más cerca está, menos puede escucharte.\n\n## tip\nPrueba hoy: durante el paseo, nombra en voz baja lo que veas antes que tu perro: «en el suelo» o «se mueve». Solo eso, sin pedirle nada.\n\n## takeaways\n- Quieto en el suelo, «Déjalo»; si se mueve, «Vamos».\n- Una señal a tiempo vale más que dos tarde.\n- Si ninguna encaja o no responde, más distancia.\n\n## images\n### theory-choosing-cue-1\n- alt: Dos escenas: a la izquierda, hay comida quieta en el suelo y {name}, junto a ella, mira a la persona; a la derecha, se acerca un patinete y la persona y {name} se alejan juntos\n- caption: Quieto en el suelo, Déjalo; si se mueve, Vamos\n\n"
      },
      "files": [
        "media/theory-choosing-cue-1.png",
        "media/theory-choosing-cue-do.png",
        "media/theory-choosing-cue-dont.png"
      ]
    },
    "theory-destroy": {
      "config": {
        "id": "theory-destroy",
        "kind": "theory",
        "images": [
          "theory-home-rest-1",
          "theory-home-rest-2"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Destroza cosas\n\n## heading\nVuelves a casa y hay un zapato destrozado\n\n## hook\nAbres la puerta y ahí está: un zapato mordido, un cojín abierto o el marco de la puerta con marcas de dientes. Te enfadas, y {name} te mira como si supiera que ha hecho algo. Pero no es culpa: es que nota tu enfado. Esto tiene arreglo, y no pasa por reñirle.\n\n## why\nMorder es una necesidad del perro: explora con la boca, se calma, se entretiene y alivia las molestias de los dientes. Destroza lo que tiene a mano cuando se aburre, tiene energía de sobra o no ha aprendido qué puede morder. Reñirlo después no sirve: no relaciona la bronca con lo que hizo hace horas. Lo que funciona es dejar a su alcance lo que sí puede morder y apartar lo que no. Si solo destroza cosas cuando te vas, y además ladra o aúlla, puede ser ansiedad por separación: consulta con un profesional.\n\n## steps\n1. Recoge zapatos, mandos, ropa y cables: lo que no está a su alcance no se puede destrozar. Cierra la puerta de las habitaciones que no uses.\n2. Reparte masticables seguros por la casa: juguetes duros de tamaño adecuado, mordedores de goma y juguetes rellenos de comida.\n3. Si lo ves mordiendo algo que no debe, ofrécele un masticable a cambio con voz alegre y, cuando lo coja, dile «bien».\n4. Haz que gaste energía antes de dejarlo solo: un paseo con tiempo para olfatear y un rato de juego. Un perro satisfecho se echa a dormir.\n5. Mantén rutinas: horas de comida y de paseo previsibles y un rato diario de atención reducen el aburrimiento y los nervios.\n\n## example\n### {name} y las zapatillas\nCada mañana, al volver de la compra, encuentras las zapatillas con el talón mordido. Esta semana las guardas en el armario y dejas en el salón un juguete duro relleno de comida. Una tarde, {name} se acerca al zapatero; le ofreces el juguete a cambio y se pone a mordisquearlo. Le dices «bien» en cuanto lo coge. Al volver a casa, las zapatillas están enteras y el juguete, vacío.\n\n## compare\n### do\nDejar a su alcance un masticable adecuado y cambiar con calma lo prohibido por él.\n### dont\nReñirle al volver y ver el destrozo: no entiende por qué, y puede acabar asustándose de ti.\n\n## tip\nHoy: da una vuelta por casa a la altura de {name} y guarda todo lo que pueda morder. Deja dos masticables en su sitio de descanso.\n\n## takeaways\n- Morder es una necesidad: dale dónde.\n- Lo que no está a su alcance no se destroza.\n- Cambia lo prohibido por un masticable.\n- Reñirle después no sirve de nada.\n\n## images\n### theory-home-rest-1\n- alt: Un perro muerde un juguete duro en el salón, con los zapatos guardados en un armario\n- caption: Lo prohibido, guardado; lo permitido, a mano\n\n### theory-home-rest-2\n- alt: Una persona cambia con calma un zapato por un juguete masticable\n- caption: Cambia lo prohibido por algo que sí puede morder\n\n"
      },
      "files": [
        "media/theory-home-rest-1.png",
        "media/theory-home-rest-2.png"
      ]
    },
    "theory-dog-as-dog": {
      "config": {
        "id": "theory-dog-as-dog",
        "kind": "theory",
        "images": [
          "theory-dog-as-dog-1",
          "theory-dog-as-dog-2"
        ],
        "compare": {
          "do": "theory-dog-as-dog-do",
          "dont": "theory-dog-as-dog-dont"
        },
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Un perro, no un peluche\n\n## heading\nLo quieres como a un bebé\n\n## hook\nLo coges en brazos cuando llora, duerme en tu cama y le das besos en la cara. Lo haces por cariño. Pero luego {name} salta a todo el que llega, llora si sales de la habitación y gruñe cuando alguien se acerca al sofá. Cuesta verlo, pero muchas de esas conductas empiezan justo ahí.\n\n## why\nUn perro no entiende el cariño como una persona. Para él, que lo levanten del suelo es perder el control de su cuerpo: muchos perros lo toleran, pocos lo disfrutan. Un beso en la cara es acercarte de frente a su cara, algo que entre perros resulta incómodo. Y si duerme en tu cama o en el sofá, aprende que los mejores sitios de la casa son suyos y que tu atención llega siempre que la pide. Casi todo lo que llamamos mal comportamiento empieza ahí: lo tratamos como a una persona o como a un juguete, no como a un perro.\n\n## steps\n1. Deja a tu perro en el suelo. Si te pide brazos poniendo las patas en tus piernas, no lo cojas: espera sin mirarle a que apoye las cuatro patas.\n2. Dale su propia cama, en un rincón tranquilo de la casa, y que sea su sitio para dormir. Tu cama y el sofá son tuyos.\n3. Si se sube al sofá o a la cama, camina con calma hacia él, sin tocarlo ni hablarle, hasta que baje. Luego señala su cama.\n4. Cambia los besos en la cara por caricias suaves en el pecho o en el costado, cuando esté en calma y se acerque a pedirlas.\n5. Salúdalo solo cuando esté en calma. Si salta al verte, espera sin hablarle; cuando tenga las cuatro patas en el suelo, salúdalo despacio.\n\n## example\n### {name} y el sofá del salón\nLlegas a casa y {name} te recibe con saltos y gemidos, pidiendo brazos. Esta vez no lo coges. Esperas en la entrada, sin mirarle, hasta que apoya las cuatro patas. Entonces le acaricias el pecho, despacio. Por la tarde, {name} se sube al sofá. Te levantas y caminas con calma hacia su sitio, sin tocarlo ni decir nada. Baja y se va a su cama. Le dices «bien» en voz baja. La primera semana lo intenta muchas veces; poco a poco, su cama gana.\n\n## compare\n### do\nDejarlo en el suelo, darle su propia cama y saludarlo cuando esté en calma, con caricias suaves en el pecho.\n### dont\nCogerlo en brazos cuando llora, dormir con él y llenarle la cara de besos. Se hace por cariño, pero así aprende a pedir sin parar.\n\n## tip\nPrueba hoy: pasa un día entero sin cogerlo en brazos, sin subirlo a tu cama y sin besos en la cara. Apunta cuántas veces te lo pide.\n\n## takeaways\n- Querer a tu perro es tratarlo como a un perro.\n- Brazos, cama y besos son cosas de personas, no de perros.\n- Su cama es su sitio; el sofá y tu cama, tuyos.\n- El mal comportamiento suele empezar por no tratarlo como a un perro.\n\n## images\n### theory-dog-as-dog-1\n- alt: Dos escenas: a la izquierda, la persona lleva al perro en brazos; a la derecha, el perro está en el suelo, junto a su cama, y la persona se agacha a su altura\n- caption: En el suelo, a su altura, es un perro\n\n### theory-dog-as-dog-2\n- alt: En el salón, la persona lee en el sofá y el perro descansa en su propia cama, en el rincón\n- caption: Tu sofá y su cama: cada uno en su sitio\n\n"
      },
      "files": [
        "media/theory-dog-as-dog-1.png",
        "media/theory-dog-as-dog-2.png",
        "media/theory-dog-as-dog-do.png",
        "media/theory-dog-as-dog-dont.png"
      ]
    },
    "theory-doorbell": {
      "config": {
        "id": "theory-doorbell",
        "kind": "theory",
        "images": [
          "theory-doorbell-1",
          "theory-doorbell-2"
        ],
        "compare": {},
        "steps": 6,
        "takeaways": 4
      },
      "text": {
        "es": "# El timbre y la alfombra\n\n## heading\nCorre a la puerta en cuanto suena el timbre\n\n## hook\nSuena el timbre y {name} sale corriendo por el pasillo, ladrando, con las uñas resbalando en el suelo. Tú vas detrás pidiéndole que se calle, abres como puedes y la visita entra entre saltos. Cuando por fin se calma, han pasado diez minutos. Y la próxima vez que suene el timbre, todo vuelve a empezar igual.\n\n## why\nPara tu perro, el timbre no es un ruido cualquiera: casi siempre anuncia algo emocionante, una visita, un paquete, alguien que huele a calle. Lo ha aprendido a fuerza de repetirlo, igual que tú reconoces el sonido de tu móvil. No es desobediencia; es emoción y costumbre. Si cuando ladra tú también corres y hablas alto, la escena se vuelve todavía más emocionante. La salida es darle al timbre otro significado: al sonar, se va a la alfombra, y allí, cuando se tumba tranquilo, llega lo bueno. Un perro tumbado en su alfombra no puede, a la vez, estar ladrando en la puerta.\n\n## steps\n1. Primero, sin timbre: di «a la alfombra», guíalo hasta ella y dale una golosina cuando se tumbe. Repítelo unos días, hasta que vaya solo.\n2. Pon un timbre grabado en el móvil, muy bajo. En cuanto suene, o en cuanto mire fijo la puerta o ladre, dile «a la alfombra» una vez.\n3. Si llega a la alfombra pero sigue de pie o inquieto, espera sin hablarle. Si se distrae olfateando, di su nombre una vez, en voz suave.\n4. Cuando se tumbe y suelte el cuerpo, márcalo con un «bien» suave, que le señala el momento exacto que te gusta, y dale la golosina allí.\n5. Sube el volumen poco a poco y, más adelante, pide a un amigo que llame de verdad. Si no consigue ir a la alfombra, vuelve un paso atrás.\n6. Mientras practicáis, recibe las visitas reales con él en otra habitación y algo para mordisquear. Así no ensaya la carrera a la puerta.\n\n## example\n### {name} y el timbre del domingo\nEs domingo por la tarde y estás en el pasillo, con el móvil en la mano y golosinas en el bolsillo. Pones el timbre grabado, bajito. {name} levanta las orejas y no aparta la vista de la puerta. Antes de que ladre, dices «a la alfombra» y va. Se queda de pie, gimiendo, con el peso hacia delante: esperas sin hablarle. Se pone a olfatear el borde; dices su nombre una vez y te mira. Al rato se tumba y apoya la cadera de lado. «Bien», y la golosina cae en la alfombra. La primera vez tarda dos minutos; a la quinta, apenas veinte segundos.\n\n## compare\n### do\nEsperar sin hablarle a que se tumbe y suelte el cuerpo, y marcar entonces. Si se levanta y vuelve a la puerta, mándalo otra vez a la alfombra.\n### dont\nDarle la golosina en cuanto pisa la alfombra, aunque siga de pie, mirando la puerta y gimiendo. Así le pagas la excitación, no la calma.\n\n## tip\nPrueba hoy: pon un timbre grabado en el móvil, muy bajo, y fíjate en la primera señal de tu perro: orejas, mirada a la puerta o ladrido. Ahí empieza tu momento.\n\n## takeaways\n- El timbre anuncia visitas: por eso corre, no por desobediencia.\n- Al primer aviso, a la alfombra, antes de que se dispare.\n- Inquieto, esperas; tumbado y relajado, marcas y premias.\n- Empieza bajito y sube poco a poco; si no puede, vuelve atrás.\n\n## images\n### theory-doorbell-1\n- alt: Dos escenas: a la izquierda, {name} está de pie en su alfombra, con la oreja tiesa y la cola alta, y encima hay un reloj; a la derecha, {name} se tumba en la alfombra, en calma, con una golosina delante y un corazón encima\n- caption: De pie e inquieto, esperas; tumbado y relajado, marcas\n\n### theory-doorbell-2\n- alt: En el recibidor suena el timbre junto a la puerta; {name} se tumba en su alfombra y la persona, agachada a su lado, le da una golosina\n- caption: Suena el timbre y {name} se tumba en su alfombra\n\n"
      },
      "files": [
        "media/theory-doorbell-1.png",
        "media/theory-doorbell-2.png"
      ]
    },
    "theory-eat-objects": {
      "config": {
        "id": "theory-eat-objects",
        "kind": "theory",
        "images": [
          "theory-leave-it-1",
          "theory-leave-it-2"
        ],
        "compare": {},
        "notice": "lesson.note.vet",
        "steps": 6,
        "takeaways": 4
      },
      "text": {
        "es": "## notice\nSi {name} se ha tragado algo que no es comida, vomita, no quiere comer, le duele la tripa o come cosas raras una y otra vez, llama ya a tu veterinario. No esperes a ver si lo suelta ni intentes hacerlo vomitar en casa.\n\n# Se come lo que no es comida\n\n## heading\nSe traga calcetines, piedras y servilletas\n\n## hook\nEn un descuido, {name} se lleva un calcetín a la boca y lo traga. O mastica piedras en el paseo, o saca las servilletas de la basura. Te asustas, intentas quitárselo y sale corriendo. Hay dos cosas distintas: lo que se entrena y lo que va al veterinario. Empezamos por separarlas.\n\n## why\nHay perros, sobre todo cachorros y jóvenes, que exploran con la boca y se tragan lo que encuentran. Otros se aburren, están nerviosos o han aprendido que coger cosas atrae tu atención. A veces hay una causa médica que solo detecta un veterinario. Si intentas quitárselo a la fuerza, aprende a tragarlo deprisa o a esconderse. Entrenar el «suelta» y cambiar el objeto por algo mejor funciona más que perseguirlo.\n\n## steps\n1. Si se lo ha tragado o hay síntomas, ve al veterinario. Todo lo que sigue es para entrenar, no para resolver una urgencia.\n2. Pon fuera de su alcance lo que suele robar: calcetines, bolsas, basura con tapa y piedras del jardín. Prevenir es más seguro que entrenar.\n3. Si lo ves mirar un objeto, camina con calma hasta el objeto y recógelo tú antes de que lo coja. Sin prisa y sin gritos.\n4. Si ya lo lleva en la boca, no lo persigas: perseguirlo se convierte en un juego. Enséñale una golosina rica y espera a que se acerque.\n5. Cuando suelte el objeto para ir a por la golosina, dile «bien», dásela y recoge el objeto sin darle importancia. Es un cambio: {name} siempre sale ganando.\n6. Practica el «suelta» a diario con sus juguetes: ofrécele un premio mejor a cambio de cada uno.\n\n## example\n### {name} y el calcetín\nEstás doblando ropa y {name} se lleva un calcetín al salón. No lo persigues: coges una golosina y te sientas en el suelo, mirando a otro lado. {name} se acerca con curiosidad, suelta el calcetín para oler la golosina y se la come. Mientras tanto, recoges el calcetín con calma. Esa noche guardas el cesto de la ropa sucia donde no llegue.\n\n## compare\n### do\nCambiar el objeto por una golosina mejor, sin prisa, y guardar lo que suele robar.\n### dont\nPerseguirle gritando para quitárselo: lo convierte en un juego y le enseña a tragar más deprisa.\n\n## tip\nHoy: da una vuelta por casa a la altura de {name} y guarda cinco cosas que podría tragar. Anota si ya se ha llevado alguna.\n\n## takeaways\n- Si se lo ha tragado, al veterinario.\n- Prevenir es más seguro que entrenar.\n- No lo persigas: cambia el objeto por algo mejor.\n- Si lo repite sin parar, consulta al veterinario.\n\n## images\n### theory-leave-it-1\n- alt: Una persona se agacha con una golosina mientras un perro suelta un objeto del suelo\n- caption: Una golosina mejor hace soltar el objeto\n\n### theory-leave-it-2\n- alt: En el salón, una persona guarda objetos pequeños en una caja alta\n- caption: Lo que no alcanza, no lo traga\n\n"
      },
      "files": [
        "media/theory-leave-it-1.png",
        "media/theory-leave-it-2.png"
      ]
    },
    "theory-harness": {
      "config": {
        "id": "theory-harness",
        "kind": "theory",
        "images": [
          "theory-harness-1",
          "theory-harness-2"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# El paseo empieza con el arnés\n\n## heading\nSalta en cuanto ve el arnés\n\n## hook\nDescuelgas el arnés y {name} ya está botando a tu alrededor. Intentas pasarle la cabeza por el hueco, se escapa, vuelve y te salta a las piernas. Al final se lo pones como puedes, deprisa, para salir de una vez. Y el paseo arranca con la misma prisa que el recibidor: {name} tirando y tú frenando desde el primer paso.\n\n## why\nPara tu perro, el arnés anuncia la calle, lo mejor del día. Por eso se emociona; no es desobediencia. Pero lo que pasa en ese momento le enseña algo. Si se lo pones mientras salta, aprende que saltar hace que el paseo llegue antes. Además, la excitación no se queda en casa: un perro que cruza la puerta ya alterado tarda mucho en calmarse y tira más desde el principio. La buena noticia es que el mismo mecanismo juega a tu favor. Si el arnés solo se acerca cuando está quieto y vuelve a tu pecho cuando salta, descubre que la calma es lo que trae el paseo.\n\n## steps\n1. Coge el arnés despacio y sin tono de fiesta, con unas golosinas pequeñas en el bolsillo.\n2. Si salta, lleva el arnés a tu pecho y espera sin moverte, sin hablarle ni mirarle. Mientras salta, no pasa nada.\n3. Si se distrae olfateando o se aleja, di su nombre una vez, en voz suave, para que vuelva a mirarte.\n4. Cuando tenga las cuatro patas en el suelo, o se siente y te mire, acerca el arnés. Si vuelve a saltar, el arnés vuelve a tu pecho.\n5. Con el arnés puesto, si sigue tranquilo, márcalo con un «bien» suave, que le señala el momento exacto que te gusta, y dale una golosina.\n\n## example\n### {name} y el gancho del recibidor\nSon las ocho y estás en el recibidor. Descuelgas el arnés del gancho y {name} empieza a botar, con las orejas hacia delante y la cola en alto. Llevas el arnés a tu pecho y esperas sin moverte. {name} da dos saltos más y se pone a olfatear la alfombra. Dices su nombre una vez, bajito, y te mira. Se sienta. Acercas el arnés y, al verlo llegar, se levanta de golpe: el arnés vuelve a tu pecho. La segunda vez aguanta sin levantarse. Le pasas el arnés, no se mueve y le das su «bien» con una golosina. Hoy habéis tardado tres minutos; mañana, algo menos.\n\n## compare\n### do\nLlevar el arnés a tu pecho cuando salta y esperar sin moverte. En cuanto tiene las cuatro patas en el suelo, el arnés vuelve a acercarse.\n### dont\nPonérselo deprisa mientras salta, aprovechando que está cerca, para salir de una vez. Así aprende que saltar es lo que trae el paseo.\n\n## tip\nPrueba hoy: antes del paseo, cuenta cuántas veces llevas el arnés a tu pecho hasta ponérselo. Apúntalo y compáralo con el de mañana.\n\n## takeaways\n- Saltar no acerca el arnés; la calma, sí.\n- La excitación de la puerta sigue en el paseo.\n- Arnés puesto y tranquilo: «bien» y golosina.\n- Al principio tarda minutos; cada día, un poco menos.\n\n## images\n### theory-harness-1\n- alt: Dos escenas: a la izquierda, {name} salta y la persona, de pie, recoge el arnés contra su cuerpo; a la derecha, {name} se sienta y la persona, agachada, le acerca el arnés\n- caption: Si salta, el arnés se aleja; si está quieto, se acerca\n\n### theory-harness-2\n- alt: En el recibidor, junto a la puerta cerrada, {name} se sienta con el arnés puesto y la persona, agachada, le da una golosina\n- caption: Arnés puesto y tranquilo: «bien» y golosina\n\n"
      },
      "files": [
        "media/theory-harness-1.png",
        "media/theory-harness-2.png"
      ]
    },
    "theory-home-rest": {
      "config": {
        "id": "theory-home-rest",
        "kind": "theory",
        "images": [
          "theory-home-rest-1",
          "theory-home-rest-2"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# En casa se descansa\n\n## heading\nTe pide atención todo el día\n\n## hook\nEstás en el sofá y {name} te trae la pelota. La lanzas por el pasillo. A los dos minutos vuelve, te da con el hocico en la mano y te mira. Le hablas, le acaricias, jugáis un poco. Y así todo el día. Por la noche, cuando quieres descansar, {name} sigue pidiendo y, si no le haces caso, ladra.\n\n## why\nCreer que darle toda la casa es más bondadoso es un mito: la libertad total exige más vigilancia, multiplica los riesgos y reduce el control higiénico. Para calmarse, tu perro necesita un espacio seguro delimitado. El tamaño ideal es solo el necesario para ponerse de pie, girar 360 grados y tumbarse de lado a estirarse por completo; más espacio no es mejor. Dentro de casa se aprende a descansar, no a vigilar ni a pedir atención continua.\n\n## steps\n1. Decide que dentro de casa no se juega a lanzar la pelota ni a perseguirse. El juego y el ejercicio intenso van fuera, en el parque o en la calle.\n2. Prepara su rincón seguro en una zona tranquila, lejos de pasillos transitados, con su cama delimitada, parque o transportín abierto y un mordedor adecuado.\n3. Cuando venga a pedirte atención fuera de los momentos que tú inicias, no lo mires, no le hables y no lo toques. Para un perro, mirarle ya es responder.\n4. Si insiste, levántate y camina con calma hacia su espacio, sin tocarlo ni hablar, hasta que se aparte hacia su rincón de descanso.\n5. Cuando se retire a su rincón y se tumbe por su cuenta, márcalo con un «bien» suave y déjalo descansar. Jamás uses ese rincón como castigo.\n\n## example\n### {name} y el rincón de descanso\nEstás leyendo en el sofá y {name} te deja un juguete en el regazo. No lo miras ni dices nada. {name} insiste con el hocico. Te levantas y caminas despacio ocupando su espacio, con los brazos bajados. {name} retrocede hacia su rincón seguro, encuentra su mordedor y se pone a masticar con calma. Dices «bien» en voz baja y sigues leyendo. Nadie lo molesta mientras descansa.\n\n## compare\n### do\nUbicar su espacio seguro en una zona tranquila, con el tamaño justo para levantarse, girar y estirarse, usando calma para apartarlo si demanda atención.\n### dont\nDarle acceso libre a toda la casa pensando que descansará mejor, colocar su cama en pasillos transitados o utilizar el rincón como lugar de castigo.\n\n## tip\nPrueba hoy: coloca su espacio seguro en un lugar tranquilo sin paso constante, comprueba que pueda estirarse cómodamente y aparta los juguetes interactivos del salón.\n\n## takeaways\n- En casa se descansa; el juego y el ejercicio van siempre fuera.\n- La libertad total en casa genera hipervigilancia; delimitar su rincón aporta tranquilidad.\n- Su espacio debe permitirle levantarse, girar y estirarse de lado sin ser excesivo.\n- Sitúa su rincón en una zona tranquila y apartada de pasillos concurridos.\n\n## images\n### theory-home-rest-1\n- alt: Dos escenas: dentro de casa el perro duerme en su espacio seguro delimitado; fuera, en el parque, corre detrás de una pelota\n- caption: Dentro se descansa en un espacio seguro; fuera se juega\n\n### theory-home-rest-2\n- alt: En el salón, la persona camina con calma hacia el perro sin mirarlo ni tocarlo, y el perro se retira a descansar a su rincón tranquilo\n- caption: Apartarlo es ocupar su espacio con calma hacia su rincón de descanso\n"
      },
      "files": [
        "media/theory-home-rest-1.png",
        "media/theory-home-rest-2.png"
      ]
    },
    "theory-leave-it": {
      "config": {
        "id": "theory-leave-it",
        "kind": "theory",
        "images": [
          "theory-leave-it-1",
          "theory-leave-it-2"
        ],
        "compare": {
          "do": "theory-leave-it-do",
          "dont": "theory-leave-it-dont"
        },
        "steps": 6,
        "takeaways": 4
      },
      "text": {
        "es": "# Déjalo\n\n## heading\nVe comida en la acera y ya va a por ella\n\n## hook\nVais por la acera y {name} frena en seco: hay un trozo de bocadillo junto a la papelera. Antes de que puedas reaccionar, ya tiene la nariz encima. Intentas apartarle la cabeza, repites «déjalo, déjalo» y, mientras tanto, {name} traga lo más rápido que puede. Al día siguiente mira el suelo con más ganas todavía.\n\n## why\nPara tu perro, la comida del suelo es un premio que encuentra solo: nadie tiene que dárselo. Por eso la busca; no es mala educación. Si corres a quitársela, aprende algo más: que hay que comer deprisa, antes de que llegues. Y una palabra dicha cuando ya está encima no le dice nada, porque nadie le ha enseñado qué significa. «Déjalo» funciona si antes, en casa, ha descubierto que apartarse de la comida trae algo mejor de tu mano. Entonces, en la calle, girar la cabeza hacia ti le compensa más que el suelo.\n\n## steps\n1. En casa, cierra una golosina sosa en el puño y deja que la olfatee. Cuando aparte el hocico, di «bien» y dale una mejor con la otra mano.\n2. Cuando ya se aparte en cuanto ve el puño, di «Déjalo» justo antes de enseñarlo. Así la palabra empieza a significar: aparta la nariz y te pago yo.\n3. Sube la dificultad poco a poco: la golosina en el suelo, tapada con tu mano; luego destapada; luego pasando a su lado con la correa puesta.\n4. En la calle, di «Déjalo» una sola vez, en voz normal, en cuanto vea la comida: orejas hacia delante, cabeza que baja. Siempre antes de que llegue.\n5. Cuando gire la cabeza hacia ti, «bien» y una golosina de tu mano, y seguid andando lejos de la comida. El premio nunca sale del suelo.\n6. Si llegas tarde y ya lo tiene en la boca, ofrécele un cambio con calma: una golosina mejor junto al hocico. Cuando lo suelte, recógelo tú.\n\n## example\n### {name} y el bocadillo del quiosco\nPasáis junto al quiosco y {name} ve un trozo de bocadillo a unos pasos, cerca de la papelera. Levanta las orejas y estira el cuello. Antes de que acelere, dices «Déjalo» una vez. La primera vez duda: da un paso más y olfatea el aire. Esperas sin moverte, con la correa floja. Entonces gira la cabeza hacia ti: «bien», golosina de tu mano, y seguís andando lejos del bocadillo. Dos calles más allá hay un envoltorio en el suelo, y esta vez se gira en cuanto oye la palabra.\n\n## compare\n### do\nDecir «Déjalo» una vez, en cuanto ve la comida y todavía está a unos pasos. Si se gira hacia ti, «bien» y premio de tu mano.\n### dont\nRepetir «déjalo, déjalo» cuando ya tiene la nariz encima. Llega tarde, no le ayuda a acertar y la palabra pierde su valor.\n\n## tip\nPrueba hoy: antes del paseo, haz en casa cinco repeticiones con el puño cerrado. Fíjate en cuántos segundos tarda en apartar el hocico y apúntalo.\n\n## takeaways\n- La comida del suelo se paga sola; tu premio tiene que ganarle.\n- Primero en casa, con algo soso; la calle llega después.\n- «Déjalo» una vez, en cuanto la ve, antes de que llegue.\n- Girarse hacia ti trae el premio; nunca sale del suelo.\n\n## images\n### theory-leave-it-1\n- alt: Dos escenas en casa: a la izquierda, {name} mira una comida en el suelo junto a la persona agachada; a la derecha, {name} se gira hacia la persona, que le da una golosina\n- caption: Aparta la vista de la comida y el premio llega de tu mano\n\n### theory-leave-it-2\n- alt: En la acera, junto a una pared, {name} se gira hacia la persona con la correa floja, unos pasos antes de un trozo de comida en el suelo\n- caption: Se gira hacia ti antes de llegar: «bien» y premio\n\n"
      },
      "files": [
        "media/theory-leave-it-1.png",
        "media/theory-leave-it-2.png",
        "media/theory-leave-it-do.png",
        "media/theory-leave-it-dont.png"
      ]
    },
    "theory-long-leash": {
      "config": {
        "id": "theory-long-leash",
        "kind": "theory",
        "images": [
          "theory-long-leash-1",
          "theory-long-leash-2"
        ],
        "compare": {
          "do": "theory-long-leash-do",
          "dont": "theory-long-leash-dont"
        },
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# La correa larga de 3 metros\n\n## heading\nTres metros para olfatear y para acelerar\n\n## hook\nEn el parque le das correa y {name} se va a olfatear la hierba, feliz. Entonces aparece un corredor. {name} sale corriendo, los tres metros se acaban de golpe y el tirón te lleva el brazo hacia delante. La correa larga parecía un regalo para los dos, y en un segundo se ha convertido en un problema.\n\n## why\nOlfatear es la forma en que tu perro lee el mundo, y hacerlo a su ritmo le ayuda a descomprimir, a soltar la tensión acumulada. Por eso la correa larga es un buen regalo en un sitio abierto. Pero tres metros también son una pista de despegue. Si arranca cerca de ti, llega al final a toda velocidad y el frenazo os sacude a los dos. Ese golpe no le enseña nada útil: le asusta o le excita más. Perseguir lo que corre es instinto, no desobediencia. Con correa larga, tu trabajo es adelantarte: recoger antes de que arranque.\n\n## steps\n1. Lleva el asa en una mano y dobla el sobrante en pliegues sueltos en la otra palma. Nunca la enrolles en la mano ni en los dedos.\n2. Mientras huele con calma, suelta pliegues hasta darle los tres metros. Levanta la vista a menudo: corredores y bicis llegan antes de lo que parece.\n3. En cuanto veas algo rápido, recoge correa pliegue a pliegue, mano sobre mano, hasta tenerlo a un metro de ti. Hazlo antes de que arranque.\n4. Si arranca, párate ya y recoge lo que puedas. Cuanta menos correa le quede, menos velocidad coge y más suave es el final.\n5. Apártate unos pasos del camino y di «Vamos», la señal para que te siga. Si te mira, «bien» y golosina; cuando el corredor pase, vuelve a soltar.\n\n## example\n### {name} y el corredor del estanque\nEs domingo por la mañana y paseáis por el césped junto al estanque. {name} olfatea un arbusto con los tres metros sueltos y tú llevas los pliegues en la mano. Al fondo del camino aparece un corredor. {name} levanta la cabeza, con las orejas hacia delante y el peso en las patas delanteras. Recoges correa, mano sobre mano, y os apartáis tres pasos hacia la hierba. «Vamos». La primera vez tarda en girarse y la correa llega a tensarse: te paras y esperas. Por fin te mira: «bien» y golosina. El corredor pasa, sueltas correa y {name} vuelve a su arbusto. Con el siguiente corredor se gira antes.\n\n## compare\n### do\nDoblar el sobrante en pliegues sueltos dentro de la palma, con el asa en la otra mano. Así recoges o sueltas un metro en un segundo, sin que nada te apriete.\n### dont\nEnrollarte la correa en la mano o en los dedos para acortarla rápido. Si sale disparado detrás de un corredor, la vuelta se aprieta de golpe y te puede lesionar.\n\n## tip\nPrueba hoy: en casa, sin perro, recoge y suelta la correa larga diez veces, pliegue a pliegue. Que tus manos lo hagan solas antes de ir al parque.\n\n## takeaways\n- La correa larga da libertad para olfatear y descomprimir.\n- Tres metros también son tres metros para acelerar.\n- Algo rápido a la vista: recoge, apártate y di «Vamos».\n- Pliegues sueltos en la palma, nunca enrollada en la mano.\n\n## images\n### theory-long-leash-1\n- alt: Dos escenas vistas desde arriba: a la izquierda, {name} olfatea cerca del borde de un círculo grande alrededor de la persona; a la derecha, pasa un corredor y {name} va junto a la persona, dentro de un círculo pequeño\n- caption: Con calma, tres metros; si llega algo rápido, uno\n\n### theory-long-leash-2\n- alt: En el parque, la persona está parada a un lado del camino con la correa recogida y {name}, a su lado, la mira mientras un corredor pasa por detrás\n- caption: Correa recogida y distancia: el corredor pasa\n\n"
      },
      "files": [
        "media/theory-long-leash-1.png",
        "media/theory-long-leash-2.png",
        "media/theory-long-leash-do.png",
        "media/theory-long-leash-dont.png"
      ]
    },
    "theory-loose-leash": {
      "config": {
        "id": "theory-loose-leash",
        "kind": "theory",
        "images": [
          "theory-loose-leash-1",
          "theory-loose-leash-2"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Pasear con la correa floja\n\n## heading\nCada paseo es un tira y afloja\n\n## hook\nSales con {name} y en dos minutos ya te duele el hombro. Tira hacia el árbol, hacia la farola, hacia el perro de enfrente. Tú vas detrás, frenando y soltando, y cuando por fin camina a tu lado ni te das cuenta: estás pendiente del siguiente tirón. Al volver, llegáis con menos energía que si hubierais corrido.\n\n## why\nPara tu perro, la calle está llena de premios: olores, sitios nuevos, seguir avanzando. Lo que hace justo antes de conseguirlos es lo que aprende. Si llega al árbol tirando, tirar le ha funcionado. Si solo le hablas cuando tira, los ratos buenos pasan sin que nada los premie. Y si algo le sorprende de cerca, como un monopatín, la emoción le sube de golpe y tirar es lo único que le sale. Pasear con la correa floja es darle la vuelta a todo eso: que la calle se abra cuando la correa cuelga, y que tú veas venir lo difícil antes que él.\n\n## steps\n1. Mira lejos, media calle por delante. Así ves venir antes que él un monopatín, otro perro o un gato, y tienes tiempo de reaccionar.\n2. Si llega algo que le va a costar, apártate a un lado o frena antes de que la correa se tense. Si dudas, más distancia.\n3. Marca los ratos buenos: cuando camina con la correa colgando o deja de mirar algo para volver contigo, di «bien», que le señala ese momento, y dale una golosina.\n4. Si la correa se tensa, haz poste: te paras sin tirar y esperas. En cuanto se afloja, seguís andando.\n5. Paga con la calle: cuando lleva un rato con la correa floja, dile «venga, huele» y llévale tú hasta ese árbol que quería oler.\n\n## example\n### {name} y el monopatín\nVais por la calle del mercado y {name} camina con la correa colgando. Miras lejos y ves, al fondo, a un chico en monopatín que se acerca. {name} todavía no lo ha visto. Te apartas hacia un escaparate antes de que llegue. {name} lo oye, levanta las orejas y la correa se estira: te paras. Mira pasar el monopatín y, en cuanto vuelve la cabeza hacia ti, «bien» y golosina. Seguís. Diez metros después está el árbol que siempre quiere oler; lleva un buen rato sin tirar, así que le dices «venga, huele». La primera calle os cuesta; la siguiente, un poco menos.\n\n## compare\n### do\nHacer poste unos pasos antes del árbol. Cuando la correa cuelga, «venga, huele»: llegáis juntos y el olor premia la correa floja.\n### dont\nDejarle llegar tirando al árbol que quiere oler, porque «total, iba a olerlo igual». Ese olor le paga el tirón, y la próxima vez tirará antes.\n\n## tip\nPrueba hoy: antes de llegar a la primera esquina, marca y premia cinco ratos de correa floja. Fíjate en cuántos se te escapaban sin darte cuenta.\n\n## takeaways\n- Lo que le paga el paseo es lo que aprende.\n- Mira lejos: ve venir lo difícil antes que él.\n- Marca los ratos de correa floja, no solo los tirones.\n- Olfatear es el premio de la correa floja.\n\n## images\n### theory-loose-leash-1\n- alt: Dos escenas: a la izquierda, la persona y {name} caminan con la correa floja; a la derecha, la persona se para y {name} huele un arbusto con la correa colgando\n- caption: Primero, correa floja; después, a olfatear\n\n### theory-loose-leash-2\n- alt: En la acera, la persona mira a lo lejos a un chico con casco que llega en monopatín, mientras {name} camina con calma con la correa floja\n- caption: Mira lejos: lo ves llegar antes que él\n\n"
      },
      "files": [
        "media/theory-loose-leash-1.png",
        "media/theory-loose-leash-2.png"
      ]
    },
    "theory-named-behaviours": {
      "config": {
        "id": "theory-named-behaviours",
        "kind": "theory",
        "images": [
          "theory-named-behaviours-1",
          "theory-named-behaviours-2"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 3
      },
      "text": {
        "es": "# Tiene nombre\n\n## heading\n«Mi perro es así»\n\n## hook\nSe tumba en la acera cuando ve venir a otro perro y, cuando lo tiene cerca, se lanza. Por la noche corre en círculos por el pasillo. Ladra sin parar a la ventana. A veces, cuando lo frenas, te muerde la manga. Es fácil pensar que a {name} le pasa algo raro, o que es así y no hay nada que hacer. Pero casi todo lo que hace tiene nombre.\n\n## why\nLos perros comparten un mismo lenguaje. Lo que hace tu perro lo hacen miles de perros, por las mismas razones: emoción, miedo, costumbre o energía sin gastar. Los adiestradores han visto estas conductas tantas veces que les han puesto nombre. Y eso es una buena noticia: si una conducta tiene nombre, tiene una causa conocida y un primer paso que suele funcionar. No es culpa tuya ni de tu perro, y no es su carácter para siempre. Es algo que ha aprendido o que siente, y se puede trabajar.\n\n## steps\n1. La tortuga: se tumba y espera, fijo en otro perro que se acerca, y suele reaccionar cuando lo tiene cerca. Aquí tumbarse es una señal de aviso, no de calma. Por qué: tensión ante el encuentro. Primer paso: no esperes a ver qué pasa; crea distancia o sigue andando antes de que llegue el otro perro.\n2. Los zoomies: carreras en círculos a toda velocidad, a menudo al final del día o después del baño, sobre todo en cachorros. Por qué: energía y emoción acumuladas que salen de repente. Primer paso: no lo persigas ni lo animes; deja espacio, espera a que pase y dale más paseo y olfateo durante el día.\n3. Reaccionar a otros perros: ladra, tira o se lanza al ver a otro perro atado. Por qué: suele ser miedo, frustración por no poder saludar o mucha emoción. Primer paso: más distancia; lo trabajarás en los mundos de la calle.\n4. El mordisco redirigido: te muerde la manga o la pierna cuando está muy excitado o no puede llegar a lo que quiere. Por qué: la tensión tiene que salir y tú estás al lado. Primer paso: no lo riñas; aléjate de lo que lo excita, sin movimientos bruscos, y espera a que se calme.\n5. Ladrar sin parar: ladra a la ventana, a un ruido o a ti, y no para. Por qué: está tan activado que no puede escuchar. Primer paso: no grites ni le pidas nada; espera a que se calme. Lo verás en «Primero, calma».\n\n## example\n### {name} y el perro del portal\nVas por la acera de tu calle y, a lo lejos, sale un perro de un portal. {name} se tumba en el suelo, con la mirada fija y el cuerpo rígido. Antes creías que se cansaba. Ahora sabes que es la tortuga. No esperas a ver qué pasa: dices su nombre una vez, das media vuelta y cruzas a la otra acera. {name} se levanta y te sigue. Desde lejos, el otro perro pasa de largo. La próxima vez giras un poco antes, y {name} ni se tumba.\n\n## compare\n### do\nPonerle nombre a lo que ves y buscar su primer paso: la tortuga pide distancia, los zoomies piden espacio y el ladrido sin parar pide calma.\n### dont\nPensar que tu perro es así y que no hay nada que hacer, o tomártelo como algo personal, como si lo hiciera para fastidiarte.\n\n## tip\nPrueba hoy: apunta una cosa que hace tu perro y que creías solo suya. Busca su nombre en esta lección y prueba su primer paso.\n\n## takeaways\n- Lo que hace tu perro lo hacen miles de perros.\n- Si tiene nombre, tiene una causa y un primer paso.\n- No es tu perro: es un perro. Y eso tiene arreglo.\n\n## images\n### theory-named-behaviours-1\n- alt: Tres perros distintos, en tres sitios distintos, hacen la misma postura: tumbados y con la mirada fija hacia delante\n- caption: Lo que hace tu perro lo hacen muchos perros\n\n### theory-named-behaviours-2\n- alt: En la acera, el perro tumbado mira fijo a otro perro que se acerca a lo lejos; la persona ya gira para cruzar a la otra acera\n- caption: La tortuga pide distancia, antes de que llegue el otro perro\n\n"
      },
      "files": [
        "media/theory-named-behaviours-1.png",
        "media/theory-named-behaviours-2.png"
      ]
    },
    "theory-park-mix": {
      "config": {
        "id": "theory-park-mix",
        "kind": "theory",
        "images": [
          "theory-park-mix-1",
          "theory-park-mix-2"
        ],
        "compare": {},
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# El parque lleno\n\n## heading\nTodo se acumula en el parque\n\n## hook\nEntráis al parque y {name} va bien. Pasa un corredor y no le quita ojo. Luego una bici, y da un salto al final de la correa. Cuando encuentra un trozo de bocadillo en el suelo, ya no te oye: ni Déjalo ni Vamos funcionan. Cada cosa por separado la sabe hacer; todas seguidas, no.\n\n## why\nCada estímulo, es decir, cada cosa que le llama la atención, sube un poco su excitación: el nivel de alerta y nervios de su cuerpo. Esa excitación no baja en cuanto el corredor se va; tarda minutos. Si llega otro estímulo antes, se suma, como agua en un vaso. Cuando el vaso rebosa, tu perro pasa su umbral, el punto en que ya no puede pensar ni escucharte, y reacciona. No es desobediencia: es un cuerpo desbordado. Por eso en el parque lleno no basta con saber las señales. Tu trabajo es vaciar el vaso entre un estímulo y el siguiente.\n\n## steps\n1. Antes de entrar, mira el parque desde el borde: por dónde pasan los corredores y las bicis, y qué zonas quedan más tranquilas.\n2. Elige el camino con más distancia. Si se acerca algo rápido, recoge correa y apártate antes de que tu perro se quede mirándolo fijo.\n3. Atiende una cosa cada vez: primero lo que se mueve rápido, con Vamos; después la comida del suelo, con Déjalo.\n4. Después de cada estímulo, haz una pausa de olfato en la hierba. Olfatear despacio baja la excitación y, además, le sirve de premio.\n5. Si ya no coge golosinas, no te oye o tira sin parar, ha pasado su umbral: date la vuelta y salid del parque.\n\n## example\n### {name} en el parque del estanque\nEs sábado por la mañana y entras con {name} al parque del estanque, con la correa de 3 metros. Pasa un corredor y {name} se pone en tensión, con las orejas hacia delante. Recoges correa, dices «Vamos» y os apartáis hacia la hierba. Allí le dejas olfatear un arbusto un minuto, hasta que su cola vuelve a moverse suelta. Luego aparece una bici: la mira, pero coge la golosina. Junto a un banco hay pan en el suelo; «Déjalo», y otra pausa de olfato. Al cuarto de hora empieza a tirar sin parar, así que dais la vuelta. Mañana, diez minutos.\n\n## compare\n### do\nHacer una pausa de olfato después de cada estímulo, apartados del camino. Así la excitación baja antes de que llegue el siguiente.\n### dont\nSeguir el paseo de corrido porque cada cosa ha salido bien por separado. La excitación se va sumando hasta que rebosa.\n\n## tip\nPrueba hoy: en tu próximo paseo por el parque, haz una pausa de olfato de un minuto después de cada corredor, bici o perro que os cruce.\n\n## takeaways\n- Cada estímulo suma excitación, y tarda minutos en bajar.\n- Una cosa cada vez: primero lo rápido, después la comida.\n- Distancia y pausas de olfato vacían el vaso.\n- Si ya no come ni te oye, salid del parque.\n\n## images\n### theory-park-mix-1\n- alt: A la izquierda, un corredor, una bici y comida, numerados del uno al tres, llenan un vaso hasta casi la línea discontinua; a la derecha, {name} olfatea la hierba y el vaso ha bajado\n- caption: Cada estímulo llena el vaso; olfatear lo vacía\n\n### theory-park-mix-2\n- alt: En el parque, lejos del camino, {name} olfatea un arbusto con la correa larga floja mientras un corredor pasa al fondo\n- caption: Lejos del camino, una pausa de olfato\n\n"
      },
      "files": [
        "media/theory-park-mix-1.png",
        "media/theory-park-mix-2.png"
      ]
    },
    "theory-poste": {
      "config": {
        "id": "theory-poste",
        "kind": "theory",
        "images": [
          "theory-poste-1",
          "theory-poste-2"
        ],
        "compare": {
          "do": "theory-poste-do",
          "dont": "theory-poste-dont"
        },
        "steps": 5,
        "takeaways": 3
      },
      "text": {
        "es": "# Quedarse quieto como un poste\n\n## heading\nTirar no lleva a ninguna parte\n\n## hook\n{name} ve algo interesante, se lanza y notas el tirón en el brazo. Lo natural es seguirle unos pasos para no forcejear, o tirar tú hacia atrás para frenar. Las dos cosas parecen razonables, y las dos hacen que mañana tire un poco más.\n\n## why\nPara tu perro, la correa es información. Si tira y avanzáis, aunque sea medio paso, aprende que tirar le acerca a lo que quiere: el tirón ha funcionado. Si tiras tú hacia atrás, su cuerpo responde empujando en contra. Es un reflejo, el mismo que te hace inclinarte hacia delante cuando alguien te empuja, y así acabáis los dos tirando más fuerte. El poste rompe ese círculo: mientras la correa está tensa no pasa nada, ni hacia delante ni hacia atrás. Cuando se afloja, el camino se abre otra vez. Tu perro no necesita entender la regla: la descubre repitiéndola.\n\n## steps\n1. Lleva la mano de la correa cerca de tu cintura, para notar enseguida cuándo empieza a tensarse.\n2. En cuanto la correa se tense, párate del todo: pies quietos, brazo pegado al cuerpo y sin tirar.\n3. Espera en silencio. No le llames ni le repitas nada: deja que sea él quien encuentre la salida.\n4. Cuando la correa se afloje, porque se gira, da un paso atrás o te mira, márcalo con un «bien» suave.\n5. Echa a andar enseguida. Seguir caminando es su premio; si quieres, añade una golosina junto a tu pierna.\n\n## example\n### {name} y el olor de la panadería\nPasáis por delante de la panadería y {name} se lanza hacia la puerta. La correa se tensa y te paras como un poste, con la mano junto a la cintura. {name} tira, olfatea el aire y vuelve a tirar. Pasan unos segundos largos. De pronto se gira para ver por qué no avanzáis, y la correa cuelga. «Bien», y seguís andando. Diez metros después lo intenta otra vez, pero ahora se gira antes. Al tercer intento ya ni siquiera tensa la correa.\n\n## compare\n### do\nPararte con el brazo pegado al cuerpo y esperar a que la correa se afloje. En cuanto afloja, seguís.\n### dont\nDar «solo un pasito» con la correa tensa para no forcejear. Ese pasito le paga el tirón.\n\n## tip\nPrueba hoy: en un tramo tranquilo de tu calle, haz poste cada vez que la correa se tense. Solo cinco minutos, y fíjate en cuánto tarda en aflojar.\n\n## takeaways\n- Si avanzas mientras tira, tirar le funciona.\n- Si tiras hacia atrás, aprende a tirar más fuerte.\n- Correa floja, camino abierto: seguid en cuanto afloje.\n\n## images\n### theory-poste-1\n- alt: Una persona se echa hacia atrás tirando de la correa mientras {name} empuja hacia delante con más fuerza\n- caption: Si tiras hacia atrás, él empuja hacia delante\n\n### theory-poste-2\n- alt: Delante de una panadería, la persona está quieta y {name} se gira hacia ella con la correa colgando\n- caption: {name} se gira, la correa cuelga y seguís\n\n"
      },
      "files": [
        "media/theory-poste-1.png",
        "media/theory-poste-2.png",
        "media/theory-poste-do.png",
        "media/theory-poste-dont.png"
      ]
    },
    "theory-slack-u": {
      "config": {
        "id": "theory-slack-u",
        "kind": "theory",
        "images": [
          "theory-slack-u-1",
          "theory-slack-u-2"
        ],
        "compare": {
          "do": "theory-slack-u-do",
          "dont": "theory-slack-u-dont"
        },
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# La correa en U\n\n## heading\nLa correa se tensa sin avisar\n\n## hook\nSalís con la correa colgando y todo va bien. Unos metros después notas el tirón en el brazo y no sabes en qué momento empezó. Haces poste, se afloja, seguís, y al rato otra vez. Parece que la tensión llega de golpe, pero casi nunca es así: la correa te avisa antes, si sabes mirarla.\n\n## why\nTu perro camina más deprisa que tú y la calle está llena de olores. Cuando algo le interesa, acelera poco a poco, y la correa cambia de forma. Primero cuelga en U, honda: vais juntos. Luego la curva se acorta y queda una J, todavía floja pero cerca de tu mano: se está adelantando. Al final, recta. En la J aún te escucha, porque su atención no está del todo en el olor. Con la correa tensa ya está enganchado y le cuesta mucho más volver. Por eso conviene actuar en la J. Y no con el brazo: si lo estiras para que no se tense, la U sigue ahí, pero él aprende que puede ir delante.\n\n## steps\n1. Lleva la mano de la correa quieta junto a tu cintura y mira la correa de vez en cuando, no solo a tu perro.\n2. Lee su forma: U honda, vais juntos; J, se está adelantando; recta, ya tira y toca hacer poste.\n3. En cuanto veas la J, cambia tú antes de la tensión: frena un poco el paso o di su nombre una vez, en voz suave.\n4. Si sigue alejándose, da media vuelta con calma y camina hacia el otro lado. Cuando te sigue, la U vuelve sola.\n5. En cuanto vuelva a tu lado, márcalo con un «bien» suave, que le señala el momento exacto, y dale una golosina junto a tu pierna.\n\n## example\n### {name} y los jardines de la acera\nVais por la acera de los jardines, la de las flores y el banco. {name} huele el macizo de flores, acelera y la U se acorta hasta quedar en J. Frenas el paso y dices su nombre una vez, bajito. Esta vez no te oye y sigue hacia las flores, así que das media vuelta con calma y caminas hacia el otro lado. {name} te sigue, la correa vuelve a colgar en U y llega a tu pierna: «bien» y golosina. Junto al banco aparece otra J; dices su nombre y vuelve a la primera.\n\n## compare\n### do\nMano quieta junto a la cintura. Si la U se cierra en J, cambias tú: frenas, dices su nombre o das media vuelta.\n### dont\nEstirar el brazo hacia delante para que la correa no se tense. La U se mantiene, pero tu mano le sigue y aprende a ir delante.\n\n## tip\nPrueba hoy: en un tramo de tu calle, cuenta cuántas veces ves la J antes de que la correa se tense. Cada J que pillas es un tirón menos.\n\n## takeaways\n- U, vais juntos; J, se adelanta; recta, ya tira.\n- Actúa en la J: todavía te escucha.\n- La U viene de que esté cerca, no de tu brazo.\n- Si vuelve a tu lado, «bien» y golosina junto a tu pierna.\n\n## images\n### theory-slack-u-1\n- alt: Tres escenas numeradas de la misma pareja: con la correa en U, {name} va con calma; con la correa en J, se adelanta mirando algo; con la correa recta, tira\n- caption: U, J, recta: la J es el aviso\n\n### theory-slack-u-2\n- alt: La persona camina de vuelta, alejándose de unos arbustos, y {name} la sigue con la correa colgando en U; una flecha curva señala la media vuelta\n- caption: Media vuelta: cuando te sigue, la U vuelve\n\n"
      },
      "files": [
        "media/theory-slack-u-1.png",
        "media/theory-slack-u-2.png",
        "media/theory-slack-u-do.png",
        "media/theory-slack-u-dont.png"
      ]
    },
    "theory-visual-shields": {
      "config": {
        "id": "theory-visual-shields",
        "kind": "theory",
        "images": [
          "theory-visual-shields-1",
          "theory-visual-shields-2"
        ],
        "compare": {
          "do": "theory-visual-shields-do",
          "dont": "theory-visual-shields-dont"
        },
        "steps": 5,
        "takeaways": 4
      },
      "text": {
        "es": "# Escudos visuales y distancia\n\n## heading\nSe queda clavado mirando\n\n## hook\nVais por la acera y {name} ve un patinete que se acerca, o un perro al otro lado de la calle. Se para en seco, con las orejas hacia delante y el cuerpo rígido. Le llamas y no te oye. Unos segundos después ladra, tira o se lanza, y no sabes en qué momento se torció el paseo.\n\n## why\nCada perro tiene un umbral: el punto, a cierta distancia de lo que le inquieta, a partir del cual deja de poder pensar. Por debajo del umbral mira, te oye y acepta comida. Por encima, solo reacciona. Dos cosas lo acercan a ese punto: lo cerca que está y lo mucho que lo ve. Por eso quedarse mirando fijamente es la primera señal: si nada corta esa mirada, la tensión sube sola. No es desobediencia ni enfado; es miedo o excitación. Un coche aparcado, un contenedor, un seto o tu propio cuerpo le tapan la vista, y unos metros más bajan la presión.\n\n## steps\n1. Al salir, fíjate en los escudos de tu calle: coches aparcados, contenedores, setos. Sirve lo que tape de verdad su vista.\n2. En cuanto veas lo que le inquieta, antes de que se quede mirando, pon un escudo entre los dos. Con algo rápido, como un patinete, usa el más cercano.\n3. Si no hay escudo cerca, ponte tú: camina por el lado de lo que le inquieta, para que tu cuerpo le tape la vista.\n4. Gana distancia: cambia de acera, date la vuelta o espera detrás del escudo hasta que pase. Si dudas, más distancia.\n5. Detrás del escudo, si te mira o olfatea el suelo, márcalo con un «bien» suave y dale una golosina. Si no puede comer, aléjate más.\n\n## example\n### {name} y el patinete de la calle del mercado\nVais por la acera de la calle del mercado y oyes un patinete que se acerca por la calzada. {name} levanta la cabeza y adelanta las orejas. Antes de que se quede mirando, das dos pasos y os ponéis detrás de un coche aparcado. {name} estira el cuello para buscarlo, pero el coche le tapa la vista. En cuanto te mira, le dices «bien» y le das una golosina. El patinete pasa de largo y seguís. La primera vez tarda en aceptar la golosina; a la tercera, ya se gira hacia ti al oír el ruido.\n\n## compare\n### do\nEn cuanto ves lo que le inquieta, antes de que se quede mirando, ganar distancia: darte la vuelta o ponerte detrás de un coche. Luego, «bien» y golosina.\n### dont\nQuedarte en medio de la acera esperando a que «se acostumbre» mientras mira fijamente. Así la tensión sube hasta que ladra o se lanza.\n\n## tip\nPrueba hoy: en tu paseo de siempre, localiza tres escudos que podrías usar, como un coche, un contenedor o un seto. Solo mirarlos, sin usarlos aún.\n\n## takeaways\n- Si no lo ve, le cuesta menos seguir contigo.\n- Coches, contenedores, setos y tu cuerpo le tapan la vista.\n- Actúa antes de que se quede mirando.\n- Si dudas, más distancia: cambia de acera o date la vuelta.\n\n## images\n### theory-visual-shields-1\n- alt: Vista desde arriba en dos partes: a la izquierda, {name} en la acera ve pasar un patinete sin nada en medio; a la derecha, un coche aparcado entre {name} y el patinete corta su línea de vista\n- caption: Un coche aparcado corta la línea de vista\n\n### theory-visual-shields-2\n- alt: En la acera, la persona y {name} esperan detrás de un coche aparcado; al otro lado del coche pasa un patinete y {name}, con la correa floja, mira a la persona\n- caption: Detrás del coche, {name} te mira a ti\n\n"
      },
      "files": [
        "media/theory-visual-shields-1.png",
        "media/theory-visual-shields-2.png",
        "media/theory-visual-shields-do.png",
        "media/theory-visual-shields-dont.png"
      ]
    }
  },
  "nodes": {
    "alone-door": {
      "config": {
        "id": "alone-door",
        "mode": "minigame",
        "prerequisites": [],
        "simulation": {
          "minigame": "alone"
        },
        "exercises": [
          {
            "metric": "timing",
            "key": "node.alonedoor.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.alonedoor.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-home-rest-1"
            }
          }
        ]
      },
      "text": {
        "es": "# En casa · ¿Abro o no abro?\n\n## primer\n### card 1\nRecuerda: si solo protesta, espera; si hay pánico o se cumple el tiempo, abre la puerta. Si se queda rígido, acorta el paso. Si está tranquilo, marca y premia.\n- caption: Un espacio pequeño y conocido, con la puerta abierta\n\n## checkpoint\n### tq1\n{name} gimotea tras la puerta pero respira con normalidad. ¿Qué haces?\n- [x] Espero sin hablarle ni abrir\n- [ ] Abro enseguida para que no sufra\n- [ ] Le riño para que se calle\n- why: Si solo protesta, abrir le enseña que llorar abre la puerta; espera, con un límite de tiempo.\n\n### tq2\n{name} babea, araña la puerta y no quiere la golosina. ¿Qué haces?\n- [x] Abro la puerta y vuelvo a un paso más fácil\n- [ ] Espero a que se canse\n- [ ] Cierro más fuerte la puerta\n- why: Eso es pánico, no frustración: abre ya y para el entrenamiento si se repite, y consulta con un profesional.\n\n### tq3\nHan pasado más de 10 minutos de llanto seguido con un perro adulto. ¿Qué haces?\n- [x] Abro la puerta y acorto el paso la próxima vez\n- [ ] Sigo esperando hasta que se rinda\n- [ ] Le grito desde fuera\n- why: El tiempo máximo es 10 minutos (2 en cachorros menores de 4 meses): pasado ese límite, se abre siempre.\n\n## exercises\n- timing: En casa: con la puerta abierta, deja una golosina en su espacio y mira si entra solo.\n- tension: En casa: haz el microcierre de un segundo con la puerta y ábrela con tu señal de liberación.\n"
      },
      "files": [
        "media/theory-home-rest-1.png"
      ]
    },
    "bark-home": {
      "config": {
        "id": "bark-home",
        "mode": "minigame",
        "prerequisites": [],
        "simulation": {
          "minigame": "bark-home"
        },
        "exercises": [
          {
            "metric": "timing",
            "key": "node.barkhome.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.barkhome.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-calm-first-1"
            }
          }
        ]
      },
      "text": {
        "es": "# En casa · Ladra en casa\n\n## primer\n### card 1\nRecuerda: quita el motivo del ladrido, espera sin añadir ruido y premia el silencio en cuanto llegue.\n- caption: Sin motivo, hay menos ladrido; con silencio, hay premio\n\n## checkpoint\n### tq1\n¿Qué haces si ladra a la ventana?\n- [x] Quito el motivo: cierro la cortina\n- [ ] Le grito «calla» más fuerte\n- [ ] Le doy una golosina para que pare\n- why: Lo que baja el ladrido es quitar el motivo, no sumar ruido ni pagar el ladrido.\n\n### tq2\n¿Cuándo le dices «bien»?\n- [x] En cuanto hace una pausa en silencio\n- [ ] Mientras sigue ladrando\n- [ ] Cuando ya ha pasado una hora\n- why: Lo que se premia se repite: marca y premia el silencio, aunque dure poco.\n\n### tq3\n¿Y si ladra para pedirte atención?\n- [x] No lo miro ni le hablo hasta que calle\n- [ ] Le hablo para que se calme\n- [ ] Lo miro fijamente hasta que pare\n- why: Mirarlo o hablarle le paga el ladrido; cuando se calla o se tumba, le haces caso.\n\n## exercises\n- timing: En casa: cuando ladre, quita el motivo o espera sin hablarle y premia la primera pausa.\n- tension: En casa: apunta cuántos segundos de silencio consigue antes del premio.\n\n"
      },
      "files": [
        "media/theory-calm-first-1.png"
      ]
    },
    "blind-corner": {
      "config": {
        "id": "blind-corner",
        "mode": "stage",
        "prerequisites": [
          "walk-distraction"
        ],
        "simulation": {
          "scenario": {
            "world": 3,
            "theme": "quiet_suburb",
            "fixedStep": 0.016666666666666666,
            "leashLength": 2,
            "leashTolerance": 0.1,
            "quickSpeed": 2,
            "walkStrength": 0.6,
            "handlerStart": {
              "x": 0,
              "y": 0
            },
            "dogStart": {
              "x": 1,
              "y": 0
            },
            "waypoint": {
              "x": 30,
              "y": 32
            },
            "waypoints": [
              {
                "x": 30,
                "y": 0
              }
            ],
            "waypointRadius": 2,
            "walls": [
              {
                "from": {
                  "x": 8,
                  "y": 5
                },
                "to": {
                  "x": 25,
                  "y": 5
                }
              },
              {
                "from": {
                  "x": 25,
                  "y": 5
                },
                "to": {
                  "x": 25,
                  "y": 26
                }
              },
              {
                "from": {
                  "x": 25,
                  "y": 26
                },
                "to": {
                  "x": 8,
                  "y": 26
                }
              },
              {
                "from": {
                  "x": 8,
                  "y": 26
                },
                "to": {
                  "x": 8,
                  "y": 5
                }
              },
              {
                "from": {
                  "x": -4,
                  "y": -4.5
                },
                "to": {
                  "x": 35,
                  "y": -4.5
                }
              },
              {
                "from": {
                  "x": 35,
                  "y": -4.5
                },
                "to": {
                  "x": 35,
                  "y": 36
                }
              }
            ],
            "scenery": [
              {
                "type": "bench",
                "pos": {
                  "x": 10,
                  "y": -3.2
                },
                "angle": 0
              },
              {
                "type": "bin",
                "pos": {
                  "x": 11.8,
                  "y": -3.2
                }
              },
              {
                "type": "mailbox",
                "pos": {
                  "x": 18,
                  "y": -3.1
                }
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 24,
                  "y": -3.2
                }
              },
              {
                "type": "mailbox_row",
                "pos": {
                  "x": 33.2,
                  "y": 14
                },
                "angle": 1.5707963267948966
              },
              {
                "type": "conifer",
                "pos": {
                  "x": 1.9010853825369853,
                  "y": 3.0761105318553748
                }
              },
              {
                "type": "bin",
                "pos": {
                  "x": 4.17553947744891,
                  "y": -3.882480942737311
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 8.389864170155489,
                  "y": 3.376062386855483
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 14.177286883234046,
                  "y": -2.6721132820937785
                },
                "angle": 0
              },
              {
                "type": "garden_gnome",
                "pos": {
                  "x": 17.014899441041052,
                  "y": 2.9233827385120095
                }
              },
              {
                "type": "hedge",
                "pos": {
                  "x": 21.078986703115515,
                  "y": -3.251976335281506
                },
                "angle": 0
              },
              {
                "type": "fence",
                "pos": {
                  "x": 23.553254404501057,
                  "y": 3.5363226515240966
                },
                "angle": 0
              },
              {
                "type": "bush",
                "pos": {
                  "x": 29.619046274223365,
                  "y": -3.85768015710637
                }
              },
              {
                "type": "mailbox",
                "pos": {
                  "x": 32.875739875389264,
                  "y": 2.042986045125872
                }
              },
              {
                "type": "scooter",
                "pos": {
                  "x": 26.230938013317065,
                  "y": 7.03620353094302
                }
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 33.91003826004453,
                  "y": 10.539525988628156
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 27.330877882568167,
                  "y": 14.056186124286619
                },
                "angle": 1.5707963267948966
              },
              {
                "type": "mailbox_row",
                "pos": {
                  "x": 32.60447543901391,
                  "y": 18.61845620402601
                },
                "angle": 1.5707963267948966
              },
              {
                "type": "bin",
                "pos": {
                  "x": 26.829656520904972,
                  "y": 22.663307043001986
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 33.45020854570903,
                  "y": 26.547826724685727
                }
              },
              {
                "type": "mailbox",
                "pos": {
                  "x": 26.585356062976643,
                  "y": 30.62460970722605
                }
              }
            ],
            "cues": [
              "lets-go"
            ],
            "dogGoalSpeed": 1.6,
            "dogFixationSpeed": 1,
            "dogReturnSpeed": 1.6,
            "dogReturnDistance": 1,
            "wanderMaxAngle": 0.5,
            "wanderTurnRate": 2,
            "distractor": {
              "kind": "bicycle",
              "speed": 3.5,
              "triggerRadius": 16,
              "activateAfterMeters": 14,
              "startOffset": 28,
              "path": {
                "from": {
                  "x": 30.5,
                  "y": 30
                },
                "to": {
                  "x": 30.5,
                  "y": -2
                }
              }
            },
            "moreDistractors": [],
            "calmSeconds": 3,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "ranges": {
              "reconnectionSeconds": {
                "worst": 1.5,
                "best": 0.3
              },
              "reactivityThreshold": {
                "worst": 15,
                "best": 60
              },
              "checkInMeanInterval": {
                "worst": 14,
                "best": 5
              }
            },
            "arousal": {
              "k": 30,
              "minDistance": 2,
              "decayPerSecond": 3,
              "rigidPullRate": 4,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "cue": {
              "cooldownSeconds": 3,
              "fixatedFactor": 0.3,
              "repeatFactor": 0.5,
              "arousalDrop": 10,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "reaction": {
              "alertFraction": 0.6,
              "lungeAccel": 1.5,
              "lungeMaxSpeed": 4,
              "alertSlowdown": 0.85
            },
            "sintonia": {
              "minSpeed": 0.4,
              "minTurnRate": 0.2,
              "maxTurnRate": 1.8,
              "turnWindow": 0.5,
              "holdSeconds": 2
            },
            "goSniff": {
              "offerSeconds": 3,
              "durationSeconds": 4,
              "speed": 0.4,
              "decayFactor": 3
            },
            "turnAngle": 0.7853981633974483,
            "followSeconds": 1.5,
            "correctionWaitSeconds": 4,
            "pullStrength": 0.8,
            "configVersion": "bundled",
            "camera": {
              "closeZoom": 2.2,
              "farZoom": 1.5,
              "padding": 90,
              "smoothing": 3
            },
            "endCondition": {
              "kind": "reach-waypoint"
            }
          }
        },
        "exercises": [
          {
            "metric": "poste",
            "key": "node.corner.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.corner.exercise2"
          },
          {
            "metric": "timing",
            "key": "node.corner.exercise3"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-blind-corner-1"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 3 · La esquina ciega\n\n## primer\n### card 1\nRecuerda: frena unos pasos antes de la esquina, recógelo a tu lado y dobla por la parte ancha.\n- caption: Por la parte ancha de la acera, ves venir lo que aparece\n\n## checkpoint\n### tq1\n¿Por qué asusta tanto lo que sale de una esquina?\n- [x] Porque aparece de golpe y muy cerca\n- [ ] Porque no conoce bien esa calle\n- [ ] Porque no ha visto nunca una bici\n- why: Lo que asusta es lo cerca y lo de repente: la distancia le da tiempo, y una esquina ciega la borra.\n\n### tq2\n¿Cuándo empiezas a frenar ante una esquina ciega?\n- [x] Tres o cuatro pasos antes de llegar\n- [ ] Justo al llegar a la esquina\n- [ ] Cuando ya ves la otra calle\n- why: En la misma esquina ya es tarde: frenar tres o cuatro pasos antes le da tiempo a llegar a tu lado.\n\n### tq3\n¿Cómo doblas una esquina ciega con tu perro?\n- [x] Por la parte ancha, con él a tu lado\n- [ ] Pegado a la pared, con él a tu lado\n- [ ] Por la parte ancha, con él delante\n- why: Por la parte ancha y a tu lado ves la otra calle antes que él, y lo que venga te encuentra a unos metros.\n\n## exercises\n- poste: En la calle: antes de cada esquina, frena y deja que tu perro se acerque a tu lado.\n- tension: En la calle: dobla las esquinas despacio y cuenta cuántas veces se tensa la correa.\n- timing: En casa: premia con la voz justo cuando tu perro aparta la vista de algo que lo inquieta.\n\n"
      },
      "files": [
        "media/theory-blind-corner-1.png"
      ]
    },
    "calm-first": {
      "config": {
        "id": "calm-first",
        "mode": "minigame",
        "prerequisites": [
          "home-rest"
        ],
        "simulation": {
          "minigame": "calm-first"
        },
        "exercises": [
          {
            "metric": "timing",
            "key": "node.calmfirst.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.calmfirst.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-calm-first-1"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 1 · Primero, calma\n\n## primer\n### card 1\nRecuerda: primero, calma. Mientras ladra o corre, no le pides nada; cuando se sienta y te mira, tu señal.\n- caption: Primero la calma; después, la señal\n\n## checkpoint\n### tq1\n¿Por qué no aprende mientras ladra sin parar?\n- [x] Está tan alerta que tus palabras son ruido\n- [ ] Porque no quiere hacerte caso\n- [ ] Porque tu señal no es bastante clara\n- why: Un perro muy excitado solo atiende a lo que lo ha disparado: en ese estado, tus palabras son ruido.\n\n### tq2\nLadra sin parar a la visita. ¿Qué haces?\n- [x] Espero sin moverme ni hablar\n- [ ] Le repito «calla» más fuerte\n- [ ] Le doy una golosina para que pare\n- why: No añadas energía: ni órdenes, ni gritos, ni golosinas. Espera sin moverte a que se calme.\n\n### tq3\n¿Cuándo le pides algo con tu señal?\n- [x] Cuando se sienta y te mira\n- [ ] Mientras ladra, para cortarlo\n- [ ] Mientras corre, para frenarlo\n- why: En cuanto se sienta o se tumba y te mira, ya puede escucharte: entonces sí, tu señal.\n\n## exercises\n- timing: En casa: si ladra sin parar, espera sin hablarle a que se calme antes de pedirle nada.\n- tension: En casa: márcalo con un «bien» suave cada vez que se tumbe en calma.\n\n"
      },
      "files": [
        "media/theory-calm-first-1.png"
      ]
    },
    "calm-hands": {
      "config": {
        "id": "calm-hands",
        "mode": "close_exercise",
        "prerequisites": [],
        "opensAfterLesson": "theory-bite-owner",
        "simulation": {
          "closeScenario": {
            "controls": "hand_drill",
            "distractor": {
              "kind": "hand",
              "speed": 0,
              "salience": 0.35,
              "triggerRadius": 6,
              "startPos": {
                "x": 1.8,
                "y": 1.8
              },
              "endPos": {
                "x": 1.8,
                "y": 1.8
              }
            },
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "cues": [],
            "calmSeconds": 2.5,
            "maxSeconds": 60,
            "settleSeconds": 4,
            "markBudget": 5,
            "configVersion": "hand-drill-v1",
            "reward": "treat"
          }
        },
        "exercises": [
          {
            "metric": "tension",
            "key": "node.calmhands.exercise1"
          },
          {
            "metric": "timing",
            "key": "node.calmhands.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-dog-as-dog-1"
            }
          },
          {
            "kind": "virtual-dog"
          }
        ]
      },
      "text": {
        "es": "# Mundo 1 · Manos y correa en calma\n\n## primer\n### card 1\nRecuerda: tu perro es un perro, no un juguete. Si una mano cerca lo emociona, no se la acerques a la boca: recoge la correa con calma y espera a que se relaje.\n- caption: En el suelo, a su altura, una mano es un juego\n\n### card 2\nEn el juego, mantén Recoger para que no alcance la mano, usa Poste si insiste y toca Marcar cuando esté en calma: tu perro recibe un premio.\n\n## checkpoint\n### tq1\nTu perro se emociona con una mano cerca. ¿Qué haces primero?\n- [x] Recojo la correa con calma para que no llegue a la mano\n- [ ] Le acerco más la mano para que la huela\n- [ ] Le hablo en voz alta hasta que pare\n- why: Recoger la correa mantiene la mano fuera de su alcance sin enfadarte: se relaja antes y la mano deja de ser un juego.\n\n### tq2\n¿Cuándo marcas?\n- [x] Cuando está en calma, justo antes de premiar\n- [ ] Cuando se lanza hacia la mano\n- [ ] Cuando ya tiene la mano en la boca\n- why: El marcador dice \"eso es lo que quiero\": solo tiene sentido en el instante en que está en calma.\n\n### tq3\nSe lanza a la mano y se queda corto. ¿Qué haces?\n- [x] Recojo la correa otra vez y espero a que se calme\n- [ ] Empiezo de nuevo el ejercicio con enfado\n- [ ] Le doy el premio para que se calme\n- why: Un intento fallido no pasa nada: recoges, esperas y marcas cuando vuelve a la calma. El premio llega solo con la calma.\n\n## exercises\n- tension: En casa: con la correa puesta, ofrece una mano y recoge la correa si se lanza. Marca la calma y dale un premio.\n- timing: En casa: practica un minuto al día; si se emociona demasiado, haz una pausa y vuelve a empezar con calma.\n\n## debrief\n- calm: ¡Se ha calmado con la mano cerca! Así se enseña: recoger, esperar, marcar y premiar.\n- notCalm: Aún no se ha calmado, y es normal al principio. Consejo: recoge la correa antes de que se emocione y espera sin hablarle.\n\n"
      },
      "files": [
        "media/theory-dog-as-dog-1.png"
      ]
    },
    "calm-zone-intro": {
      "config": {
        "id": "calm-zone-intro",
        "mode": "minigame",
        "prerequisites": [
          "leave-it-intro"
        ],
        "simulation": {
          "minigame": "barkdoku",
          "scenario": {
            "theme": "urban_street"
          }
        },
        "exercises": [
          {
            "metric": "tension",
            "key": "node.barkdoku.exercise1"
          },
          {
            "metric": "attention",
            "key": "node.barkdoku.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-visual-shields-1"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 4 · Guaudoku\n\n## primer\n### card 1\nRecuerda: busca escudos y distancia antes de que se quede mirando. Si no puede comer, aléjate más.\n- caption: Un coche aparcado corta la línea de vista\n\n## checkpoint\n### tq1\n¿Qué es el umbral de tu perro?\n- [x] La distancia a partir de la que solo reacciona\n- [ ] El tiempo que aguanta sin ladrar a otro perro\n- [ ] El momento en que ya se ha acostumbrado a algo\n- why: El umbral es el punto, a cierta distancia de lo que le inquieta, a partir del cual deja de poder pensar y solo reacciona.\n\n### tq2\nVes un perro y no hay escudo cerca. ¿Qué haces?\n- [x] Camino por su lado para taparle la vista\n- [ ] Me paro para que se acostumbre a mirarlo\n- [ ] Sigo recto y rápido para pasar cuanto antes\n- why: Si no hay escudo, ponte tú: camina por el lado de lo que le inquieta y tu cuerpo le tapa la vista.\n\n### tq3\nDetrás del escudo no acepta comida. ¿Qué haces?\n- [x] Me alejo más: cambio de acera o me doy la vuelta\n- [ ] Le insisto con la golosina hasta que coma\n- [ ] Espero ahí mismo hasta que se le pase solo\n- why: Si no puede comer, sigue por encima del umbral: aléjate más. Si dudas, más distancia.\n\n## exercises\n- tension: En el paseo de hoy: detecta 3 barreras visuales antes de que tu perro fije la mirada.\n- attention: Practica cambiar de acera o girar en U cuando veas un perro a menos de 10 metros.\n\n"
      },
      "files": [
        "media/theory-visual-shields-1.png"
      ]
    },
    "close-narrow-street-pass": {
      "config": {
        "id": "close-narrow-street-pass",
        "mode": "close_exercise",
        "prerequisites": [
          "scooter-crossing"
        ],
        "simulation": {
          "scenario": {
            "theme": "urban_street"
          },
          "closeScenario": {
            "controls": "leash_drill",
            "fixedStep": 0.016666666666666666,
            "leashMinLength": 0.5,
            "leashMaxLength": 2,
            "gatherRate": 1.5,
            "releaseRate": 2,
            "posteDamping": 0.35,
            "posteArousalDamping": 0.4,
            "shieldOcclusionDistance": 0.65,
            "shieldOffset": 0.8,
            "handlerBase": {
              "x": 0,
              "y": 0
            },
            "dogOffset": {
              "x": 0.9,
              "y": 0.1
            },
            "distractor": {
              "kind": "dog",
              "speed": 1.4,
              "triggerRadius": 6,
              "startPos": {
                "x": 1.8,
                "y": 12
              },
              "endPos": {
                "x": 1.8,
                "y": -6
              },
              "cue": "lets-go"
            },
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "arousal": {
              "k": 28,
              "minDistance": 1.5,
              "decayPerSecond": 3.5,
              "rigidPullRate": 5,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "reaction": {
              "alertFraction": 0.55,
              "lungeAccel": 2,
              "lungeMaxSpeed": 3.5,
              "alertSlowdown": 0.8
            },
            "cue": {
              "cooldownSeconds": 2.5,
              "fixatedFactor": 0.35,
              "repeatFactor": 0.5,
              "arousalDrop": 12,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "cues": [
              "lets-go"
            ],
            "calmSeconds": 2.5,
            "maxSeconds": 60,
            "reward": "treat",
            "settleSeconds": 4,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "configVersion": "close-exercise-v1"
          }
        },
        "exercises": [
          {
            "metric": "tension",
            "key": "node.closepass.exercise1"
          },
          {
            "metric": "timing",
            "key": "node.closepass.exercise2"
          },
          {
            "metric": "attention",
            "key": "node.closepass.exercise3"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-visual-shields-2"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 4 · Paso estrecho con distractor\n\n## primer\n### card 1\nRecuerda: en aceras estrechas, recoge la correa con calma y colócate entre tu perro y el que viene de frente.\n- caption: Posición de escudo y recogida de correa en paso estrecho\n\n## checkpoint\n### tq1\n¿Por qué te colocas entre tu perro y el perro que se aproxima?\n- [x] Para romper la línea de visión y evitar que la excitación aumente\n- [ ] Para forzar a los perros a saludarse\n- [ ] Para tirar con fuerza si el perro intenta correr\n- why: La postura de escudo bloquea la mirada fija y le da espacio y calma a tu perro antes de que se dispare la reactividad.\n\n### tq2\n¿Cómo debemos acortar la longitud de la correa en una acera estrecha?\n- [x] Recogiéndola con suavidad y manteniendo una curva relajada\n- [ ] Dando un tirón seco hacia atrás\n- [ ] Enrollándola en la mano hasta dejarla completamente rígida\n- why: Recoger con suavidad mantiene la correa funcional sin transmitir tensión rígida que alerte al perro.\n\n### tq3\n¿Cuándo es el mejor momento para hacer poste y premiar la calma?\n- [x] Hacer poste si hay un tirón repentino y premiar justo cuando desvía la mirada del otro perro\n- [ ] Premiar cuando el perro ya esté ladrando o tirando\n- [ ] Hacer poste todo el tiempo sin soltar holgura\n- why: Hacer poste amortigua la fuerza sin sacudidas y el marcador refuerza el instante exacto en que tu perro decide no fijarse.\n\n## exercises\n- tension: En la calle: practica recoger medio metro de correa con ambas manos sin dar tirones secos.\n- timing: En el paseo: colócate entre tu perro y un distractor que se acerca.\n- attention: En el parque: marca y premia cada vez que tu perro mire a otro perro y vuelva a mirarte.\n\n"
      },
      "files": [
        "media/theory-visual-shields-2.png"
      ]
    },
    "destroy": {
      "config": {
        "id": "destroy",
        "mode": "minigame",
        "prerequisites": [],
        "simulation": {
          "minigame": "destroy"
        },
        "exercises": [
          {
            "metric": "timing",
            "key": "node.destroy.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.destroy.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-home-rest-2"
            }
          }
        ]
      },
      "text": {
        "es": "# En casa · Destroza cosas\n\n## primer\n### card 1\nRecuerda: lo que no está a su alcance no se destroza. Guarda lo prohibido, deja masticables y cambia sin reñir.\n- caption: Lo prohibido, guardado; lo permitido, a mano\n\n## checkpoint\n### tq1\n¿Por qué destroza cosas?\n- [x] Morder es una necesidad y se aburre\n- [ ] Lo hace para fastidiarte\n- [ ] Sabe que está mal y lo hace igual\n- why: Morder es una necesidad del perro: no destroza por maldad ni por fastidiar.\n\n### tq2\nVes que muerde un zapato. ¿Qué haces?\n- [x] Le cambio el zapato por un masticable\n- [ ] Le riño para que lo suelte\n- [ ] Espero a que se canse\n- why: Un masticable a cambio, con calma, le enseña qué sí puede morder; reñir no.\n\n### tq3\nVuelves y hay un destrozo. ¿Qué haces?\n- [x] Recojo y guardo lo que alcanzaba\n- [ ] Le riño para que lo entienda\n- [ ] Le enseño el destrozo de cerca\n- why: No relaciona la bronca con lo que hizo hace horas; lo que funciona es retirar lo prohibido de su alcance.\n\n## exercises\n- timing: En casa: da una vuelta a su altura y guarda lo que pueda morder.\n- tension: En casa: deja dos masticables repartidos y cambia lo prohibido por uno de ellos.\n\n"
      },
      "files": [
        "media/theory-home-rest-2.png"
      ]
    },
    "dog-as-dog": {
      "config": {
        "id": "dog-as-dog",
        "mode": "minigame",
        "prerequisites": [],
        "simulation": {
          "minigame": "dog-as-dog"
        },
        "exercises": [
          {
            "metric": "timing",
            "key": "node.dogasdog.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.dogasdog.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-dog-as-dog-1"
            }
          },
          {
            "kind": "virtual-dog"
          }
        ]
      },
      "text": {
        "es": "# Mundo 1 · Un perro, no un peluche\n\n## primer\n### card 1\nRecuerda: en el suelo, en su cama y sin besos en la cara. Lo saludas cuando está en calma.\n- caption: En el suelo, a su altura, es un perro\n\n### card 2\nEn el juego, mira cómo está en cada paso y toca la acción que le ayuda: ignorar, a su cama o marcar. Achucharlo nunca le ayuda.\n\n## checkpoint\n### tq1\n¿Por qué no conviene cogerlo en brazos?\n- [x] Pierde el control de su propio cuerpo\n- [ ] Luego ya no querrá andar por la calle\n- [ ] Solo los cachorros lo necesitan\n- why: Para un perro, que lo levanten del suelo es perder el control de su cuerpo: muchos lo toleran, pocos lo disfrutan.\n\n### tq2\nSe sube al sofá. ¿Qué haces?\n- [x] Camino con calma hacia él, sin tocarlo\n- [ ] Lo dejo, que así está más a gusto\n- [ ] Le enseño un premio para que baje\n- why: Caminas con calma hacia él, sin tocarlo ni hablarle, hasta que baje; luego señalas su cama.\n\n### tq3\n¿Cuándo lo saludas al llegar a casa?\n- [x] Cuando apoya las cuatro patas en el suelo\n- [ ] En cuanto salta, para que se calme\n- [ ] Cuando te pide brazos con las patas\n- why: Lo saludas solo cuando está en calma: si salta, esperas sin hablarle; con las cuatro patas en el suelo, despacio.\n\n## exercises\n- timing: En casa: cuando te pida brazos, espera sin mirarle a que apoye las cuatro patas.\n- tension: En casa: si se sube al sofá, camina con calma hacia él, sin tocarlo, hasta que baje y vaya a su cama.\n\n"
      },
      "files": [
        "media/theory-dog-as-dog-1.png"
      ]
    },
    "doorbell-mat": {
      "config": {
        "id": "doorbell-mat",
        "mode": "minigame",
        "prerequisites": [
          "harness-ritual"
        ],
        "simulation": {
          "minigame": "doorbell-mat",
          "scenario": {
            "world": 2,
            "theme": "indoor_apartment",
            "fixedStep": 0.016666666666666666,
            "leashLength": 2,
            "leashTolerance": 0.1,
            "quickSpeed": 2,
            "walkStrength": 0.6,
            "handlerStart": {
              "x": 0,
              "y": 0
            },
            "dogStart": {
              "x": 1,
              "y": 0
            },
            "waypoint": {
              "x": 14,
              "y": 0
            },
            "waypoints": [],
            "waypointRadius": 2,
            "walls": [
              {
                "from": {
                  "x": -1,
                  "y": -1.7
                },
                "to": {
                  "x": 15,
                  "y": -1.7
                }
              },
              {
                "from": {
                  "x": -1,
                  "y": 1.7
                },
                "to": {
                  "x": 15,
                  "y": 1.7
                }
              },
              {
                "from": {
                  "x": 15,
                  "y": -1.7
                },
                "to": {
                  "x": 15,
                  "y": 1.7
                }
              }
            ],
            "scenery": [
              {
                "type": "plant",
                "pos": {
                  "x": 1.8,
                  "y": -1.25
                }
              },
              {
                "type": "shoe_rack",
                "pos": {
                  "x": 3.4,
                  "y": 1.25
                },
                "angle": 0
              },
              {
                "type": "coat_rack",
                "pos": {
                  "x": 6,
                  "y": -1.25
                }
              },
              {
                "type": "cabinet",
                "pos": {
                  "x": 9,
                  "y": 1.25
                },
                "angle": 0
              },
              {
                "type": "shelf",
                "pos": {
                  "x": 11.6,
                  "y": -1.25
                },
                "angle": 0
              },
              {
                "type": "dog_bed",
                "pos": {
                  "x": 0.9407456818968056,
                  "y": 1.1510622767498717
                }
              },
              {
                "type": "shoe_rack",
                "pos": {
                  "x": 4.326624035164714,
                  "y": -0.9982442343141883
                },
                "angle": 0
              },
              {
                "type": "shelf",
                "pos": {
                  "x": 5.999872644096613,
                  "y": 1.0328319085296243
                },
                "angle": 0
              },
              {
                "type": "coat_rack",
                "pos": {
                  "x": 9.286855392754077,
                  "y": -1.0630889832740649
                }
              },
              {
                "type": "sofa",
                "pos": {
                  "x": 12.504820343777537,
                  "y": 0.9882444341899826
                },
                "angle": 0
              }
            ],
            "cues": [
              "lets-go"
            ],
            "dogGoalSpeed": 1.6,
            "dogFixationSpeed": 1,
            "dogReturnSpeed": 1.6,
            "dogReturnDistance": 1,
            "wanderMaxAngle": 0.5,
            "wanderTurnRate": 2,
            "distractor": {
              "kind": "skateboard",
              "speed": 4,
              "triggerRadius": 14,
              "activateAfterMeters": 1000000000,
              "startOffset": 28
            },
            "moreDistractors": [],
            "calmSeconds": 3,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "ranges": {
              "reconnectionSeconds": {
                "worst": 1.5,
                "best": 0.3
              },
              "reactivityThreshold": {
                "worst": 15,
                "best": 60
              },
              "checkInMeanInterval": {
                "worst": 14,
                "best": 5
              }
            },
            "arousal": {
              "k": 30,
              "minDistance": 2,
              "decayPerSecond": 3,
              "rigidPullRate": 4,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "cue": {
              "cooldownSeconds": 3,
              "fixatedFactor": 0.3,
              "repeatFactor": 0.5,
              "arousalDrop": 10,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "reaction": {
              "alertFraction": 0.6,
              "lungeAccel": 1.5,
              "lungeMaxSpeed": 4,
              "alertSlowdown": 0.85
            },
            "sintonia": {
              "minSpeed": 0.4,
              "minTurnRate": 0.2,
              "maxTurnRate": 1.8,
              "turnWindow": 0.5,
              "holdSeconds": 2
            },
            "goSniff": {
              "offerSeconds": 3,
              "durationSeconds": 4,
              "speed": 0.4,
              "decayFactor": 3
            },
            "turnAngle": 0.7853981633974483,
            "followSeconds": 1.5,
            "correctionWaitSeconds": 4,
            "pullStrength": 0.8,
            "configVersion": "bundled",
            "camera": {
              "closeZoom": 2.2,
              "farZoom": 1.5,
              "padding": 90,
              "smoothing": 3
            },
            "endCondition": {
              "kind": "reach-waypoint"
            }
          }
        },
        "exercises": [
          {
            "metric": "timing",
            "key": "node.doorbell.exercise1"
          },
          {
            "metric": "attention",
            "key": "node.doorbell.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-doorbell-2"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 2 · La alfombra del timbre\n\n## primer\n### card 1\nRecuerda: al sonar el timbre, a la alfombra; marcas y premias solo cuando se tumba relajado.\n- caption: Suena el timbre y {name} se tumba en su alfombra\n\n## checkpoint\n### tq1\n¿Por qué corre tu perro a la puerta al oír el timbre?\n- [x] El timbre le anuncia algo emocionante\n- [ ] Quiere avisarte para que abras rápido\n- [ ] Le molesta el ruido agudo del timbre\n- why: El timbre casi siempre anuncia una visita o un paquete: es emoción y costumbre, no desobediencia.\n\n### tq2\nSuena el timbre y mira fijo la puerta. ¿Qué haces?\n- [x] Le digo «a la alfombra» una vez\n- [ ] Espero a ver si se calma él solo\n- [ ] Le doy una golosina para distraerlo\n- why: En cuanto suene, o en cuanto mire fijo la puerta o ladre, dile «a la alfombra» una vez, antes de que se dispare.\n\n### tq3\nEstá en la alfombra, de pie y gimiendo. ¿Qué haces?\n- [x] Espero sin hablarle a que se tumbe\n- [ ] Le doy la golosina por haber llegado\n- [ ] Le repito «a la alfombra» más fuerte\n- why: Si le das la golosina mientras sigue inquieto, le pagas la excitación; el «bien» llega cuando se tumba y suelta el cuerpo.\n\n## exercises\n- timing: En casa: pide a alguien que llame al timbre y premia a tu perro justo cuando se calma en su alfombra.\n- attention: En casa: cuando suene el timbre, espera a que tu perro te mire antes de abrir.\n\n"
      },
      "files": [
        "media/theory-doorbell-2.png"
      ]
    },
    "eat-objects": {
      "config": {
        "id": "eat-objects",
        "mode": "minigame",
        "prerequisites": [],
        "simulation": {
          "minigame": "eat-objects"
        },
        "exercises": [
          {
            "metric": "timing",
            "key": "node.eatobjects.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.eatobjects.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-leave-it-1"
            }
          }
        ]
      },
      "text": {
        "es": "# En casa · Se come lo que no es comida\n\n## primer\n### card 1\nRecuerda: si se lo ha tragado, al veterinario. Si no, guarda lo que suele coger, no lo persigas y cambia el objeto por una golosina mejor.\n- caption: Una golosina mejor hace soltar el objeto\n\n## checkpoint\n### tq1\n¿Qué haces si se ha tragado algo?\n- [x] Llamo al veterinario ya\n- [ ] Espero a ver si lo suelta\n- [ ] Intento que vomite en casa\n- why: Un objeto tragado puede ser una urgencia: llama a tu veterinario enseguida.\n\n### tq2\nCorre con un calcetín. ¿Qué haces?\n- [x] No lo persigo y le ofrezco una golosina\n- [ ] Corro tras él para quitárselo\n- [ ] Le grito que lo suelte ya\n- why: Perseguirlo se convierte en un juego; una golosina mejor le hace soltarlo.\n\n### tq3\n¿Qué previene más tragar cosas?\n- [x] Guardar lo que suele coger\n- [ ] Reñirlo cuando lo coge\n- [ ] Dejarlo probar para que aprenda\n- why: Prevenir es más seguro que entrenar: lo que no alcanza, no lo traga.\n\n## exercises\n- timing: En casa: guarda cinco cosas que suele coger, a su altura.\n- tension: En casa: practica el cambio con un juguete y una golosina mejor.\n\n"
      },
      "files": [
        "media/theory-leave-it-1.png"
      ]
    },
    "harness-ritual": {
      "config": {
        "id": "harness-ritual",
        "mode": "minigame",
        "prerequisites": [],
        "simulation": {
          "minigame": "harness-ritual",
          "scenario": {
            "world": 2,
            "theme": "indoor_apartment",
            "fixedStep": 0.016666666666666666,
            "leashLength": 2,
            "leashTolerance": 0.1,
            "quickSpeed": 2,
            "walkStrength": 0.6,
            "handlerStart": {
              "x": 0,
              "y": 0
            },
            "dogStart": {
              "x": 1,
              "y": 0
            },
            "waypoint": {
              "x": 8,
              "y": 0
            },
            "waypoints": [],
            "waypointRadius": 2,
            "walls": [
              {
                "from": {
                  "x": -1.5,
                  "y": -2.2
                },
                "to": {
                  "x": 9.5,
                  "y": -2.2
                }
              },
              {
                "from": {
                  "x": 9.5,
                  "y": -2.2
                },
                "to": {
                  "x": 9.5,
                  "y": 2.2
                }
              },
              {
                "from": {
                  "x": 9.5,
                  "y": 2.2
                },
                "to": {
                  "x": -1.5,
                  "y": 2.2
                }
              },
              {
                "from": {
                  "x": -1.5,
                  "y": 2.2
                },
                "to": {
                  "x": -1.5,
                  "y": -2.2
                }
              }
            ],
            "scenery": [
              {
                "type": "plant",
                "pos": {
                  "x": 0.6,
                  "y": -1.8
                }
              },
              {
                "type": "sofa",
                "pos": {
                  "x": 3.4,
                  "y": 1.75
                },
                "angle": 0
              },
              {
                "type": "shelf",
                "pos": {
                  "x": 6.2,
                  "y": -1.75
                },
                "angle": 0
              },
              {
                "type": "umbrella_stand",
                "pos": {
                  "x": 8.5,
                  "y": 1.8
                }
              },
              {
                "type": "elevator_panel",
                "pos": {
                  "x": 9.2,
                  "y": 0
                }
              },
              {
                "type": "elevator_panel",
                "pos": {
                  "x": 0.522305465489626,
                  "y": 1.3091696820687502
                }
              },
              {
                "type": "shelf",
                "pos": {
                  "x": 3.19955325499177,
                  "y": -1.3914776304271073
                },
                "angle": 0
              },
              {
                "type": "cabinet",
                "pos": {
                  "x": 4.850188520550728,
                  "y": 1.478831273270771
                },
                "angle": 0
              },
              {
                "type": "dog_bed",
                "pos": {
                  "x": 7.5959650002419945,
                  "y": -1.1445804553106427
                }
              }
            ],
            "cues": [
              "lets-go"
            ],
            "dogGoalSpeed": 1.6,
            "dogFixationSpeed": 1,
            "dogReturnSpeed": 1.6,
            "dogReturnDistance": 1,
            "wanderMaxAngle": 0.5,
            "wanderTurnRate": 2,
            "distractor": {
              "kind": "skateboard",
              "speed": 4,
              "triggerRadius": 14,
              "activateAfterMeters": 1000000000,
              "startOffset": 28
            },
            "moreDistractors": [],
            "calmSeconds": 3,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "ranges": {
              "reconnectionSeconds": {
                "worst": 1.5,
                "best": 0.3
              },
              "reactivityThreshold": {
                "worst": 15,
                "best": 60
              },
              "checkInMeanInterval": {
                "worst": 14,
                "best": 5
              }
            },
            "arousal": {
              "k": 30,
              "minDistance": 2,
              "decayPerSecond": 3,
              "rigidPullRate": 4,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "cue": {
              "cooldownSeconds": 3,
              "fixatedFactor": 0.3,
              "repeatFactor": 0.5,
              "arousalDrop": 10,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "reaction": {
              "alertFraction": 0.6,
              "lungeAccel": 1.5,
              "lungeMaxSpeed": 4,
              "alertSlowdown": 0.85
            },
            "sintonia": {
              "minSpeed": 0.4,
              "minTurnRate": 0.2,
              "maxTurnRate": 1.8,
              "turnWindow": 0.5,
              "holdSeconds": 2
            },
            "goSniff": {
              "offerSeconds": 3,
              "durationSeconds": 4,
              "speed": 0.4,
              "decayFactor": 3
            },
            "turnAngle": 0.7853981633974483,
            "followSeconds": 1.5,
            "correctionWaitSeconds": 4,
            "pullStrength": 0.8,
            "configVersion": "bundled",
            "camera": {
              "closeZoom": 2.2,
              "farZoom": 1.5,
              "padding": 90,
              "smoothing": 3
            },
            "endCondition": {
              "kind": "reach-waypoint"
            }
          }
        },
        "exercises": [
          {
            "metric": "poste",
            "key": "node.harness.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.harness.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-harness-1"
            }
          },
          {
            "kind": "virtual-dog"
          }
        ]
      },
      "text": {
        "es": "# Mundo 2 · El ritual del arnés\n\n## primer\n### card 1\nRecuerda: el arnés solo se acerca cuando está quieto. Si salta, vuelve a tu pecho y esperas.\n- caption: Si salta, el arnés se aleja; si está quieto, se acerca\n\n### card 2\nEn el juego, mira cómo está en cada paso y toca la acción que le ayuda: esperar, llamar, marcar o ponerle el arnés.\n\n## checkpoint\n### tq1\n¿Qué aprende si le pones el arnés mientras salta?\n- [x] Que saltar hace que el paseo llegue antes\n- [ ] Que ya puede calmarse porque va a salir\n- [ ] Que tiene que esperar a que tú termines\n- why: Si el arnés llega mientras salta, saltar le trae el paseo; por eso el arnés solo se acerca cuando está quieto.\n\n### tq2\nDeja de saltar y se pone a olfatear. ¿Qué haces?\n- [x] Digo su nombre una vez, en voz suave\n- [ ] Le pongo el arnés mientras está distraído\n- [ ] Sigo esperando hasta que se siente solo\n- why: Si se distrae, di su nombre una vez, en voz suave, para que vuelva a mirarte; el arnés llega cuando está quieto y atento.\n\n### tq3\nAcercas el arnés y vuelve a saltar. ¿Qué haces?\n- [x] Lo llevo a mi pecho y espero sin moverme\n- [ ] Se lo pongo rápido, ya que está cerca\n- [ ] Le repito «quieto» hasta que se pare\n- why: Si salta, el arnés vuelve a tu pecho y esperas sin moverte: mientras salta, no pasa nada.\n\n## exercises\n- poste: En casa: antes de salir, espera sin moverte hasta que tu perro se siente y solo entonces ponle el arnés.\n- tension: En casa: si se agita, deja el arnés y cuenta hasta cinco antes de volver a intentarlo.\n\n"
      },
      "files": [
        "media/theory-harness-1.png"
      ]
    },
    "home-rest": {
      "config": {
        "id": "home-rest",
        "mode": "minigame",
        "prerequisites": [
          "dog-as-dog"
        ],
        "simulation": {
          "minigame": "home-rest"
        },
        "exercises": [
          {
            "metric": "timing",
            "key": "node.homerest.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.homerest.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-home-rest-2"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 1 · En casa se descansa\n\n## primer\n### card 1\nRecuerda: en casa se descansa. Si pide atención, no lo miras, no le hablas y no lo tocas; si insiste, caminas con calma hacia su espacio.\n- caption: Dentro se descansa; fuera se juega\n\n## checkpoint\n### tq1\n¿Qué aprende si le respondes cada vez que pide?\n- [x] Que pedir funciona y le toca pedir más\n- [ ] Que ya ha tenido su ración del día\n- [ ] Que tú decides cuándo se juega\n- why: Cada respuesta, aunque sea un «ahora no», le paga la petición, y pide más.\n\n### tq2\nViene a darte con el hocico. ¿Qué haces?\n- [x] No lo miro, no le hablo y no lo toco\n- [ ] Le digo «ahora no» con voz firme\n- [ ] Le acaricio un poco para que se vaya\n- why: Mirarle, hablarle o tocarlo ya es responder: no le des nada de eso.\n\n### tq3\nInsiste y no se va. ¿Qué haces?\n- [x] Camino con calma hacia su espacio\n- [ ] Le lanzo la pelota por el pasillo\n- [ ] Le doy un juguete para entretenerlo\n- why: Si insiste, caminas con calma hacia su espacio, sin tocarlo, hasta que se aparte; el juego, fuera.\n\n## exercises\n- timing: En casa: cuando venga a pedirte atención, no lo mires, no le hables y no lo toques.\n- tension: En casa: guarda los juguetes del salón y juega con ellos solo fuera.\n\n"
      },
      "files": [
        "media/theory-home-rest-2.png"
      ]
    },
    "leave-it-intro": {
      "config": {
        "id": "leave-it-intro",
        "mode": "stage",
        "prerequisites": [],
        "simulation": {
          "scenario": {
            "world": 4,
            "theme": "urban_street",
            "fixedStep": 0.016666666666666666,
            "leashLength": 2,
            "leashTolerance": 0.1,
            "quickSpeed": 2,
            "walkStrength": 0.6,
            "handlerStart": {
              "x": 0,
              "y": 0
            },
            "dogStart": {
              "x": 1,
              "y": 0
            },
            "waypoint": {
              "x": 60,
              "y": 0
            },
            "waypoints": [],
            "waypointRadius": 2,
            "walls": [
              {
                "from": {
                  "x": -4,
                  "y": -6
                },
                "to": {
                  "x": 64,
                  "y": -6
                }
              },
              {
                "from": {
                  "x": -4,
                  "y": 6
                },
                "to": {
                  "x": 64,
                  "y": 6
                }
              }
            ],
            "scenery": [
              {
                "type": "bus_stop",
                "pos": {
                  "x": 12,
                  "y": -4.2
                },
                "angle": 0
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 36,
                  "y": 4.3
                }
              },
              {
                "type": "bike_rack",
                "pos": {
                  "x": 50,
                  "y": -4.2
                },
                "angle": 0
              },
              {
                "type": "trash_can",
                "pos": {
                  "x": 22,
                  "y": 4.6
                }
              },
              {
                "type": "sign",
                "pos": {
                  "x": 1.2655648766085508,
                  "y": 4.578794104629196
                }
              },
              {
                "type": "bus_stop",
                "pos": {
                  "x": 3.8925910082180053,
                  "y": -4.57090972608421
                },
                "angle": 0
              },
              {
                "type": "bin",
                "pos": {
                  "x": 9.780994244618341,
                  "y": 4.766889942693524
                }
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 12.100773185491562,
                  "y": -4.8195696386974305
                }
              },
              {
                "type": "scooter",
                "pos": {
                  "x": 17.499581984477118,
                  "y": 4.658500077784993
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 21.161464767996222,
                  "y": -4.93548388115596
                },
                "angle": 0
              },
              {
                "type": "hydrant",
                "pos": {
                  "x": 24.46502679772675,
                  "y": 4.452179003506899
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 26.354909074958414,
                  "y": -3.7594651804538444
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 30.53842582879588,
                  "y": 4.554792769718915
                },
                "angle": 0
              },
              {
                "type": "tree",
                "pos": {
                  "x": 34.586578702088445,
                  "y": -3.9162769622635096
                }
              },
              {
                "type": "parked_car",
                "pos": {
                  "x": 39.52111906022765,
                  "y": 4.474091816460714
                },
                "visualShield": true,
                "radius": 1.4,
                "angle": 0
              },
              {
                "type": "bike_rack",
                "pos": {
                  "x": 44.199229195481166,
                  "y": -4.72783165902365
                },
                "angle": 0
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 47.50189112056978,
                  "y": 4.825431196833961
                }
              },
              {
                "type": "trash_can",
                "pos": {
                  "x": 49.871979095740244,
                  "y": -3.602270695613697
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 55.005245725857094,
                  "y": 3.5120364339090884
                }
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 58.69691158714704,
                  "y": -3.9045557469362393
                }
              }
            ],
            "cues": [
              "leave-it"
            ],
            "dogGoalSpeed": 1.6,
            "dogFixationSpeed": 1,
            "dogReturnSpeed": 1.6,
            "dogReturnDistance": 1,
            "wanderMaxAngle": 0.5,
            "wanderTurnRate": 2,
            "distractor": {
              "kind": "food",
              "speed": 0,
              "triggerRadius": 6,
              "activateAfterMeters": 12,
              "startOffset": 28,
              "salience": 6,
              "path": {
                "from": {
                  "x": 30,
                  "y": 1.5
                },
                "to": {
                  "x": 30,
                  "y": 1.5
                }
              }
            },
            "moreDistractors": [
              {
                "kind": "food",
                "speed": 0,
                "triggerRadius": 6,
                "activateAfterMeters": 40,
                "startOffset": 28,
                "salience": 6,
                "path": {
                  "from": {
                    "x": 48,
                    "y": -1.5
                  },
                  "to": {
                    "x": 48,
                    "y": -1.5
                  }
                }
              }
            ],
            "calmSeconds": 3,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "ranges": {
              "reconnectionSeconds": {
                "worst": 1.5,
                "best": 0.3
              },
              "reactivityThreshold": {
                "worst": 15,
                "best": 60
              },
              "checkInMeanInterval": {
                "worst": 14,
                "best": 5
              }
            },
            "arousal": {
              "k": 30,
              "minDistance": 2,
              "decayPerSecond": 3,
              "rigidPullRate": 4,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "cue": {
              "cooldownSeconds": 3,
              "fixatedFactor": 0.3,
              "repeatFactor": 0.5,
              "arousalDrop": 10,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "reaction": {
              "alertFraction": 0.6,
              "lungeAccel": 1.5,
              "lungeMaxSpeed": 4,
              "alertSlowdown": 0.85
            },
            "sintonia": {
              "minSpeed": 0.4,
              "minTurnRate": 0.2,
              "maxTurnRate": 1.8,
              "turnWindow": 0.5,
              "holdSeconds": 2
            },
            "goSniff": {
              "offerSeconds": 3,
              "durationSeconds": 4,
              "speed": 0.4,
              "decayFactor": 3
            },
            "turnAngle": 0.7853981633974483,
            "followSeconds": 1.5,
            "correctionWaitSeconds": 4,
            "pullStrength": 0.8,
            "configVersion": "bundled",
            "camera": {
              "closeZoom": 2.2,
              "farZoom": 1.5,
              "padding": 90,
              "smoothing": 3
            },
            "endCondition": {
              "kind": "reach-waypoint"
            }
          }
        },
        "exercises": [
          {
            "metric": "attention",
            "key": "node.leaveit.exercise1"
          },
          {
            "metric": "timing",
            "key": "node.leaveit.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-leave-it-2"
            }
          },
          {
            "kind": "virtual-dog"
          }
        ]
      },
      "text": {
        "es": "# Mundo 4 · Déjalo\n\n## primer\n### card 1\nRecuerda: di «Déjalo» una vez, en cuanto vea la comida, y paga con tu mano cuando se gire hacia ti.\n- caption: Se gira hacia ti antes de llegar: «bien» y premio\n\n### card 2\nEn el juego, pulsa Déjalo, la mano abierta, en cuanto mire la comida.\n\n## checkpoint\n### tq1\n¿Qué aprende si corres a quitarle la comida?\n- [x] Que tiene que comer más deprisa\n- [ ] Que la comida del suelo no es suya\n- [ ] Que debe esperar a que tú llegues\n- why: Si corres a quitársela, aprende que hay que comer deprisa, antes de que llegues.\n\n### tq2\n¿Cuándo dices «Déjalo» en la calle?\n- [x] Una vez, en cuanto ve la comida\n- [ ] Cuando ya tiene la nariz encima\n- [ ] Varias veces, hasta que se aparte\n- why: Dilo una sola vez, en cuanto vea la comida y antes de que llegue: repetirlo tarde no le ayuda a acertar.\n\n### tq3\nDices «Déjalo» y se gira hacia ti. ¿Qué haces?\n- [x] Le doy una golosina de mi mano\n- [ ] Le dejo coger la comida del suelo\n- [ ] Le repito «Déjalo» para reforzarlo\n- why: Girarse hacia ti trae «bien» y una golosina de tu mano; el premio nunca sale del suelo.\n\n## exercises\n- attention: En casa: deja una golosina en el suelo, di \"déjalo\" y premia cuando te mire.\n- timing: En casa: premia justo cuando tu perro aparta el hocico de la golosina.\n\n"
      },
      "files": [
        "media/theory-leave-it-2.png"
      ]
    },
    "park-jogger": {
      "config": {
        "id": "park-jogger",
        "mode": "stage",
        "prerequisites": [],
        "simulation": {
          "scenario": {
            "world": 5,
            "theme": "open_park",
            "fixedStep": 0.016666666666666666,
            "leashLength": 3,
            "leashTolerance": 0.1,
            "quickSpeed": 2,
            "walkStrength": 0.6,
            "handlerStart": {
              "x": 0,
              "y": 0
            },
            "dogStart": {
              "x": 1,
              "y": 0
            },
            "waypoint": {
              "x": 90,
              "y": 20
            },
            "waypoints": [
              {
                "x": 50,
                "y": 0
              }
            ],
            "waypointRadius": 2,
            "walls": [],
            "scenery": [
              {
                "type": "picnic_table",
                "pos": {
                  "x": 20,
                  "y": -6.5
                },
                "angle": 0
              },
              {
                "type": "bench",
                "pos": {
                  "x": 23.4,
                  "y": -6.5
                },
                "angle": 0
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 30,
                  "y": 7.5
                }
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 70,
                  "y": 4
                }
              },
              {
                "type": "bin",
                "pos": {
                  "x": 0.8952396911477167,
                  "y": 5.70759824803099
                }
              },
              {
                "type": "conifer",
                "pos": {
                  "x": 5.971977609880099,
                  "y": -6.031681074295193
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 7.3413354588846875,
                  "y": 5.314500970765948
                },
                "angle": 0
              },
              {
                "type": "tree",
                "pos": {
                  "x": 12.079212825038883,
                  "y": -8.047981414478272
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 14.370332916434075,
                  "y": 5.329627241939306
                },
                "angle": 0
              },
              {
                "type": "sign",
                "pos": {
                  "x": 18.377304110587573,
                  "y": -5.081801136024296
                }
              },
              {
                "type": "bush",
                "pos": {
                  "x": 21.327605325435368,
                  "y": 4.753664845833555
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 24.97481463393277,
                  "y": -5.51717544766143
                }
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 27.164789348195768,
                  "y": 8.254438509233296
                }
              },
              {
                "type": "picnic_table",
                "pos": {
                  "x": 30.931956481160743,
                  "y": -4.154605968855321
                },
                "angle": 0
              },
              {
                "type": "pond",
                "pos": {
                  "x": 35.6246833937519,
                  "y": 6.39781272248365
                }
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 38.560300659624126,
                  "y": -7.784136677859351
                }
              },
              {
                "type": "bin",
                "pos": {
                  "x": 41.182575231797735,
                  "y": 7.5929765668697655
                }
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 45.277399808396474,
                  "y": -4.917059778003022
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 48.42983079187396,
                  "y": 8.381363298743963
                },
                "angle": 0.4636476090008061
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 55.19531076208285,
                  "y": -4.062245933830743
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 53.69803845351568,
                  "y": 6.851477522126321
                },
                "angle": 0.4636476090008061
              },
              {
                "type": "bush",
                "pos": {
                  "x": 60.252765471704734,
                  "y": -2.501289590662913
                }
              },
              {
                "type": "sign",
                "pos": {
                  "x": 58.11324984030899,
                  "y": 13.626934709984802
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 68.15804841502948,
                  "y": -0.7794225070437051
                }
              },
              {
                "type": "conifer",
                "pos": {
                  "x": 63.349774265246964,
                  "y": 14.504699665347367
                }
              },
              {
                "type": "picnic_table",
                "pos": {
                  "x": 72.67404573340076,
                  "y": 3.470403959611698
                },
                "angle": 0.4636476090008061
              },
              {
                "type": "pond",
                "pos": {
                  "x": 70.88138454375213,
                  "y": 18.43291178078917
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 77.78807764806699,
                  "y": 8.266150767899617
                }
              },
              {
                "type": "bin",
                "pos": {
                  "x": 77.64599006844601,
                  "y": 20.280969659068507
                }
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 84.52880309557051,
                  "y": 9.901040626439602
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 80.25651057442668,
                  "y": 24.740729165743737
                }
              },
              {
                "type": "picnic_table",
                "pos": {
                  "x": 90.81086166021008,
                  "y": 14.503646951405383
                },
                "angle": 0.4636476090008061
              }
            ],
            "cues": [
              "lets-go"
            ],
            "dogGoalSpeed": 1.6,
            "dogFixationSpeed": 1,
            "dogReturnSpeed": 1.6,
            "dogReturnDistance": 1,
            "wanderMaxAngle": 0.5,
            "wanderTurnRate": 2,
            "distractor": {
              "kind": "other",
              "speed": 3.6,
              "triggerRadius": 12,
              "activateAfterMeters": 30,
              "startOffset": 28,
              "path": {
                "from": {
                  "x": 42,
                  "y": -10
                },
                "to": {
                  "x": 42,
                  "y": 14
                }
              }
            },
            "moreDistractors": [],
            "calmSeconds": 3,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "ranges": {
              "reconnectionSeconds": {
                "worst": 1.5,
                "best": 0.3
              },
              "reactivityThreshold": {
                "worst": 15,
                "best": 60
              },
              "checkInMeanInterval": {
                "worst": 14,
                "best": 5
              }
            },
            "arousal": {
              "k": 30,
              "minDistance": 2,
              "decayPerSecond": 3,
              "rigidPullRate": 4,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "cue": {
              "cooldownSeconds": 3,
              "fixatedFactor": 0.3,
              "repeatFactor": 0.5,
              "arousalDrop": 10,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "reaction": {
              "alertFraction": 0.6,
              "lungeAccel": 1.5,
              "lungeMaxSpeed": 4,
              "alertSlowdown": 0.85
            },
            "sintonia": {
              "minSpeed": 0.4,
              "minTurnRate": 0.2,
              "maxTurnRate": 1.8,
              "turnWindow": 0.5,
              "holdSeconds": 2
            },
            "goSniff": {
              "offerSeconds": 3,
              "durationSeconds": 4,
              "speed": 0.4,
              "decayFactor": 3
            },
            "turnAngle": 0.7853981633974483,
            "followSeconds": 1.5,
            "correctionWaitSeconds": 4,
            "pullStrength": 0.8,
            "configVersion": "bundled",
            "camera": {
              "closeZoom": 2.2,
              "farZoom": 1.5,
              "padding": 90,
              "smoothing": 3
            },
            "endCondition": {
              "kind": "reach-waypoint"
            }
          }
        },
        "exercises": [
          {
            "metric": "poste",
            "key": "node.jogger.exercise1"
          },
          {
            "metric": "tension",
            "key": "node.jogger.exercise2"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-long-leash-1"
            }
          },
          {
            "kind": "virtual-dog"
          }
        ]
      },
      "text": {
        "es": "# Mundo 5 · El corredor\n\n## primer\n### card 1\nRecuerda: con calma, suelta los tres metros; si aparece algo rápido, recoge correa antes de que arranque y apártate.\n- caption: Con calma, tres metros; si llega algo rápido, uno\n\n### card 2\nEn el juego, la correa larga solo se tensa al final: cuando se pone recta, suelta el joystick.\n\n## checkpoint\n### tq1\n¿Por qué la correa larga pide adelantarte?\n- [x] En tres metros coge mucha velocidad\n- [ ] El tirón del final le enseña a no correr\n- [ ] Con más correa se enreda en tus piernas\n- why: Tres metros son una pista de despegue: llega al final a toda velocidad y el frenazo os sacude a los dos sin enseñarle nada útil.\n\n### tq2\nVes un corredor a lo lejos. ¿Qué haces primero?\n- [x] Recojo correa antes de que arranque\n- [ ] Espero a ver si {name} lo ve o no\n- [ ] Le doy toda la correa para que no tire\n- why: En cuanto veas algo rápido, recoge correa pliegue a pliegue antes de que arranque: con menos correa, coge menos velocidad.\n\n### tq3\n¿Cómo llevas el sobrante de la correa larga?\n- [x] En pliegues sueltos dentro de la palma\n- [ ] Enrollado en la mano para que no se escape\n- [ ] Enrollado en los dedos para acortar rápido\n- why: Enrollada en la mano o en los dedos, la vuelta se aprieta de golpe si sale disparado; los pliegues sueltos se recogen y se sueltan en un segundo.\n\n## exercises\n- poste: En el parque: cuando veas a alguien correr, párate antes de que la correa se tense.\n- tension: En el parque: con correa larga, recógela un poco antes de cruzarte con gente.\n\n"
      },
      "files": [
        "media/theory-long-leash-1.png"
      ]
    },
    "park-mix": {
      "config": {
        "id": "park-mix",
        "mode": "stage",
        "prerequisites": [
          "park-jogger"
        ],
        "simulation": {
          "scenario": {
            "world": 5,
            "theme": "open_park",
            "fixedStep": 0.016666666666666666,
            "leashLength": 3,
            "leashTolerance": 0.1,
            "quickSpeed": 2,
            "walkStrength": 0.6,
            "handlerStart": {
              "x": 0,
              "y": 0
            },
            "dogStart": {
              "x": 1,
              "y": 0
            },
            "waypoint": {
              "x": 110,
              "y": 24
            },
            "waypoints": [
              {
                "x": 40,
                "y": 0
              },
              {
                "x": 70,
                "y": 24
              }
            ],
            "waypointRadius": 2,
            "walls": [],
            "scenery": [
              {
                "type": "picnic_table",
                "pos": {
                  "x": 15,
                  "y": 6.5
                },
                "angle": 0
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 30,
                  "y": -7.5
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 56,
                  "y": 8
                },
                "angle": 0
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 90,
                  "y": 18
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 2.321162232287003,
                  "y": 7.728687824914232
                },
                "angle": 0
              },
              {
                "type": "tree",
                "pos": {
                  "x": 4.097292574321322,
                  "y": -4.986269189743325
                }
              },
              {
                "type": "pond",
                "pos": {
                  "x": 7.896502695492156,
                  "y": 7.433060089591891
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 11.107104447106613,
                  "y": -8.186687129549682
                }
              },
              {
                "type": "sign",
                "pos": {
                  "x": 13.292396982045599,
                  "y": 6.961619952693582
                }
              },
              {
                "type": "bush",
                "pos": {
                  "x": 16.530040978718212,
                  "y": -5.3347799342591316
                }
              },
              {
                "type": "conifer",
                "pos": {
                  "x": 19.89903701482109,
                  "y": 4.928445035824552
                }
              },
              {
                "type": "picnic_table",
                "pos": {
                  "x": 25.087793553384543,
                  "y": -6.65167803154327
                },
                "angle": 0
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 26.386653289635873,
                  "y": 4.865026172250509
                },
                "angle": 0
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 31.82224348026562,
                  "y": -6.4386995867826045
                }
              },
              {
                "type": "bin",
                "pos": {
                  "x": 35.02306232366772,
                  "y": 5.597308728378266
                }
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 36.31874694963517,
                  "y": -6.782998896436766
                }
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 36.32368913666563,
                  "y": 6.619380017292475
                }
              },
              {
                "type": "sign",
                "pos": {
                  "x": 46.83715705892303,
                  "y": -0.21604393957820367
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 42.81944378277729,
                  "y": 10.138681373330702
                }
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 52.1581365361927,
                  "y": 3.724871076700874
                }
              },
              {
                "type": "conifer",
                "pos": {
                  "x": 46.60004861400692,
                  "y": 13.487067409553898
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 58.997354913885516,
                  "y": 4.315403079616598
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 50.41299559806523,
                  "y": 18.06057135991343
                },
                "angle": 0.6747409422235527
              },
              {
                "type": "picnic_table",
                "pos": {
                  "x": 62.857528152682534,
                  "y": 11.381844389679031
                },
                "angle": 0.6747409422235527
              },
              {
                "type": "bush",
                "pos": {
                  "x": 58.52931410358761,
                  "y": 21.096097258850925
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 68.8409173760368,
                  "y": 12.687559473884912
                },
                "angle": 0.6747409422235527
              },
              {
                "type": "bin",
                "pos": {
                  "x": 59.913559616871645,
                  "y": 27.428544958997662
                }
              },
              {
                "type": "pond",
                "pos": {
                  "x": 74.35973132520542,
                  "y": 16.499254438619197
                }
              },
              {
                "type": "conifer",
                "pos": {
                  "x": 71.6691425277153,
                  "y": 30.89226512075402
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 74.0819562278055,
                  "y": 16.51639243820682
                }
              },
              {
                "type": "bin",
                "pos": {
                  "x": 77.93037641560353,
                  "y": 31.929712907411158
                }
              },
              {
                "type": "sign",
                "pos": {
                  "x": 82.77625538964757,
                  "y": 19.53179326490499
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 84.935729914125,
                  "y": 32.10975403734483
                },
                "angle": 0
              },
              {
                "type": "pond",
                "pos": {
                  "x": 87.31617691179606,
                  "y": 15.136267917696387
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 90.73299340293273,
                  "y": 31.547148264478892
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 95.39420886012908,
                  "y": 18.884089349303395
                },
                "angle": 0
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 97.92881919501725,
                  "y": 28.817187329521403
                }
              },
              {
                "type": "bush",
                "pos": {
                  "x": 101.8545439367755,
                  "y": 18.32034422433935
                }
              },
              {
                "type": "picnic_table",
                "pos": {
                  "x": 103.96578631206741,
                  "y": 16.855483053950593
                },
                "angle": 0
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 109.04443668672417,
                  "y": 29.631889819400385
                }
              }
            ],
            "cues": [
              "lets-go",
              "leave-it"
            ],
            "dogGoalSpeed": 1.6,
            "dogFixationSpeed": 1,
            "dogReturnSpeed": 1.6,
            "dogReturnDistance": 1,
            "wanderMaxAngle": 0.5,
            "wanderTurnRate": 2,
            "distractor": {
              "kind": "other",
              "speed": 3.8,
              "triggerRadius": 12,
              "activateAfterMeters": 18,
              "startOffset": 28,
              "path": {
                "from": {
                  "x": 28,
                  "y": -12
                },
                "to": {
                  "x": 28,
                  "y": 14
                }
              }
            },
            "moreDistractors": [
              {
                "kind": "food",
                "speed": 0,
                "triggerRadius": 6,
                "activateAfterMeters": 50,
                "startOffset": 28,
                "salience": 6,
                "path": {
                  "from": {
                    "x": 60,
                    "y": 17
                  },
                  "to": {
                    "x": 60,
                    "y": 17
                  }
                }
              },
              {
                "kind": "bicycle",
                "speed": 5,
                "triggerRadius": 16,
                "activateAfterMeters": 85,
                "startOffset": 28,
                "path": {
                  "from": {
                    "x": 95,
                    "y": 40
                  },
                  "to": {
                    "x": 95,
                    "y": 10
                  }
                }
              }
            ],
            "calmSeconds": 3,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "ranges": {
              "reconnectionSeconds": {
                "worst": 1.5,
                "best": 0.3
              },
              "reactivityThreshold": {
                "worst": 15,
                "best": 60
              },
              "checkInMeanInterval": {
                "worst": 14,
                "best": 5
              }
            },
            "arousal": {
              "k": 30,
              "minDistance": 2,
              "decayPerSecond": 3,
              "rigidPullRate": 4,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "cue": {
              "cooldownSeconds": 3,
              "fixatedFactor": 0.3,
              "repeatFactor": 0.5,
              "arousalDrop": 10,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "reaction": {
              "alertFraction": 0.6,
              "lungeAccel": 1.5,
              "lungeMaxSpeed": 4,
              "alertSlowdown": 0.85
            },
            "sintonia": {
              "minSpeed": 0.4,
              "minTurnRate": 0.2,
              "maxTurnRate": 1.8,
              "turnWindow": 0.5,
              "holdSeconds": 2
            },
            "goSniff": {
              "offerSeconds": 3,
              "durationSeconds": 4,
              "speed": 0.4,
              "decayFactor": 3
            },
            "turnAngle": 0.7853981633974483,
            "followSeconds": 1.5,
            "correctionWaitSeconds": 4,
            "pullStrength": 0.8,
            "configVersion": "bundled",
            "camera": {
              "closeZoom": 2.2,
              "farZoom": 1.5,
              "padding": 90,
              "smoothing": 3
            },
            "endCondition": {
              "kind": "reach-waypoint"
            }
          }
        },
        "exercises": [
          {
            "metric": "tension",
            "key": "node.park.exercise1"
          },
          {
            "metric": "timing",
            "key": "node.park.exercise2"
          },
          {
            "metric": "attention",
            "key": "node.park.exercise3"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-park-mix-1"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 5 · El parque lleno\n\n## primer\n### card 1\nRecuerda: cada estímulo llena el vaso. Distancia y pausas de olfato entre uno y otro, y si se desborda, salid del parque.\n- caption: Cada estímulo llena el vaso; olfatear lo vacía\n\n## checkpoint\n### tq1\n¿Por qué se desborda si cada cosa sola la sabe hacer?\n- [x] La excitación de cada estímulo se va sumando\n- [ ] Con tanto movimiento se le olvidan las señales\n- [ ] Le falta correr para gastar más energía\n- why: Cada estímulo sube su excitación y tarda minutos en bajar; si llega otro antes, se suma hasta que el vaso rebosa.\n\n### tq2\nAcaba de pasar una bici y lo ha hecho bien. ¿Y ahora?\n- [x] Una pausa de olfato, lejos del camino\n- [ ] Seguir andando, ya que ha salido bien\n- [ ] Una carrerita para que se desfogue\n- why: Después de cada estímulo, una pausa de olfato baja la excitación antes de que llegue el siguiente.\n\n### tq3\nYa no coge golosinas ni te oye. ¿Qué haces?\n- [x] Dar la vuelta y salir del parque\n- [ ] Sacar una golosina mejor y seguir\n- [ ] Repetir la señal más alto y más veces\n- why: Si ya no come ni te oye, ha pasado su umbral, el punto en que no puede escucharte: date la vuelta y salid del parque.\n\n## exercises\n- tension: En el parque: aprende a mantener la correa larga floja aunque haya mucho movimiento.\n- timing: En el parque: marca la calma en cuanto tu perro se relaje tras cruzarse con algo.\n- attention: En el parque: pide que te mire antes de cada cruce.\n\n"
      },
      "files": [
        "media/theory-park-mix-1.png"
      ]
    },
    "poste-practice": {
      "config": {
        "id": "poste-practice",
        "mode": "minigame",
        "prerequisites": [],
        "simulation": {
          "minigame": "poste-hold"
        },
        "exercises": [
          {
            "metric": "poste",
            "key": "node.poste.exercisePoste"
          },
          {
            "metric": "tension",
            "key": "node.poste.exerciseTension"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-poste-do"
            }
          }
        ]
      },
      "text": {
        "es": "# Práctica: el Poste\n\n## primer\n### card 1\nRecuerda: cuando la correa se tensa, te paras como un poste hasta que se afloja.\n- caption: Cómo detenerte como un poste cuando el perro tira\n\n## checkpoint\n### tq1\n¿Qué aprende tu perro si avanzas mientras tira?\n- [x] Que tirar le lleva adonde quiere\n- [ ] Que debe caminar a tu lado\n- [ ] Que tirar no sirve de nada\n- why: Cada paso que das con la correa tensa le paga el tirón: tirar le acerca a lo que quiere.\n\n### tq2\n¿Qué pasa si tiras tú de vuelta?\n- [x] Aprende a tirar todavía más fuerte\n- [ ] Aprende a ir siempre a tu lado\n- [ ] Deja de interesarle lo que veía\n- why: Es un reflejo: si tiras hacia atrás, su cuerpo empuja en contra y acabáis los dos tirando más fuerte.\n\n### tq3\nHaces poste. ¿Cuándo vuelves a caminar?\n- [x] En cuanto la correa se afloja\n- [ ] Cuando cuentas diez segundos\n- [ ] Cuando deja de mirar a su alrededor\n- why: La correa floja es lo que reabre el camino; así sabe exactamente qué ha hecho bien.\n\n## exercises\n- poste: En la calle: la próxima vez que tu perro tire, párate y cuenta hasta cinco antes de moverte.\n- tension: En casa: camina por el salón con la correa floja y párate cada vez que se tense.\n\n"
      },
      "files": [
        "media/theory-poste-do.png"
      ]
    },
    "scooter-crossing": {
      "config": {
        "id": "scooter-crossing",
        "mode": "stage",
        "prerequisites": [
          "leave-it-intro"
        ],
        "simulation": {
          "scenario": {
            "world": 4,
            "theme": "urban_street",
            "fixedStep": 0.016666666666666666,
            "leashLength": 2,
            "leashTolerance": 0.1,
            "quickSpeed": 2,
            "walkStrength": 0.6,
            "handlerStart": {
              "x": 0,
              "y": 0
            },
            "dogStart": {
              "x": 1,
              "y": 0
            },
            "waypoint": {
              "x": 70,
              "y": 0
            },
            "waypoints": [],
            "waypointRadius": 2,
            "walls": [
              {
                "from": {
                  "x": -4,
                  "y": -7
                },
                "to": {
                  "x": 74,
                  "y": -7
                }
              },
              {
                "from": {
                  "x": -4,
                  "y": 7
                },
                "to": {
                  "x": 74,
                  "y": 7
                }
              }
            ],
            "scenery": [
              {
                "type": "parked_car",
                "pos": {
                  "x": 36,
                  "y": -3.6
                },
                "visualShield": true,
                "radius": 1.4
              },
              {
                "type": "parked_car",
                "pos": {
                  "x": 36,
                  "y": 3.6
                },
                "visualShield": true,
                "radius": 1.4
              },
              {
                "type": "parked_car",
                "pos": {
                  "x": 12,
                  "y": -3.6
                },
                "visualShield": true,
                "radius": 1.4
              },
              {
                "type": "hydrant",
                "pos": {
                  "x": 24,
                  "y": 5.6
                }
              },
              {
                "type": "bike_rack",
                "pos": {
                  "x": 56,
                  "y": -5.2
                },
                "angle": 0
              },
              {
                "type": "bin",
                "pos": {
                  "x": 62,
                  "y": 5.4
                }
              },
              {
                "type": "hydrant",
                "pos": {
                  "x": 2.18847494199872,
                  "y": 4.783008974045515
                }
              },
              {
                "type": "bin",
                "pos": {
                  "x": 4.825363209574587,
                  "y": -4.388019675156102
                }
              },
              {
                "type": "sign",
                "pos": {
                  "x": 8.63316888258689,
                  "y": 4.983996698167175
                }
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 13.499531336439153,
                  "y": -4.562181665096432
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 17.157754119796056,
                  "y": 4.274158836575225
                }
              },
              {
                "type": "bike_rack",
                "pos": {
                  "x": 22.259081747382876,
                  "y": -5.301736518042162
                },
                "angle": 0
              },
              {
                "type": "scooter",
                "pos": {
                  "x": 24.095275776150327,
                  "y": 4.391727236448787
                }
              },
              {
                "type": "parked_car",
                "pos": {
                  "x": 28.689981994115644,
                  "y": -5.477689612773247
                },
                "visualShield": true,
                "radius": 1.4,
                "angle": 0
              },
              {
                "type": "tree",
                "pos": {
                  "x": 33.49802758068674,
                  "y": 5.229129194747657
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 35.38555541189594,
                  "y": -4.665411340887658
                },
                "angle": 0
              },
              {
                "type": "trash_can",
                "pos": {
                  "x": 41.71600488469832,
                  "y": 5.352293289266527
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 44.81590218604025,
                  "y": -5.237784484168515
                },
                "angle": 0
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 49.0535268170966,
                  "y": 4.0772929940139875
                }
              },
              {
                "type": "bus_stop",
                "pos": {
                  "x": 50.668726860752535,
                  "y": -4.330625273520127
                },
                "angle": 0
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 55.87365401029173,
                  "y": 5.123094011098146
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 58.92837559814669,
                  "y": -4.527189754880965
                }
              },
              {
                "type": "hydrant",
                "pos": {
                  "x": 62.58587179353667,
                  "y": 5.2505374702159315
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 68.46721369338532,
                  "y": -4.289500251063146
                }
              }
            ],
            "cues": [
              "lets-go",
              "leave-it"
            ],
            "dogGoalSpeed": 1.6,
            "dogFixationSpeed": 1,
            "dogReturnSpeed": 1.6,
            "dogReturnDistance": 1,
            "wanderMaxAngle": 0.5,
            "wanderTurnRate": 2,
            "distractor": {
              "kind": "skateboard",
              "speed": 4.5,
              "triggerRadius": 16,
              "activateAfterMeters": 20,
              "startOffset": 28,
              "path": {
                "from": {
                  "x": 40,
                  "y": -22
                },
                "to": {
                  "x": 40,
                  "y": 22
                }
              }
            },
            "moreDistractors": [],
            "calmSeconds": 3,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "ranges": {
              "reconnectionSeconds": {
                "worst": 1.5,
                "best": 0.3
              },
              "reactivityThreshold": {
                "worst": 15,
                "best": 60
              },
              "checkInMeanInterval": {
                "worst": 14,
                "best": 5
              }
            },
            "arousal": {
              "k": 30,
              "minDistance": 2,
              "decayPerSecond": 3,
              "rigidPullRate": 4,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "cue": {
              "cooldownSeconds": 3,
              "fixatedFactor": 0.3,
              "repeatFactor": 0.5,
              "arousalDrop": 10,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "reaction": {
              "alertFraction": 0.6,
              "lungeAccel": 1.5,
              "lungeMaxSpeed": 4,
              "alertSlowdown": 0.85
            },
            "sintonia": {
              "minSpeed": 0.4,
              "minTurnRate": 0.2,
              "maxTurnRate": 1.8,
              "turnWindow": 0.5,
              "holdSeconds": 2
            },
            "goSniff": {
              "offerSeconds": 3,
              "durationSeconds": 4,
              "speed": 0.4,
              "decayFactor": 3
            },
            "turnAngle": 0.7853981633974483,
            "followSeconds": 1.5,
            "correctionWaitSeconds": 4,
            "pullStrength": 0.8,
            "configVersion": "bundled",
            "camera": {
              "closeZoom": 2.2,
              "farZoom": 1.5,
              "padding": 90,
              "smoothing": 3
            },
            "endCondition": {
              "kind": "reach-waypoint"
            }
          }
        },
        "exercises": [
          {
            "metric": "timing",
            "key": "node.scooter.exercise1"
          },
          {
            "metric": "poste",
            "key": "node.scooter.exercise2"
          },
          {
            "metric": "attention",
            "key": "node.scooter.exercise3"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-visual-shields-2"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 4 · Patinetes y coches aparcados\n\n## primer\n### card 1\nRecuerda: si viene un patinete, ponte detrás del coche aparcado más cercano antes de que se quede mirando.\n- caption: Detrás del coche, {name} te mira a ti\n\n## checkpoint\n### tq1\n¿Cuándo te pones detrás del coche aparcado?\n- [x] Antes de que se quede mirando el patinete\n- [ ] Cuando empieza a ladrar al patinete\n- [ ] Cuando el patinete ya está a vuestro lado\n- why: Quedarse mirando es la primera señal: si actúas antes, el coche corta esa mirada y la tensión no sube.\n\n### tq2\nViene un patinete rápido. ¿Qué escudo usas?\n- [x] El coche aparcado más cercano\n- [ ] Un portal al final de la calle\n- [ ] La farola que tienes justo al lado\n- why: Con algo rápido, como un patinete, usa el escudo más cercano que tape de verdad su vista.\n\n### tq3\nDetrás del coche, {name} te mira. ¿Qué haces?\n- [x] Le digo «bien» y le doy una golosina\n- [ ] Salimos ya, antes de que pase el patinete\n- [ ] Le dejo asomarse para que vea el patinete\n- why: Que te mire detrás del escudo es lo que quieres: márcalo con un «bien» suave y dale una golosina.\n\n## exercises\n- timing: En la calle: cuando veas algo rápido, llama a tu perro antes de que se fije.\n- poste: En la calle: coloca un coche aparcado entre tu perro y lo que lo altera.\n- attention: En casa: practica las dos señales con juguetes distintos.\n\n"
      },
      "files": [
        "media/theory-visual-shields-2.png"
      ]
    },
    "slack-u": {
      "config": {
        "id": "slack-u",
        "mode": "stage",
        "prerequisites": [
          "walk-distraction"
        ],
        "simulation": {
          "scenario": {
            "world": 3,
            "theme": "quiet_suburb",
            "fixedStep": 0.016666666666666666,
            "leashLength": 2,
            "leashTolerance": 0.1,
            "quickSpeed": 2,
            "walkStrength": 0.6,
            "handlerStart": {
              "x": 0,
              "y": 0
            },
            "dogStart": {
              "x": 1,
              "y": 0
            },
            "waypoint": {
              "x": 46,
              "y": 34
            },
            "waypoints": [
              {
                "x": 22,
                "y": 0
              },
              {
                "x": 22,
                "y": 16
              },
              {
                "x": 46,
                "y": 16
              }
            ],
            "waypointRadius": 2,
            "walls": [
              {
                "from": {
                  "x": -4,
                  "y": -5
                },
                "to": {
                  "x": 27,
                  "y": -5
                }
              },
              {
                "from": {
                  "x": 27,
                  "y": -5
                },
                "to": {
                  "x": 27,
                  "y": 11
                }
              },
              {
                "from": {
                  "x": 27,
                  "y": 11
                },
                "to": {
                  "x": 51,
                  "y": 11
                }
              },
              {
                "from": {
                  "x": 51,
                  "y": 11
                },
                "to": {
                  "x": 51,
                  "y": 39
                }
              }
            ],
            "scenery": [
              {
                "type": "bench",
                "pos": {
                  "x": 8,
                  "y": -3
                },
                "angle": 0
              },
              {
                "type": "bin",
                "pos": {
                  "x": 9.8,
                  "y": -3
                }
              },
              {
                "type": "conifer",
                "pos": {
                  "x": 16,
                  "y": -3.2
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 30,
                  "y": 13.6
                },
                "angle": 0
              },
              {
                "type": "garden_gnome",
                "pos": {
                  "x": 38.5,
                  "y": 13.7
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 49,
                  "y": 28
                },
                "angle": 1.5707963267948966
              },
              {
                "type": "conifer",
                "pos": {
                  "x": 0.5573526003531047,
                  "y": 3.296931024407968
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 4.279417038673446,
                  "y": -3.3728990642353893
                },
                "angle": 0
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 8.302828187743822,
                  "y": 3.387012653844431
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 13.810098747412365,
                  "y": -3.531952856760472
                }
              },
              {
                "type": "fence",
                "pos": {
                  "x": 15.2521244315874,
                  "y": 2.666602231236175
                },
                "angle": 0
              },
              {
                "type": "bench",
                "pos": {
                  "x": 20.965562358498573,
                  "y": -3.249640820873901
                },
                "angle": 0
              },
              {
                "type": "scooter",
                "pos": {
                  "x": 25.167634945781902,
                  "y": 3.0118775154863116
                }
              },
              {
                "type": "bush",
                "pos": {
                  "x": 18.799666344281285,
                  "y": 7.440778079487025
                }
              },
              {
                "type": "mailbox",
                "pos": {
                  "x": 25.348147512366996,
                  "y": 11.506115484095758
                }
              },
              {
                "type": "mailbox_row",
                "pos": {
                  "x": 18.469017760688438,
                  "y": 13.405807531305726
                },
                "angle": 1.5707963267948966
              },
              {
                "type": "bin",
                "pos": {
                  "x": 23.39459850603626,
                  "y": 19.4108289278578
                }
              },
              {
                "type": "garden_gnome",
                "pos": {
                  "x": 27.57201636547134,
                  "y": 12.521031543472782
                }
              },
              {
                "type": "hedge",
                "pos": {
                  "x": 30.190351384026663,
                  "y": 18.95191624821164
                },
                "angle": 0
              },
              {
                "type": "bin",
                "pos": {
                  "x": 33.77312193952856,
                  "y": 12.1585207242053
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 37.34084418345065,
                  "y": 18.77459662319161
                },
                "angle": 0
              },
              {
                "type": "scooter",
                "pos": {
                  "x": 43.904461321376616,
                  "y": 12.156208979338407
                }
              },
              {
                "type": "fence",
                "pos": {
                  "x": 49.519342734199014,
                  "y": 16.622105206762043
                },
                "angle": 1.5707963267948966
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 42.08144003804773,
                  "y": 21.107964798808098
                }
              },
              {
                "type": "mailbox_row",
                "pos": {
                  "x": 48.93450239310041,
                  "y": 23.625537263495573
                },
                "angle": 1.5707963267948966
              },
              {
                "type": "mailbox",
                "pos": {
                  "x": 42.26575854322873,
                  "y": 28.985675642887756
                }
              },
              {
                "type": "bush",
                "pos": {
                  "x": 49.34292821818963,
                  "y": 31.83221148167337
                }
              }
            ],
            "cues": [
              "lets-go"
            ],
            "dogGoalSpeed": 1.6,
            "dogFixationSpeed": 1,
            "dogReturnSpeed": 1.6,
            "dogReturnDistance": 1,
            "wanderMaxAngle": 0.5,
            "wanderTurnRate": 2,
            "distractor": {
              "kind": "child",
              "speed": 1.8,
              "triggerRadius": 10,
              "activateAfterMeters": 6,
              "startOffset": 28,
              "path": {
                "from": {
                  "x": 14,
                  "y": -14
                },
                "to": {
                  "x": 14,
                  "y": 14
                }
              }
            },
            "moreDistractors": [
              {
                "kind": "dog",
                "speed": 2.4,
                "triggerRadius": 12,
                "activateAfterMeters": 38,
                "startOffset": 28,
                "path": {
                  "from": {
                    "x": 38,
                    "y": 4
                  },
                  "to": {
                    "x": 38,
                    "y": 28
                  }
                }
              }
            ],
            "calmSeconds": 3,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "ranges": {
              "reconnectionSeconds": {
                "worst": 1.5,
                "best": 0.3
              },
              "reactivityThreshold": {
                "worst": 15,
                "best": 60
              },
              "checkInMeanInterval": {
                "worst": 14,
                "best": 5
              }
            },
            "arousal": {
              "k": 30,
              "minDistance": 2,
              "decayPerSecond": 3,
              "rigidPullRate": 4,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "cue": {
              "cooldownSeconds": 3,
              "fixatedFactor": 0.3,
              "repeatFactor": 0.5,
              "arousalDrop": 10,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "reaction": {
              "alertFraction": 0.6,
              "lungeAccel": 1.5,
              "lungeMaxSpeed": 4,
              "alertSlowdown": 0.85
            },
            "sintonia": {
              "minSpeed": 0.4,
              "minTurnRate": 0.2,
              "maxTurnRate": 1.8,
              "turnWindow": 0.5,
              "holdSeconds": 2
            },
            "goSniff": {
              "offerSeconds": 3,
              "durationSeconds": 4,
              "speed": 0.4,
              "decayFactor": 3
            },
            "turnAngle": 0.7853981633974483,
            "followSeconds": 1.5,
            "correctionWaitSeconds": 4,
            "pullStrength": 0.8,
            "configVersion": "bundled",
            "camera": {
              "closeZoom": 2.2,
              "farZoom": 1.5,
              "padding": 90,
              "smoothing": 3
            },
            "endCondition": {
              "kind": "reach-waypoint"
            }
          }
        },
        "exercises": [
          {
            "metric": "tension",
            "key": "node.u.exercise1"
          },
          {
            "metric": "attention",
            "key": "node.u.exercise2"
          },
          {
            "metric": "poste",
            "key": "node.u.exercise3"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-slack-u-1"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 3 · La correa en U\n\n## primer\n### card 1\nRecuerda: mira la forma de la correa. Si la U se cierra en J, frenas o dices su nombre antes de que tire.\n- caption: U, J, recta: la J es el aviso\n\n## checkpoint\n### tq1\n¿Por qué conviene actuar cuando ves la J?\n- [x] Porque aún no está enganchado al olor\n- [ ] Porque la correa ya está tensa del todo\n- [ ] Porque así puedes darle más correa\n- why: En la J aún te escucha; con la correa tensa ya está enganchado y le cuesta mucho más volver.\n\n### tq2\nLa U se acorta y queda en J. ¿Qué haces?\n- [x] Freno el paso o digo su nombre una vez\n- [ ] Sigo igual hasta que la correa se tense\n- [ ] Repito su nombre hasta que vuelva\n- why: En cuanto veas la J, cambia tú antes de la tensión: frena un poco el paso o di su nombre una vez, en voz suave.\n\n### tq3\n¿Dónde llevas la mano de la correa?\n- [x] Quieta, junto a tu cintura\n- [ ] Estirada hacia delante, siguiéndole\n- [ ] En alto, a la altura del pecho\n- why: Si estiras el brazo, la U se mantiene pero tu mano le sigue y aprende a ir delante: la U viene de que esté cerca.\n\n## exercises\n- tension: En la calle: camina una manzana entera con la correa en U y sin tirones.\n- attention: En la calle: cambia de dirección con suavidad y comprueba que tu perro te sigue.\n- poste: En la calle: tras un susto, deja que olfatee unos segundos antes de seguir.\n\n"
      },
      "files": [
        "media/theory-slack-u-1.png"
      ]
    },
    "urban-mix": {
      "config": {
        "id": "urban-mix",
        "mode": "stage",
        "prerequisites": [
          "scooter-crossing"
        ],
        "simulation": {
          "scenario": {
            "world": 4,
            "theme": "urban_street",
            "fixedStep": 0.016666666666666666,
            "leashLength": 2,
            "leashTolerance": 0.1,
            "quickSpeed": 2,
            "walkStrength": 0.6,
            "handlerStart": {
              "x": 0,
              "y": 0
            },
            "dogStart": {
              "x": 1,
              "y": 0
            },
            "waypoint": {
              "x": 80,
              "y": 30
            },
            "waypoints": [
              {
                "x": 40,
                "y": 0
              },
              {
                "x": 40,
                "y": 30
              }
            ],
            "waypointRadius": 2,
            "walls": [
              {
                "from": {
                  "x": -4,
                  "y": -6
                },
                "to": {
                  "x": 46,
                  "y": -6
                }
              },
              {
                "from": {
                  "x": 46,
                  "y": -6
                },
                "to": {
                  "x": 46,
                  "y": 24
                }
              },
              {
                "from": {
                  "x": 46,
                  "y": 24
                },
                "to": {
                  "x": 84,
                  "y": 24
                }
              },
              {
                "from": {
                  "x": -4,
                  "y": 6
                },
                "to": {
                  "x": 34,
                  "y": 6
                }
              },
              {
                "from": {
                  "x": 34,
                  "y": 6
                },
                "to": {
                  "x": 34,
                  "y": 36
                }
              },
              {
                "from": {
                  "x": 34,
                  "y": 36
                },
                "to": {
                  "x": 84,
                  "y": 36
                }
              }
            ],
            "scenery": [
              {
                "type": "parked_car",
                "pos": {
                  "x": 20,
                  "y": -3.6
                },
                "visualShield": true,
                "radius": 1.4
              },
              {
                "type": "parked_car",
                "pos": {
                  "x": 37.5,
                  "y": 18
                },
                "visualShield": true,
                "radius": 1.4
              },
              {
                "type": "parked_car",
                "pos": {
                  "x": 60,
                  "y": 33.4
                },
                "visualShield": true,
                "radius": 1.4
              },
              {
                "type": "bench",
                "pos": {
                  "x": 10,
                  "y": -3.6
                },
                "angle": 0
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 28,
                  "y": 3.6
                }
              },
              {
                "type": "sign",
                "pos": {
                  "x": 60,
                  "y": 27
                }
              },
              {
                "type": "trash_can",
                "pos": {
                  "x": 72,
                  "y": 27.2
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 2.403536013575892,
                  "y": 5.026682480238378
                },
                "angle": 0
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 5.509792595046261,
                  "y": -4.683943453803659
                }
              },
              {
                "type": "bike_rack",
                "pos": {
                  "x": 7.7058044675116735,
                  "y": 4.096720002498477
                },
                "angle": 0
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 11.80573935173452,
                  "y": -5.005754665657878
                }
              },
              {
                "type": "bus_stop",
                "pos": {
                  "x": 15.343964628440641,
                  "y": 4.8762199930846695
                },
                "angle": 0
              },
              {
                "type": "hydrant",
                "pos": {
                  "x": 19.985337921666602,
                  "y": -4.66738217966631
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 23.972442656941713,
                  "y": 4.505741669703275
                }
              },
              {
                "type": "bin",
                "pos": {
                  "x": 27.66880210538705,
                  "y": -5.052649913821369
                }
              },
              {
                "type": "scooter",
                "pos": {
                  "x": 31.38300028201193,
                  "y": 4.428497785050422
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 35.632188388208554,
                  "y": -5.01707895770669
                }
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 36.72510245610028,
                  "y": 4.948641856852919
                },
                "angle": 1.5707963267948966
              },
              {
                "type": "trash_can",
                "pos": {
                  "x": 44.83284305799752,
                  "y": 2.8053875339527963
                }
              },
              {
                "type": "sign",
                "pos": {
                  "x": 35.56476964540779,
                  "y": 6.179496726952493
                }
              },
              {
                "type": "parked_car",
                "pos": {
                  "x": 44.99824988730252,
                  "y": 10.477099477810164
                },
                "visualShield": true,
                "radius": 1.4,
                "angle": 1.5707963267948966
              },
              {
                "type": "sign",
                "pos": {
                  "x": 35.746601837966594,
                  "y": 14.236311191692948
                }
              },
              {
                "type": "trash_can",
                "pos": {
                  "x": 45.14379985108972,
                  "y": 17.250985283218327
                }
              },
              {
                "type": "kiosk",
                "pos": {
                  "x": 35.69049289645627,
                  "y": 21.46362349229554
                }
              },
              {
                "type": "lamp_post",
                "pos": {
                  "x": 45.02226129034534,
                  "y": 23.073640548003212
                }
              },
              {
                "type": "bin",
                "pos": {
                  "x": 35.7483991144225,
                  "y": 28.456087191713365
                }
              },
              {
                "type": "scooter",
                "pos": {
                  "x": 35.78781562512741,
                  "y": 29.855144806019965
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 45.10288256599259,
                  "y": 25.972713340073824
                }
              },
              {
                "type": "bench",
                "pos": {
                  "x": 47.55582492382575,
                  "y": 35.13801446314901
                },
                "angle": 0
              },
              {
                "type": "bike_rack",
                "pos": {
                  "x": 53.599917283467946,
                  "y": 25.82147333305329
                },
                "angle": 0
              },
              {
                "type": "bus_stop",
                "pos": {
                  "x": 54.763390654698014,
                  "y": 34.40434566354379
                },
                "angle": 0
              },
              {
                "type": "flower_bed",
                "pos": {
                  "x": 60.39103096537292,
                  "y": 25.56896464433521
                },
                "angle": 0
              },
              {
                "type": "parked_car",
                "pos": {
                  "x": 62.0778925392156,
                  "y": 34.54086531074718
                },
                "visualShield": true,
                "radius": 1.4,
                "angle": 0
              },
              {
                "type": "hydrant",
                "pos": {
                  "x": 67.49563187317301,
                  "y": 24.95214777048677
                }
              },
              {
                "type": "fountain",
                "pos": {
                  "x": 69.92385069442292,
                  "y": 34.82288417657837
                }
              },
              {
                "type": "sign",
                "pos": {
                  "x": 74.51516510664175,
                  "y": 25.534181610867382
                }
              },
              {
                "type": "tree",
                "pos": {
                  "x": 78.01449732513478,
                  "y": 34.30860575139523
                }
              }
            ],
            "cues": [
              "lets-go",
              "leave-it"
            ],
            "dogGoalSpeed": 1.6,
            "dogFixationSpeed": 1,
            "dogReturnSpeed": 1.6,
            "dogReturnDistance": 1,
            "wanderMaxAngle": 0.5,
            "wanderTurnRate": 2,
            "distractor": {
              "kind": "food",
              "speed": 0,
              "triggerRadius": 6,
              "activateAfterMeters": 12,
              "startOffset": 28,
              "salience": 6,
              "path": {
                "from": {
                  "x": 22,
                  "y": 1
                },
                "to": {
                  "x": 22,
                  "y": 1
                }
              }
            },
            "moreDistractors": [
              {
                "kind": "skateboard",
                "speed": 4.5,
                "triggerRadius": 14,
                "activateAfterMeters": 26,
                "startOffset": 28,
                "path": {
                  "from": {
                    "x": 30,
                    "y": -18
                  },
                  "to": {
                    "x": 30,
                    "y": 18
                  }
                }
              },
              {
                "kind": "dog",
                "speed": 2.6,
                "triggerRadius": 12,
                "activateAfterMeters": 52,
                "startOffset": 28,
                "path": {
                  "from": {
                    "x": 44,
                    "y": 20
                  },
                  "to": {
                    "x": 36,
                    "y": 42
                  }
                }
              }
            ],
            "calmSeconds": 3,
            "rewardWindowSeconds": 1.1,
            "markBudget": 5,
            "checkInWindow": 1,
            "learning": {
              "attributes": {
                "reconnectionLatency": 0.2,
                "reactivityThreshold": 0.2,
                "followChance": 0.5,
                "checkInFrequency": 0.2
              },
              "triggerProfile": {
                "child": 2,
                "bicycle": 2,
                "dog": 2,
                "skateboard": 2,
                "food": 2,
                "other": 2,
                "hand": 2
              },
              "equipment": "collar",
              "capacityMultiplier": 1,
              "posture": 0
            },
            "ranges": {
              "reconnectionSeconds": {
                "worst": 1.5,
                "best": 0.3
              },
              "reactivityThreshold": {
                "worst": 15,
                "best": 60
              },
              "checkInMeanInterval": {
                "worst": 14,
                "best": 5
              }
            },
            "arousal": {
              "k": 30,
              "minDistance": 2,
              "decayPerSecond": 3,
              "rigidPullRate": 4,
              "disengagementDrop": 25,
              "markerHitDrop": 20,
              "posteJolt": 15,
              "smoothStopFactor": 0.3,
              "slowedSeconds": 0.5
            },
            "cue": {
              "cooldownSeconds": 3,
              "fixatedFactor": 0.3,
              "repeatFactor": 0.5,
              "arousalDrop": 10,
              "followBoostSeconds": 2,
              "followBoost": 0.25,
              "followCap": 0.95
            },
            "reaction": {
              "alertFraction": 0.6,
              "lungeAccel": 1.5,
              "lungeMaxSpeed": 4,
              "alertSlowdown": 0.85
            },
            "sintonia": {
              "minSpeed": 0.4,
              "minTurnRate": 0.2,
              "maxTurnRate": 1.8,
              "turnWindow": 0.5,
              "holdSeconds": 2
            },
            "goSniff": {
              "offerSeconds": 3,
              "durationSeconds": 4,
              "speed": 0.4,
              "decayFactor": 3
            },
            "turnAngle": 0.7853981633974483,
            "followSeconds": 1.5,
            "correctionWaitSeconds": 4,
            "pullStrength": 0.8,
            "configVersion": "bundled",
            "camera": {
              "closeZoom": 2.2,
              "farZoom": 1.5,
              "padding": 90,
              "smoothing": 3
            },
            "endCondition": {
              "kind": "reach-waypoint"
            }
          }
        },
        "exercises": [
          {
            "metric": "tension",
            "key": "node.urban.exercise1"
          },
          {
            "metric": "timing",
            "key": "node.urban.exercise2"
          },
          {
            "metric": "poste",
            "key": "node.urban.exercise3"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-choosing-cue-1"
            }
          }
        ]
      },
      "text": {
        "es": "# Mundo 4 · La calle de verdad\n\n## primer\n### card 1\nRecuerda: quieto en el suelo, Déjalo; si se mueve, Vamos. Si ninguna encaja, más distancia.\n- caption: Quieto en el suelo, Déjalo; si se mueve, Vamos\n\n## checkpoint\n### tq1\n¿Por qué con un patinete no usas «Déjalo»?\n- [x] Se acerca, y alejaros le da distancia\n- [ ] Lo ignora mejor si te quedas quieto\n- [ ] Solo sirve en casa, no en la calle\n- why: Lo que se mueve se acerca y le emociona más cada segundo; alejaros juntos con «Vamos» le da distancia, y eso baja la excitación.\n\n### tq2\nVes pan en la acera y no lo ha visto aún. ¿Qué haces?\n- [x] Digo «Déjalo» una vez, antes de llegar\n- [ ] Repito «Déjalo» hasta que lo pasemos\n- [ ] Espero a que lo huela y luego hablo\n- why: Lo que está quieto en el suelo pide «Déjalo», dicho una vez y antes de que llegue a ello.\n\n### tq3\nDices «Vamos» y no responde. ¿Qué haces?\n- [x] Gano distancia: cruzo o cambio de ruta\n- [ ] Repito «Vamos» más alto hasta que venga\n- [ ] Cambio a «Déjalo» por si le va mejor\n- why: Si no responde, no le pidas más: gana distancia, cruza de acera, cambia de ruta o vuelve a casa.\n\n## exercises\n- tension: En la calle: camina con la correa floja incluso cuando haya mucho movimiento.\n- timing: En la calle: elige la señal correcta según lo que se mueva o esté quieto.\n- poste: En la calle: si no puedes evitar algo, párate y espera.\n\n"
      },
      "files": [
        "media/theory-choosing-cue-1.png"
      ]
    },
    "walk-distraction": {
      "config": {
        "id": "walk-distraction",
        "mode": "stage",
        "prerequisites": [
          "poste-practice"
        ],
        "simulation": {},
        "exercises": [
          {
            "metric": "tension",
            "key": "node.walk.exerciseTension"
          },
          {
            "metric": "timing",
            "key": "node.walk.exerciseTiming"
          },
          {
            "metric": "poste",
            "key": "node.walk.exercisePoste"
          },
          {
            "metric": "attention",
            "key": "node.walk.exerciseAttention"
          }
        ],
        "primerCards": [
          {
            "kind": "real-world",
            "media": {
              "type": "image",
              "url": "",
              "art": "theory-loose-leash-2"
            }
          },
          {
            "kind": "virtual-dog"
          }
        ]
      },
      "text": {
        "es": "# Paseo con distracción\n\n## primer\n### card 1\nRecuerda: mira lejos, haz poste si la correa se tensa y paga la correa floja con un «bien» o dejándole oler.\n- caption: Mira lejos: lo ves llegar antes que él\n\n### card 2\nEn el juego: joystick para caminar, suéltalo para hacer poste y usa Olfatear como premio.\n\n## checkpoint\n### tq1\nSolo le dices algo cuando tira. ¿Qué pasa?\n- [x] Los ratos de correa floja no ganan nada\n- [ ] Aprende que tirar no le sirve de nada\n- [ ] Camina mejor porque nota que le vigilas\n- why: Lo que hace justo antes de un premio es lo que aprende; si solo reaccionas a los tirones, los ratos buenos pasan sin que nada los premie.\n\n### tq2\nVes llegar un monopatín al fondo. ¿Qué haces?\n- [x] Me aparto a un lado antes de que tense\n- [ ] Sigo igual y hago poste si se lanza\n- [ ] Acelero para pasarlo cuanto antes\n- why: Mirar lejos te deja verlo antes que él: apártate o frena antes de que la correa se tense. Si dudas, más distancia.\n\n### tq3\nQuiere oler un árbol. ¿Cuándo le dejas?\n- [x] Cuando llega con la correa colgando\n- [ ] Cuando llega, aunque haya tirado\n- [ ] Nunca, porque oler le distrae del paseo\n- why: Si llega tirando, el olor le paga el tirón; si llega con la correa floja, el olor premia la correa floja.\n\n## exercises\n- tension: En la calle: durante un paseo, cuenta cuántas veces se tensa la correa y baja esa cifra cada día.\n- timing: En casa: premia con la voz justo cuando tu perro aparta la vista de un juguete.\n- poste: En la calle: cuando veas algo que lo altere, párate antes de que la correa se tense.\n- attention: En casa: premia cada vez que tu perro te mira sin que lo llames.\n\n"
      },
      "files": [
        "media/theory-loose-leash-2.png"
      ]
    }
  },
  "missions": {
    "mission-alone": {
      "config": {
        "id": "mission-alone",
        "technique": "alone",
        "reps": 7,
        "place": "home",
        "sharedNote": "lesson.note.alone",
        "trains": [
          {
            "kind": "node",
            "id": "alone-door"
          }
        ],
        "problems": [
          {
            "id": "cries-at-once",
            "label": "cries-at-once",
            "practise": {
              "kind": "node",
              "id": "alone-door"
            }
          },
          {
            "id": "panic",
            "label": "panic",
            "practise": {
              "kind": "node",
              "id": "alone-door"
            }
          },
          {
            "id": "cries-at-close",
            "label": "cries-at-close",
            "practise": {
              "kind": "node",
              "id": "alone-door"
            }
          }
        ]
      },
      "text": {
        "es": "# Aprender a quedarse solo\n\n## target\nDurante varios días, practica con {name} el protocolo paso a paso: puerta abierta, distancia, microcierre de un segundo y señal de liberación. Si hay pánico o se pasa el tiempo, abre y vuelve a un paso más corto.\n\n## success\nTolera el microcierre y la señal de liberación sin angustia, y se queda tranquilo en su espacio.\n\n## problems\n### cries-at-once\n- label: Llora nada más separarnos\n- reassure: Es muy común: para {name}, separarse de ti es lo más difícil de la casa.\n- cause: Probablemente el paso es demasiado grande, o salís justo cuando está más emocionado.\n- c1: Vuelve al paso anterior: puerta abierta y tú a la vista. Antes de salir, un paseo y una despedida sin alboroto.\n- c2: Si {name} babea, intenta escapar, no quiere ni las golosinas, se hace daño o destroza la puerta cuando se queda solo, para el entrenamiento, abre la puerta y consulta con tu veterinario o con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Alejarte un solo paso con la puerta abierta y volver antes de que proteste.\n- alt: La persona se aleja un paso mientras el perro descansa en su espacio\n- caption: Un paso, y vuelves\n\n### panic\n- label: Entra en pánico\n- reassure: No es mala educación ni terquedad: es miedo, y se trata con calma y paciencia.\n- cause: Si babea, araña la puerta, intenta escapar o no quiere ni la golosina, el paso ha sido demasiado grande.\n- c1: Abre la puerta ya, sin hacer fiesta, y ve a un paso mucho más corto al día siguiente. No esperes a que se canse.\n- c2: Si {name} babea, intenta escapar, no quiere ni las golosinas, se hace daño o destroza la puerta cuando se queda solo, para el entrenamiento, abre la puerta y consulta con tu veterinario o con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Parar el entrenamiento un par de días y consultar con un profesional antes de seguir.\n- alt: La persona abre la puerta del parque y el perro sale tranquilo\n- caption: Si hay pánico, se abre\n\n### cries-at-close\n- label: Llora cuando cierro la puerta\n- reassure: Es normal al principio: el cierre es el paso nuevo y {name} lo nota.\n- cause: El microcierre puede ser todavía demasiado largo, o la señal de liberación no se parece a una orden.\n- c1: Cierra la puerta solo un segundo, ábrela y dile la señal de liberación. Alarga el cierre muy poco a poco; con cachorros menores de 4 meses espera 2 minutos como máximo, y 10 con perros mayores.\n- c2: Si {name} babea, intenta escapar, no quiere ni las golosinas, se hace daño o destroza la puerta cuando se queda solo, para el entrenamiento, abre la puerta y consulta con tu veterinario o con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Cerrar medio segundo, abrir y premiar, tres veces seguidas.\n- alt: La persona cierra la puerta del parque un segundo y la abre\n- caption: Un segundo de cierre\n\n## general\n- reassure: Quedarse solo cuesta, a muchos perros y a muchas personas que los quieren. Cada paso corto cuenta.\n- cause: Lo más habitual es avanzar más deprisa de lo que {name} puede llevar.\n- c1: Si dudas entre dos pasos, elige el más corto. Mejor un día de más que un susto.\n- c2: Si {name} babea, intenta escapar, no quiere ni las golosinas, se hace daño o destroza la puerta cuando se queda solo, para el entrenamiento, abre la puerta y consulta con tu veterinario o con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Repetir hoy el paso de ayer, sin avanzar.\n- alt: El perro tumbado tranquilo en su espacio con la puerta abierta\n- caption: Pasos cortos\n"
      },
      "files": []
    },
    "mission-bark-home": {
      "config": {
        "id": "mission-bark-home",
        "technique": "bark-home",
        "reps": 5,
        "place": "home",
        "trains": [
          {
            "kind": "node",
            "id": "bark-home"
          }
        ],
        "problems": [
          {
            "id": "nonstop",
            "label": "nonstop",
            "practise": {
              "kind": "node",
              "id": "bark-home"
            }
          },
          {
            "id": "shout",
            "label": "shout",
            "practise": {
              "kind": "node",
              "id": "bark-home"
            }
          },
          {
            "id": "trigger",
            "label": "trigger",
            "practise": {
              "kind": "node",
              "id": "bark-home"
            }
          }
        ]
      },
      "text": {
        "es": "# Premiar el silencio\n\n## target\nCuando {name} ladre, quita el motivo o espera sin hablarle y, en cuanto haga una pausa en silencio, dile «bien» y dale una golosina. Hazlo cinco veces en un día.\n\n## success\nHay pausas más largas entre ladridos y {name} se calma antes que el primer día.\n\n## problems\n### nonstop\n- label: No para de ladrar\n- reassure: Al principio puede tardar. No es que no funcione: está aprendiendo que ladrar ya no paga.\n- cause: Seguramente lo que lo dispara sigue delante: la ventana, el rellano o el ruido.\n- c1: Quita el motivo: cierra la cortina o ve con él a otra habitación más tranquila.\n- c2: Espera allí sin hablarle y premia la primera pausa, aunque sea de un segundo.\n- easier: Que haga una pausa en otra habitación, lejos de lo que lo dispara, 2 veces.\n- alt: Una cortina cerrada y el perro tumbado en calma delante de ella\n- caption: Quitar lo que lo dispara\n\n### shout\n- label: Acabo gritándole\n- reassure: Le pasa a casi todo el mundo: el ladrido cansa y cuesta esperar en silencio.\n- cause: Para {name}, tu grito suena a más ladridos y la excitación sube.\n- c1: Decide antes cuánto vas a esperar y respira despacio; si te ayuda, ponte auriculares.\n- c2: Ten la golosina preparada para la pausa, no para que se calle.\n- easier: Esperar un minuto en silencio antes de hacer nada, 2 veces.\n- alt: La persona espera en silencio con una golosina guardada en la mano\n- caption: Esperar y premiar la pausa\n\n### trigger\n- label: No puedo quitar lo que lo dispara\n- reassure: No siempre se puede quitar el motivo; se puede reducir.\n- cause: A veces el motivo es la calle entera o los vecinos, y no depende de ti.\n- c1: Cambia su sitio de descanso a una habitación sin ventana a la calle.\n- c2: Pon música suave o un ruido blanco para amortiguar los sonidos del rellano.\n- easier: Dejarlo descansar un rato al día en la habitación más tranquila.\n- alt: El perro descansa en una habitación sin ventana, con música suave\n- caption: Un sitio sin motivos\n\n## general\n- reassure: Esperar el silencio cuesta. Cada vez que lo consigues, {name} aprende algo.\n- cause: Lo más habitual es empezar por la situación más difícil.\n- c1: Practica primero con algo pequeño, como un ruido suave, antes que con una visita.\n- c2: Repasa la lección «Ladra en casa».\n- easier: Premiar un solo silencio con algo pequeño.\n- alt: El perro, tumbado en calma, recibe una golosina de la persona\n- caption: Empezar por lo fácil\n\n"
      },
      "files": []
    },
    "mission-bite-others": {
      "config": {
        "id": "mission-bite-others",
        "technique": "bite-others",
        "reps": 3,
        "place": "home",
        "sharedNote": "plan.note.professional",
        "trains": [
          {
            "kind": "lesson",
            "id": "theory-bite-others"
          }
        ],
        "problems": [
          {
            "id": "approach",
            "label": "approach",
            "practise": {
              "kind": "lesson",
              "id": "theory-bite-others"
            }
          },
          {
            "id": "growl",
            "label": "growl",
            "practise": {
              "kind": "lesson",
              "id": "theory-bite-others"
            }
          },
          {
            "id": "cantmanage",
            "label": "cantmanage",
            "practise": {
              "kind": "lesson",
              "id": "theory-bite-others"
            }
          }
        ]
      },
      "text": {
        "es": "# Proteger a los demás\n\n## target\nDurante tres días, evita las situaciones con personas que más le cuestan a {name}; cuando no puedas evitarlas, pon una puerta cerrada o una valla entre ellas y {name}, y anota los avisos que veas. Para practicar la calma con las manos cerca, juega el primer ejercicio del Mundo 1.\n\n## success\nNadie se ha acercado a {name} sin permiso y has anotado sus avisos sin mordiscos.\n\n## problems\n### approach\n- label: Alguien se acercó igualmente\n- reassure: Le pasa a mucha gente: los demás no saben leer los avisos de un perro.\n- cause: Probablemente la otra persona no sabía que debía mantener la distancia.\n- c1: Ponte entre {name} y la persona, aumenta la distancia y di con calma: «Mejor no le saludes ahora».\n- c2: Si {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Salir en las horas más tranquilas, un día.\n- alt: La persona se pone entre el perro y un desconocido y le hace un gesto de calma\n- caption: Ponerte en medio\n\n### growl\n- label: Ha gruñido o se ha lanzado\n- reassure: Ha avisado, y es lo mejor que puede hacer un perro antes de morder: respétalo.\n- cause: Lo más probable es que la distancia fuera demasiado corta para lo que {name} aguanta hoy.\n- c1: Aumenta la distancia al instante, sin tirar de la correa ni reñirle, y retírate de esa situación.\n- c2: Si {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Evitar a las personas ajenas un día entero y anotar los avisos en casa.\n- alt: La persona y el perro se alejan despacio de otra persona\n- caption: Más distancia\n\n### cantmanage\n- label: No pude evitar la situación\n- reassure: No siempre se puede controlar todo; basta con reducirlo.\n- cause: A veces la situación depende de otros, como una escalera comunitaria o un portal.\n- c1: Cambia la hora o el sitio del paseo, o usa otra salida, hasta que consigas un trayecto con pocas personas.\n- c2: Si {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Un solo paseo a una hora tranquila.\n- alt: Una calle vacía a primera hora\n- caption: Menos gente, menos riesgo\n\n## general\n- reassure: Proteger a los demás y a {name} cuesta. Cada día sin incidentes cuenta.\n- cause: Lo habitual es querer hacerlo todo a la vez.\n- c1: Evita lo más difícil primero y anota qué avisos ves.\n- c2: Si {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Evitar una sola situación durante un día.\n- alt: Una libreta con una lista corta y un lápiz\n- caption: Empezar por lo más difícil de evitar\n\n"
      },
      "files": []
    },
    "mission-bite-owner": {
      "config": {
        "id": "mission-bite-owner",
        "technique": "bite-owner",
        "reps": 3,
        "place": "home",
        "sharedNote": "plan.note.professional",
        "trains": [
          {
            "kind": "node",
            "id": "calm-hands"
          }
        ],
        "problems": [
          {
            "id": "growls",
            "label": "growls",
            "practise": {
              "kind": "node",
              "id": "calm-hands"
            }
          },
          {
            "id": "bit",
            "label": "bit",
            "practise": {
              "kind": "node",
              "id": "calm-hands"
            }
          },
          {
            "id": "cantavoid",
            "label": "cantavoid",
            "practise": {
              "kind": "node",
              "id": "calm-hands"
            }
          }
        ]
      },
      "text": {
        "es": "# Evitar el mordisco\n\n## target\nDurante tres días, anota cada vez que {name} gruña o muerde, y evita una de las situaciones que lo provocan; por ejemplo, dale el hueso en otra habitación con la puerta cerrada. Para practicar la calma con las manos cerca, juega el primer ejercicio del Mundo 1.\n\n## success\nHas anotado cada aviso, has evitado la situación que elegiste y no ha habido mordiscos.\n\n## problems\n### growls\n- label: Sigue gruñendo\n- reassure: Un gruñido es un aviso, no un fracaso: te dice que algo le molesta antes de morder.\n- cause: Seguramente sigue presente lo que le molesta: la comida, el sitio o que te acerques en ese momento.\n- c1: Retrocede y dale espacio en cuanto gruña, sin hablarle ni mirarle fijamente.\n- c2: Si {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Evitar una sola situación durante un día y anotar si gruñe.\n- alt: La persona retrocede con calma y deja espacio al perro\n- caption: Dar espacio\n\n### bit\n- label: Ha vuelto a morder\n- reassure: Pasa, y no significa que lo hayas hecho mal. Lo importante ahora es la seguridad de todos.\n- cause: Lo más probable es que haya llegado a una situación que aún no podías evitar, o que no viste el aviso a tiempo.\n- c1: Si hay herida, límpiala y pide atención médica si es profunda. Separa a {name} de la persona con una puerta, sin forzarlo.\n- c2: Si {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Evitar la situación del mordisco un día entero y consultar con un profesional del comportamiento.\n- alt: Una puerta cerrada separa al perro de la persona\n- caption: Primero, separar\n\n### cantavoid\n- label: No puedo evitar la situación\n- reassure: No siempre se puede evitar todo; empieza por lo que sí puedes.\n- cause: A menudo la situación es de todos los días, como la comida o el sofá, y cuesta cambiar la rutina.\n- c1: Elige una sola situación y cámbiala: la comida en otra habitación con la puerta cerrada, o una manta en el suelo en vez del sofá.\n- c2: Si {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Cambiar solo el sitio de la comida durante un día.\n- alt: Una puerta cerrada con el perro comiendo tranquilo al otro lado\n- caption: Cambiar una sola cosa\n\n## general\n- reassure: Cambiar hábitos cuesta, y es normal dudar. Cada día sin mordisco cuenta.\n- cause: Lo más habitual es querer cambiar demasiadas cosas a la vez.\n- c1: Empieza por una sola situación y anota qué pasa justo antes del aviso.\n- c2: Si {name} muerde con fuerza o con frecuencia, consulta cuanto antes con un profesional del comportamiento. Esta app no sustituye ese apoyo.\n- easier: Anotar los avisos de un solo día.\n- alt: Una libreta con una lista corta y un lápiz\n- caption: Una cosa cada vez\n\n"
      },
      "files": []
    },
    "mission-calm-first": {
      "config": {
        "id": "mission-calm-first",
        "technique": "calm-first",
        "reps": 2,
        "place": "home",
        "trains": [
          {
            "kind": "node",
            "id": "calm-first"
          }
        ],
        "problems": [
          {
            "id": "neverstops",
            "label": "neverstops",
            "practise": {
              "kind": "node",
              "id": "calm-first"
            }
          },
          {
            "id": "escalates",
            "label": "escalates",
            "practise": {
              "kind": "node",
              "id": "calm-first"
            }
          },
          {
            "id": "givein",
            "label": "givein",
            "practise": {
              "kind": "node",
              "id": "calm-first"
            }
          }
        ]
      },
      "text": {
        "es": "# Primero, calma\n\n## target\nCuando ladre sin parar o corra por la casa, espera sin moverte ni hablar a que se calme. Pídele algo solo cuando esté en calma, y premia esa calma.\n\n## success\nSe calma antes que el primer día y, entonces, te mira y te escucha.\n\n## problems\n### neverstops\n- label: No se calma nunca\n- reassure: Al principio puede tardar mucho. No es que no funcione: está aprendiendo que ladrar ya no trae nada.\n- cause: Seguramente lo que lo dispara sigue delante: la ventana, la visita o el ruido.\n- c1: Quita lo que lo excita: cierra la cortina, o pasa con él a otra habitación más tranquila.\n- c2: Espera allí sin hablarle. Cuenta los segundos y apúntalos: verás que bajan.\n- easier: Que se calme en otra habitación, lejos de lo que lo excita, 2 veces.\n- alt: Una cortina cerrada y el perro tumbado en calma delante de ella\n- caption: Quitar lo que lo dispara\n\n### escalates\n- label: Se excita todavía más\n- reassure: Es normal que al principio suba un poco antes de bajar.\n- cause: Probablemente algo de lo que haces añade energía: moverte rápido, hablar o mirarle a los ojos.\n- c1: Quédate de pie, sin moverte, con los brazos bajados y la mirada en otra parte.\n- c2: Respira despacio y en silencio: tu calma le ayuda a bajar.\n- easier: Que baje un poco la excitación mientras esperas sin moverte, 2 veces.\n- alt: La persona, de pie y con los brazos bajados, mira hacia otro lado\n- caption: No añadir energía\n\n### givein\n- label: Acabo hablándole o dándole algo\n- reassure: Le pasa a casi todo el mundo: el ladrido cansa y cuesta no hacer nada.\n- cause: Lo más probable es que, al final, una palabra o una golosina le haya pagado el ladrido.\n- c1: Decide antes cuánto vas a esperar, y ponte unos auriculares si te ayuda.\n- c2: Ten la golosina preparada para cuando se calme, no para que se calle.\n- easier: Esperar un minuto en silencio antes de hacer nada, 2 veces.\n- alt: La persona espera con una golosina guardada mientras el perro se calma\n- caption: La golosina, para la calma\n\n## general\n- reassure: Esperar la calma cuesta. Cada vez que lo consigues, tu perro aprende algo.\n- cause: Lo más habitual es empezar por la situación más difícil.\n- c1: Practica primero con algo pequeño, como un ruido suave, antes que con una visita.\n- c2: Repasa la lección «Primero, calma».\n- easier: Esperar la calma una vez, con algo pequeño.\n- alt: El perro, tumbado en calma, recibe una golosina de la persona\n- caption: Empezar por lo fácil\n\n"
      },
      "files": []
    },
    "mission-corners": {
      "config": {
        "id": "mission-corners",
        "technique": "blind-corner",
        "reps": 4,
        "trains": [
          {
            "kind": "node",
            "id": "blind-corner"
          }
        ],
        "problems": [
          {
            "id": "ahead",
            "label": "ahead",
            "practise": {
              "kind": "node",
              "id": "blind-corner"
            }
          },
          {
            "id": "surprise",
            "label": "surprise",
            "practise": {
              "kind": "node",
              "id": "blind-corner"
            }
          },
          {
            "id": "forget",
            "label": "forget",
            "practise": {
              "kind": "lesson",
              "id": "theory-blind-corner"
            }
          }
        ]
      },
      "text": {
        "es": "# Las esquinas de tu barrio\n\n## target\nFrena antes de cada esquina de tu manzana y dóblala con tu perro a tu lado.\n\n## success\nDoblas las esquinas con la correa floja.\n\n## problems\n### ahead\n- label: Va siempre por delante\n- reassure: Ir delante es lo que hacen casi todos los perros. Les gusta explorar.\n- cause: Seguramente frenaste demasiado tarde, ya en la esquina.\n- c1: Empieza a frenar tres o cuatro pasos antes de la esquina.\n- c2: Premia a tu lado, a la altura de la cadera.\n- easier: Frenar y premiar antes de 2 esquinas.\n- alt: Una persona frena unos pasos antes de la esquina\n- caption: Frenar antes\n\n### surprise\n- label: Se asustó con algo\n- reassure: Un susto en una esquina es justo lo que intentamos prevenir. Hiciste bien en salir.\n- cause: Algo apareció de golpe y tu perro iba sin margen.\n- c1: Abre la curva: gira por la parte más ancha de la acera.\n- c2: Después de un susto, para y deja que olfatee.\n- easier: Doblar 2 esquinas tranquilas por el lado ancho.\n- alt: Una persona gira por la parte ancha de la acera\n- caption: Abrir la curva\n\n### forget\n- label: Se me olvidó frenar\n- reassure: Olvidarse es lo más normal: es un hábito nuevo para ti también.\n- cause: Las esquinas llegan sin avisar si no las buscas.\n- c1: Elige antes de salir qué esquinas vas a practicar.\n- c2: Usa una señal tuya, como tocar la correa, al ver la esquina.\n- easier: Practicar en una sola esquina elegida, 2 veces.\n- alt: Un mapa sencillo de una manzana con sus esquinas marcadas\n- caption: Elegir las esquinas\n\n## general\n- reassure: Cada esquina es distinta. Seguir intentándolo es lo importante.\n- cause: Lo habitual es intentarlo en todas las esquinas a la vez.\n- c1: Empieza por las esquinas con más visibilidad.\n- c2: Repasa la teoría de la esquina ciega.\n- easier: Doblar una esquina con buena visibilidad, 2 veces.\n- alt: Una esquina con buena visibilidad\n- caption: Esquinas fáciles primero\n\n"
      },
      "files": []
    },
    "mission-cue-choice": {
      "config": {
        "id": "mission-cue-choice",
        "technique": "cue-choice",
        "reps": 2,
        "trains": [
          {
            "kind": "node",
            "id": "close-narrow-street-pass"
          },
          {
            "kind": "node",
            "id": "urban-mix"
          }
        ],
        "problems": [
          {
            "id": "mixup",
            "label": "mixup",
            "practise": {
              "kind": "lesson",
              "id": "theory-choosing-cue"
            }
          },
          {
            "id": "toomuch",
            "label": "toomuch",
            "practise": {
              "kind": "node",
              "id": "urban-mix"
            }
          },
          {
            "id": "nothing",
            "label": "nothing",
            "practise": {
              "kind": "node",
              "id": "urban-mix"
            }
          }
        ]
      },
      "text": {
        "es": "# La señal justa\n\n## target\nEn un paseo por una calle concurrida, usa Déjalo con la comida y Vamos con lo rápido.\n\n## success\nEliges la señal sin dudar al menos dos veces.\n\n## problems\n### mixup\n- label: Las confundí\n- reassure: Confundirlas al principio le pasa a todo el mundo.\n- cause: Dos señales nuevas a la vez son mucho que recordar.\n- c1: Antes de salir, repite: comida, Déjalo; rápido, Vamos.\n- c2: Si dudas, haz poste: siempre funciona.\n- easier: Usar bien una sola de las dos señales, 2 veces.\n- alt: Una tarjeta con dos señales: comida y patinete\n- caption: Una señal por situación\n\n### toomuch\n- label: Había demasiadas cosas\n- reassure: Una calle llena agota a cualquiera, persona o perro.\n- cause: La calle tenía más estímulos de los que podíais atender.\n- c1: Elige una hora más tranquila.\n- c2: Atiende solo lo rápido; ignora lo demás.\n- easier: Un paseo de 5 minutos por una calle media.\n- alt: Una calle de ciudad a una hora tranquila\n- caption: Una hora tranquila\n\n### nothing\n- label: No respondió a ninguna\n- reassure: Si no responde, está demasiado excitado para escuchar. No es desobediencia.\n- cause: Su excitación superó el punto en que puede atenderte.\n- c1: Aumenta la distancia antes de pedirle nada.\n- c2: Deja que olfatee para bajar la excitación.\n- easier: Una señal respondida en una calle tranquila.\n- alt: Un perro olfatea lejos del movimiento de la calle\n- caption: Bajar la excitación\n\n## general\n- reassure: Elegir la señal es lo último que se aprende. Vas por buen camino.\n- cause: Lo habitual es pedir demasiado en el primer intento.\n- c1: Practica cada señal por separado otro día.\n- c2: Repasa la lección de elegir la señal.\n- easier: Usar una señal en el momento justo, 1 vez.\n- alt: Práctica de una sola señal en la acera\n- caption: Una señal cada vez\n\n"
      },
      "files": []
    },
    "mission-destroy": {
      "config": {
        "id": "mission-destroy",
        "technique": "destroy",
        "reps": 3,
        "place": "home",
        "trains": [
          {
            "kind": "node",
            "id": "destroy"
          }
        ],
        "problems": [
          {
            "id": "ignores",
            "label": "ignores",
            "practise": {
              "kind": "node",
              "id": "destroy"
            }
          },
          {
            "id": "again",
            "label": "again",
            "practise": {
              "kind": "node",
              "id": "destroy"
            }
          },
          {
            "id": "alone",
            "label": "alone",
            "practise": {
              "kind": "node",
              "id": "destroy"
            }
          }
        ]
      },
      "text": {
        "es": "# Masticables a mano\n\n## target\nDurante tres días, deja fuera de su alcance lo que {name} suele morder, reparte dos masticables por la casa y cámbiale por uno cada vez que lo veas morder algo prohibido.\n\n## success\nNo hay destrozos nuevos y {name} elige sus masticables.\n\n## problems\n### ignores\n- label: No quiere el masticable\n- reassure: A muchos perros no les gusta el primer masticable que probamos.\n- cause: Seguramente no le interesa ese juguete, o hay algo más tentador a su alcance.\n- c1: Prueba otro material o rellena uno con comida; el que sabe a algo llama más la atención.\n- c2: Guarda lo que le gusta destrozar para que el masticable sea lo único a su alcance.\n- easier: Ofrecerle un masticable relleno una vez al día.\n- alt: Un juguete relleno de comida en el suelo y el perro lo mordisquea\n- caption: Un masticable con sabor\n\n### again\n- label: Ha destrozado algo igualmente\n- reassure: Un destrozo no borra los días buenos. A todos se nos cuela algo.\n- cause: Lo más probable es que algo se quedara a su alcance o que se aburriera.\n- c1: Haz una ronda a su altura y guarda lo que veas; no lo riñas después, no sirve.\n- c2: Añade un paseo con olfateo antes de dejarlo solo.\n- easier: Un día entero sin objetos a su alcance.\n- alt: La persona revisa el salón agachada a la altura del perro\n- caption: Revisar a su altura\n\n### alone\n- label: Solo lo hace cuando está solo\n- reassure: Que ocurra solo cuando no estás es una pista importante, no un fracaso.\n- cause: Puede ser aburrimiento, o nervios por quedarse solo; si además ladra o aúlla, puede ser ansiedad por separación.\n- c1: Deja a su alcance un masticable relleno antes de salir y que gaste energía con un paseo.\n- c2: Si ladra, aúlla o se angustia cuando te vas, consulta con un profesional del comportamiento.\n- easier: Dejarle un masticable relleno al salir, una vez.\n- alt: El perro tumbado con un juguete relleno junto a la puerta\n- caption: Cansado y entretenido\n\n## general\n- reassure: Cambiar la casa cuesta. Cada objeto que guardas ya es un destrozo menos.\n- cause: Lo habitual es querer revisarlo todo en un solo día.\n- c1: Empieza por una habitación y por lo que más muerde.\n- c2: Repasa la lección «Destroza cosas».\n- easier: Guardar lo que más muerde en una sola habitación.\n- alt: Una habitación ordenada con un masticable en el suelo\n- caption: Empezar por una habitación\n\n"
      },
      "files": []
    },
    "mission-dog-as-dog": {
      "config": {
        "id": "mission-dog-as-dog",
        "technique": "dog-as-dog",
        "reps": 1,
        "place": "home",
        "trains": [
          {
            "kind": "node",
            "id": "dog-as-dog"
          }
        ],
        "problems": [
          {
            "id": "cries",
            "label": "cries",
            "practise": {
              "kind": "node",
              "id": "dog-as-dog"
            }
          },
          {
            "id": "family",
            "label": "family",
            "practise": {
              "kind": "node",
              "id": "dog-as-dog"
            }
          },
          {
            "id": "bed",
            "label": "bed",
            "practise": {
              "kind": "node",
              "id": "dog-as-dog"
            }
          }
        ]
      },
      "text": {
        "es": "# Un día como perro\n\n## target\nPasa un día entero sin cogerlo en brazos, sin subirlo a tu cama y sin besos en la cara. Salúdalo solo cuando esté en calma.\n\n## success\nAl final del día te pide menos brazos y descansa en su propia cama.\n\n## problems\n### cries\n- label: Llora para que lo coja\n- reassure: Es muy normal: si siempre lo has cogido al llorar, llorar le ha funcionado.\n- cause: Probablemente ha aprendido que llorar trae brazos, y ahora lo prueba con más fuerza.\n- c1: No lo cojas mientras llora. Espera sin mirarle, aunque tarde: si cedes ahora, aprende a llorar más.\n- c2: Cuando se calle y apoye las cuatro patas, agáchate y acaríciale el pecho despacio, a su altura.\n- easier: Que se calle y apoye las cuatro patas antes de acariciarlo, 3 veces.\n- alt: Una persona agachada acaricia el pecho del perro, que está con las cuatro patas en el suelo\n- caption: Cariño a su altura, en el suelo\n\n### family\n- label: En casa no todos lo cumplen\n- reassure: Pasa en muchas casas: cada persona trata al perro a su manera.\n- cause: Seguramente alguien de casa lo sigue cogiendo o subiendo a la cama, y tu perro no entiende la diferencia.\n- c1: Habla con tu familia y elegid juntos tres normas sencillas: en el suelo, en su cama y sin besos en la cara.\n- c2: Explícales por qué: no es quererlo menos, es tratarlo como a un perro.\n- easier: Que toda la familia cumpla una sola norma, no subirlo a la cama, durante un día.\n- alt: Una familia sentada a la mesa y el perro tumbado en su cama\n- caption: Las mismas normas para todos\n\n### bed\n- label: Llora de noche fuera de mi cama\n- reassure: Las primeras noches fuera de tu cama cuestan. Es normal que proteste.\n- cause: Está acostumbrado a dormir contigo y su cama todavía no es un sitio bueno para él.\n- c1: Pon su cama en un rincón tranquilo, con una prenda tuya que huela a ti.\n- c2: Si llora, no vayas a cogerlo. Espera a que se calme; si quieres comprobar que está bien, entra en silencio y sal.\n- easier: Que duerma la siesta en su cama, con tu prenda, 2 veces.\n- alt: El perro duerme en su cama junto a una prenda de ropa\n- caption: Su cama, con tu olor\n\n## general\n- reassure: Cambiar costumbres de años lleva tiempo. Un día difícil no pasa nada.\n- cause: Lo más habitual es intentarlo todo a la vez: brazos, cama y besos el mismo día.\n- c1: Empieza por una sola norma y añade otra cuando la primera salga sola.\n- c2: Repasa la lección «Un perro, no un peluche».\n- easier: Medio día sin cogerlo en brazos.\n- alt: El perro descansa en su cama mientras la persona lee\n- caption: Una norma cada vez\n\n"
      },
      "files": []
    },
    "mission-doorbell": {
      "config": {
        "id": "mission-doorbell",
        "technique": "doorbell",
        "reps": 3,
        "trains": [
          {
            "kind": "node",
            "id": "doorbell-mat"
          }
        ],
        "problems": [
          {
            "id": "barks",
            "label": "barks",
            "practise": {
              "kind": "node",
              "id": "doorbell-mat"
            }
          },
          {
            "id": "door",
            "label": "door",
            "practise": {
              "kind": "node",
              "id": "doorbell-mat"
            }
          },
          {
            "id": "mat",
            "label": "mat",
            "practise": {
              "kind": "node",
              "id": "doorbell-mat"
            }
          }
        ]
      },
      "text": {
        "es": "# El simulacro del timbre\n\n## target\nPide a alguien que llame al timbre y premia a tu perro cuando se calme en su alfombra.\n\n## success\nVa a su alfombra o se calma en ella en menos de un minuto.\n\n## problems\n### barks\n- label: Ladra sin parar\n- reassure: Ladrar al timbre es de lo más común. Lleva años aprendiéndolo.\n- cause: El timbre real es demasiado fuerte para empezar: su excitación sube antes de que pueda escucharte.\n- c1: Usa un timbre grabado en el móvil, muy bajo, y súbelo poco a poco.\n- c2: Premia el primer silencio, aunque dure un segundo.\n- easier: Que se calle en la alfombra con el timbre grabado a volumen bajo, 3 veces.\n- alt: Un móvil reproduce un timbre bajo junto a un perro tranquilo\n- caption: Empezar con un timbre bajo\n\n### door\n- label: No se separa de la puerta\n- reassure: Quedarse en la puerta es lógico para él: ahí es donde pasa lo interesante.\n- cause: La alfombra puede estar demasiado cerca de la puerta o demasiado lejos para que la recuerde.\n- c1: Pon la alfombra a unos pasos de la puerta, donde pueda ver pero no tocar.\n- c2: Practica ir a la alfombra sin timbre, con premios, varias veces al día.\n- easier: Que vaya a la alfombra cuando lo pides, sin timbre, 3 veces.\n- alt: Una alfombra colocada a unos pasos de la puerta de casa\n- caption: La alfombra a unos pasos\n\n### mat\n- label: No quiere ir a la alfombra\n- reassure: La alfombra aún no significa nada para él. Eso se construye.\n- cause: Probablemente nunca ha ganado nada por estar en ella.\n- c1: Deja premios sobre la alfombra cuando no mire, para que la descubra como un buen sitio.\n- c2: Marca cada vez que pise la alfombra por sí mismo.\n- easier: Que pise la alfombra por sí mismo, 3 veces.\n- alt: Un perro descubre un premio sobre su alfombra\n- caption: La alfombra, un buen sitio\n\n## general\n- reassure: Las visitas emocionan mucho. Un intento difícil no borra lo aprendido.\n- cause: Lo habitual es pedir demasiado de golpe.\n- c1: Practica sin visita real, solo con el sonido.\n- c2: Acorta las sesiones a dos o tres repeticiones.\n- easier: Que se calme en la alfombra con un golpe suave en la puerta, 2 veces.\n- alt: Una sesión corta de práctica con el timbre\n- caption: Sesiones cortas\n\n"
      },
      "files": []
    },
    "mission-eat-objects": {
      "config": {
        "id": "mission-eat-objects",
        "technique": "eat-objects",
        "reps": 3,
        "place": "home",
        "sharedNote": "lesson.note.vet",
        "trains": [
          {
            "kind": "node",
            "id": "eat-objects"
          }
        ],
        "problems": [
          {
            "id": "swallowed",
            "label": "swallowed",
            "practise": {
              "kind": "node",
              "id": "eat-objects"
            }
          },
          {
            "id": "runs",
            "label": "runs",
            "practise": {
              "kind": "node",
              "id": "eat-objects"
            }
          },
          {
            "id": "again",
            "label": "again",
            "practise": {
              "kind": "node",
              "id": "eat-objects"
            }
          }
        ]
      },
      "text": {
        "es": "# Un cambio mejor\n\n## target\nDurante tres días, guarda lo que {name} suele coger y, si coge algo, no lo persigas: cámbiale el objeto por una golosina mejor.\n\n## success\nSuelta el objeto a cambio de la golosina sin salir corriendo.\n\n## problems\n### swallowed\n- label: Se ha tragado algo\n- reassure: Pasa, incluso a quien vigila mucho. Ahora lo importante es actuar.\n- cause: Lo que se traga no siempre sale solo, y no se puede saber desde fuera si es grave.\n- c1: Llama a tu veterinario y cuéntale qué y cuándo se lo ha tragado, sin esperar a ver qué pasa.\n- c2: Si {name} se ha tragado algo que no es comida, vomita, no quiere comer, le duele la tripa o come cosas raras una y otra vez, llama ya a tu veterinario. No esperes a ver si lo suelta ni intentes hacerlo vomitar en casa.\n- easier: Guardar hoy todo lo que pueda tragar y volver al entrenamiento cuando el veterinario lo diga.\n- alt: La persona llama por teléfono junto al perro\n- caption: Llamar al veterinario\n\n### runs\n- label: Sale corriendo con ello\n- reassure: Es normal: para {name}, salir corriendo con algo es un juego.\n- cause: Seguramente cuando lo coge, alguien corre detrás, y así el juego se refuerza.\n- c1: No lo persigas: siéntate, enséñale una golosina rica y espera a que se acerque.\n- c2: Si {name} se ha tragado algo que no es comida, vomita, no quiere comer, le duele la tripa o come cosas raras una y otra vez, llama ya a tu veterinario. No esperes a ver si lo suelta ni intentes hacerlo vomitar en casa.\n- easier: Practicar el cambio con un juguete que no le importe mucho, 2 veces.\n- alt: La persona sentada en el suelo con una golosina mientras el perro se acerca\n- caption: No perseguir\n\n### again\n- label: Lo vuelve a coger siempre\n- reassure: Es difícil resistirse a lo que está a su alcance; el truco es que no lo esté.\n- cause: Probablemente siga habiendo objetos a su alcance o aún no ha aprendido el cambio.\n- c1: Haz una ronda a su altura y guarda lo que veas; repite el cambio a diario con juguetes.\n- c2: Si {name} se ha tragado algo que no es comida, vomita, no quiere comer, le duele la tripa o come cosas raras una y otra vez, llama ya a tu veterinario. No esperes a ver si lo suelta ni intentes hacerlo vomitar en casa.\n- easier: Guardar solo lo que más coge durante un día.\n- alt: La persona guarda objetos pequeños en una caja alta\n- caption: Fuera de su alcance\n\n## general\n- reassure: Entrenar y vigilar a la vez cansa. Cada objeto guardado es un riesgo menos.\n- cause: Lo más habitual es querer entrenar sin haber guardado antes lo que suele coger.\n- c1: Guarda primero y entrena después: la prevención es lo más seguro.\n- c2: Si {name} se ha tragado algo que no es comida, vomita, no quiere comer, le duele la tripa o come cosas raras una y otra vez, llama ya a tu veterinario. No esperes a ver si lo suelta ni intentes hacerlo vomitar en casa.\n- easier: Guardar cinco cosas que suele coger.\n- alt: Un salón ordenado con una caja alta con objetos pequeños\n- caption: Primero guardar\n\n"
      },
      "files": []
    },
    "mission-harness": {
      "config": {
        "id": "mission-harness",
        "technique": "harness",
        "reps": 3,
        "trains": [
          {
            "kind": "node",
            "id": "harness-ritual"
          }
        ],
        "problems": [
          {
            "id": "excited",
            "label": "excited",
            "practise": {
              "kind": "node",
              "id": "harness-ritual"
            }
          },
          {
            "id": "runs",
            "label": "runs",
            "practise": {
              "kind": "node",
              "id": "harness-ritual"
            }
          },
          {
            "id": "bites",
            "label": "bites",
            "practise": {
              "kind": "node",
              "id": "harness-ritual"
            }
          }
        ]
      },
      "text": {
        "es": "# El arnés en casa\n\n## target\nPon el arnés a tu perro solo cuando esté quieto, sin sujetarlo.\n\n## success\nSe queda quieto o sentado mientras le pasas el arnés por la cabeza.\n\n## problems\n### excited\n- label: Se excita al ver el arnés\n- reassure: Es muy normal: el arnés anuncia el paseo y eso emociona a cualquier perro.\n- cause: Probablemente el arnés aparece y el paseo empieza enseguida, así que verlo ya es una fiesta.\n- c1: Saca el arnés varias veces al día sin salir. Déjalo a la vista y guárdalo cuando se calme.\n- c2: Acerca el arnés solo un poco. Si salta, aléjalo y espera sin hablar.\n- easier: Que se quede quieto mientras sostienes el arnés a un metro, 3 veces.\n- alt: Una persona sostiene el arnés lejos mientras el perro se calma\n- caption: Alejar el arnés hasta que haya calma\n\n### runs\n- label: Se va corriendo\n- reassure: Le pasa a muchos perros, sobre todo si el arnés les aprieta o les asustó alguna vez.\n- cause: Puede que asocie el arnés con algo incómodo o que lo persigas para ponérselo.\n- c1: No lo persigas. Siéntate en el suelo con el arnés y premia cuando se acerque.\n- c2: Revisa el ajuste: deben caber dos dedos entre el arnés y el cuerpo.\n- easier: Que se acerque al arnés por sí mismo y lo huela, 3 veces.\n- alt: Una persona sentada en el suelo con el arnés y un premio en la mano\n- caption: Dejar que se acerque solo\n\n### bites\n- label: Muerde el arnés\n- reassure: Morder el arnés es una forma de jugar o de gastar nervios. Tiene arreglo.\n- cause: Seguramente está muy excitado y el arnés se mueve como un juguete.\n- c1: Mueve el arnés despacio. Si lo muerde, quédate quieto y espera a que lo suelte.\n- c2: Ofrécele un premio en la otra mano mientras pasas el arnés.\n- easier: Pasar el arnés por la cabeza mientras lame un premio, 2 veces.\n- alt: El perro lame un premio mientras la persona le pasa el arnés\n- caption: Un premio para la boca\n\n## general\n- reassure: Un primer intento difícil es parte del aprendizaje. No pasa nada.\n- cause: Lo más habitual es ir demasiado rápido: tu perro aún no sabe lo que le pides.\n- c1: Divide el ejercicio en pasos más pequeños y premia cada uno.\n- c2: Practica cuando esté cansado, no justo antes del paseo.\n- easier: Que se quede quieto con el arnés a la vista, 3 veces.\n- alt: Una persona practica con el arnés en un momento tranquilo\n- caption: Pasos pequeños\n\n"
      },
      "files": []
    },
    "mission-home-rest": {
      "config": {
        "id": "mission-home-rest",
        "technique": "home-rest",
        "reps": 3,
        "place": "home",
        "trains": [
          {
            "kind": "node",
            "id": "home-rest"
          }
        ],
        "problems": [
          {
            "id": "insists",
            "label": "insists",
            "practise": {
              "kind": "node",
              "id": "home-rest"
            }
          },
          {
            "id": "barks",
            "label": "barks",
            "practise": {
              "kind": "node",
              "id": "home-rest"
            }
          },
          {
            "id": "comesback",
            "label": "comesback",
            "practise": {
              "kind": "node",
              "id": "home-rest"
            }
          }
        ]
      },
      "text": {
        "es": "# La casa tranquila\n\n## target\nCuando te pida atención dentro de casa, apártalo con calma: camina hacia su espacio sin mirarle, hablarle ni tocarlo. El juego, fuera.\n\n## success\nSe aparta y se va a descansar a su cama por su cuenta.\n\n## problems\n### insists\n- label: Insiste y no se va\n- reassure: Es normal: si antes pedir funcionaba, al principio insistirá más. Es buena señal, está notando el cambio.\n- cause: Seguramente todavía le respondes algo: una mirada, una palabra o una caricia al final.\n- c1: Sigue sin mirarle y camina con calma hacia su espacio hasta que se aparte del todo.\n- c2: No cedas al final: si respondes después de diez intentos, aprende a intentarlo once.\n- easier: Que se aparte un par de pasos cuando caminas hacia su espacio, 3 veces.\n- alt: La persona camina con calma hacia el perro, con los brazos bajados, y el perro se aparta\n- caption: Ocupar su espacio, sin tocarlo\n\n### barks\n- label: Me ladra para pedir\n- reassure: Ladrar para pedir es muy común cuando lo de antes deja de funcionar.\n- cause: Probablemente alguna vez el ladrido le consiguió atención, y ahora lo prueba.\n- c1: No respondas al ladrido, ni para pedirle que se calle: espera sin mirarle a que pare.\n- c2: Cuando lleve unos segundos en silencio, y solo entonces, márcalo con un «bien» suave.\n- easier: Que deje de ladrar sin que le respondas, 2 veces.\n- alt: El perro, en silencio, mira a la persona, que espera de espaldas\n- caption: Lo que funciona es el silencio\n\n### comesback\n- label: Se va, pero vuelve enseguida\n- reassure: Volver enseguida es normal al principio: está comprobando si la norma va en serio.\n- cause: Seguramente todavía tiene energía sin gastar o no sabe qué hacer en casa.\n- c1: Dale un paseo largo con olfateo y un rato de juego fuera antes de pedirle calma en casa.\n- c2: Cuando se tumbe en su cama, déjale allí algo para masticar.\n- easier: Que se quede en su cama dos minutos después de apartarlo, 2 veces.\n- alt: El perro, tumbado en su cama, mordisquea un juguete de masticar\n- caption: Algo que hacer en su cama\n\n## general\n- reassure: Un día con mucha petición no es un fracaso. Cada vez que no respondes, cuenta.\n- cause: Lo más habitual es responder sin darse cuenta: mirarle o hablarle de pasada.\n- c1: Durante un día, fíjate solo en no mirarle cuando pide.\n- c2: Repasa la lección «En casa se descansa».\n- easier: Apartarlo con calma una vez al día.\n- alt: La persona lee en el sofá mientras el perro descansa\n- caption: No mirar cuando pide\n\n"
      },
      "files": []
    },
    "mission-leave-it": {
      "config": {
        "id": "mission-leave-it",
        "technique": "leave-it",
        "reps": 3,
        "trains": [
          {
            "kind": "node",
            "id": "leave-it-intro"
          }
        ],
        "problems": [
          {
            "id": "grabs",
            "label": "grabs",
            "practise": {
              "kind": "node",
              "id": "leave-it-intro"
            }
          },
          {
            "id": "ignores",
            "label": "ignores",
            "practise": {
              "kind": "node",
              "id": "leave-it-intro"
            }
          },
          {
            "id": "repeat",
            "label": "repeat",
            "practise": {
              "kind": "node",
              "id": "leave-it-intro"
            }
          }
        ]
      },
      "text": {
        "es": "# Déjalo en la acera\n\n## target\nCuando veas comida o basura en el suelo, di Déjalo una vez y premia cuando te mire.\n\n## success\nPasa junto a la comida sin cogerla.\n\n## problems\n### grabs\n- label: Lo coge antes de que diga nada\n- reassure: Los perros son rapidísimos con la comida. Es pura naturaleza.\n- cause: Viste la comida tarde.\n- c1: Mira el suelo unos metros por delante.\n- c2: Acorta la correa al pasar por zonas con comida.\n- easier: Ver la comida antes que tu perro y decir Déjalo, 2 veces.\n- alt: Una persona mira el suelo por delante del perro\n- caption: Mirar por delante\n\n### ignores\n- label: No me hace caso\n- reassure: Que no responda en la calle es normal: allí todo es más difícil.\n- cause: La señal aún no es lo bastante fuerte fuera de casa.\n- c1: Vuelve a practicar en casa con algo poco apetecible.\n- c2: Usa un premio mejor que lo del suelo.\n- easier: Déjalo en casa con una golosina en el suelo, 3 veces.\n- alt: Práctica de Déjalo en casa con una golosina en el suelo\n- caption: Volver a casa\n\n### repeat\n- label: Tuve que repetirlo muchas veces\n- reassure: Repetir es un reflejo. Lo importante es que lo has intentado.\n- cause: Al repetir, la señal pierde valor.\n- c1: Dilo una sola vez y espera.\n- c2: Si no responde, aléjate de la comida sin hablar.\n- easier: Decir Déjalo una sola vez y alejarte, 2 veces.\n- alt: Una persona se aleja de la comida con el perro sin hablar\n- caption: Una sola vez\n\n## general\n- reassure: La comida del suelo es de lo más difícil. Vas bien.\n- cause: Lo habitual es practicarlo primero en la calle.\n- c1: Haz sesiones cortas en casa.\n- c2: Sube la dificultad poco a poco.\n- easier: Déjalo en casa con un juguete en el suelo, 2 veces.\n- alt: Una sesión corta de Déjalo en el salón\n- caption: Sesiones cortas\n\n"
      },
      "files": []
    },
    "mission-park-jogger": {
      "config": {
        "id": "mission-park-jogger",
        "technique": "long-leash",
        "reps": 2,
        "trains": [
          {
            "kind": "node",
            "id": "park-jogger"
          }
        ],
        "problems": [
          {
            "id": "chases",
            "label": "chases",
            "practise": {
              "kind": "node",
              "id": "park-jogger"
            }
          },
          {
            "id": "tangle",
            "label": "tangle",
            "practise": {
              "kind": "lesson",
              "id": "howto-long-leash"
            }
          },
          {
            "id": "surprise",
            "label": "surprise",
            "practise": {
              "kind": "node",
              "id": "park-jogger"
            }
          }
        ]
      },
      "text": {
        "es": "# Corredores en el parque\n\n## target\nCon la correa larga, recoge correa y párate cuando pase un corredor.\n\n## success\nEl corredor pasa y tu perro no llega al final de la correa.\n\n## problems\n### chases\n- label: Sale detrás del corredor\n- reassure: Perseguir lo que corre es instinto puro. Tiene arreglo.\n- cause: Tenía demasiada correa cuando pasó el corredor.\n- c1: Recoge correa en cuanto veas al corredor a lo lejos.\n- c2: Premia cuando mire al corredor y vuelva a mirarte.\n- easier: Recoger correa al ver un corredor lejano, 2 veces.\n- alt: Una persona recoge la correa larga al ver un corredor\n- caption: Recoger a tiempo\n\n### tangle\n- label: Me lío con la correa\n- reassure: La correa larga se lía a todo el mundo al principio.\n- cause: Recoger 3 metros de correa requiere práctica.\n- c1: Sujeta la correa en lazos sueltos, nunca enrollada.\n- c2: Practica recoger y soltar en casa, sin perro.\n- easier: Recoger y soltar la correa larga en un parque vacío, 3 veces.\n- alt: Una mano sujeta la correa larga en lazos sueltos\n- caption: Lazos sueltos\n\n### surprise\n- label: Apareció de golpe\n- reassure: Los corredores no avisan. Hiciste bien en intentarlo.\n- cause: Estabas en una zona con poca visibilidad.\n- c1: Pasea por zonas abiertas, lejos de los caminos de correr.\n- c2: Si te sorprende, para y deja la correa floja.\n- easier: Ver pasar un corredor desde una zona abierta, 1 vez.\n- alt: Una zona abierta del parque lejos del camino de correr\n- caption: Zonas abiertas\n\n## general\n- reassure: El parque es el sitio más emocionante. Cualquier avance cuenta.\n- cause: Lo habitual es ir a una hora con muchos corredores.\n- c1: Elige una hora con menos gente.\n- c2: Repasa la lección de la correa larga.\n- easier: Diez minutos con la correa larga sin corredores.\n- alt: Un parque casi vacío por la mañana\n- caption: Menos gente\n\n"
      },
      "files": []
    },
    "mission-park-mix": {
      "config": {
        "id": "mission-park-mix",
        "technique": "park-mix",
        "reps": 1,
        "trains": [
          {
            "kind": "node",
            "id": "park-mix"
          }
        ],
        "problems": [
          {
            "id": "overwhelmed",
            "label": "overwhelmed",
            "practise": {
              "kind": "node",
              "id": "park-mix"
            }
          },
          {
            "id": "food",
            "label": "food",
            "practise": {
              "kind": "node",
              "id": "park-mix"
            }
          },
          {
            "id": "me",
            "label": "me",
            "practise": {
              "kind": "node",
              "id": "park-mix"
            }
          }
        ]
      },
      "text": {
        "es": "# El parque lleno\n\n## target\nPasea 10 minutos por un parque con movimiento: primero lo rápido, luego la comida, y olfato entre medias.\n\n## success\nTerminas el paseo sin ningún tirón largo.\n\n## problems\n### overwhelmed\n- label: Se desbordó\n- reassure: Un parque lleno es mucho. Que se desborde no es un fracaso.\n- cause: Se acumularon estímulos sin pausas entre ellos.\n- c1: Haz una pausa de olfato cada pocos minutos.\n- c2: Sal del parque un momento si sube mucho.\n- easier: Cinco minutos en el borde del parque.\n- alt: Un perro olfatea tranquilo en un rincón del parque\n- caption: Pausas de olfato\n\n### food\n- label: Encontró comida\n- reassure: Los parques están llenos de restos. Le pasa a todo el mundo.\n- cause: Te centraste en lo rápido y no viste el suelo.\n- c1: Revisa la zona antes de soltar correa.\n- c2: Usa Déjalo antes de que llegue.\n- easier: Pasar junto a comida con Déjalo en el parque, 1 vez.\n- alt: Una persona revisa el suelo del parque antes de soltar correa\n- caption: Revisar el suelo\n\n### me\n- label: Me agobié yo\n- reassure: Agobiarse es humano. Tu calma también se entrena.\n- cause: Intentaste atender todo a la vez.\n- c1: Respira y para: el poste también es para ti.\n- c2: Atiende una cosa cada vez.\n- easier: Un paseo corto por el parque a una hora tranquila.\n- alt: Una persona respira parada con su perro tranquilo al lado\n- caption: Respirar y parar\n\n## general\n- reassure: Has llegado lejos. El parque lleno es el reto final.\n- cause: Lo habitual es elegir el momento de más gente.\n- c1: Ve primero a horas tranquilas.\n- c2: Repasa la lección del parque lleno.\n- easier: Cinco minutos en un parque con poco movimiento.\n- alt: El parque a primera hora, casi vacío\n- caption: Horas tranquilas\n\n"
      },
      "files": []
    },
    "mission-poste": {
      "config": {
        "id": "mission-poste",
        "technique": "poste",
        "reps": 3,
        "trains": [
          {
            "kind": "node",
            "id": "poste-practice"
          }
        ],
        "problems": [
          {
            "id": "pulls",
            "label": "pulls",
            "practise": {
              "kind": "node",
              "id": "poste-practice"
            }
          },
          {
            "id": "pulled",
            "label": "pulled",
            "practise": {
              "kind": "lesson",
              "id": "theory-poste"
            }
          },
          {
            "id": "long",
            "label": "long",
            "practise": {
              "kind": "node",
              "id": "poste-practice"
            }
          }
        ]
      },
      "text": {
        "es": "# El poste en la escalera\n\n## target\nAl bajar la escalera o salir del portal, párate como un poste cada vez que la correa se tense.\n\n## success\nTu perro se gira hacia ti y la correa se afloja antes de seguir.\n\n## problems\n### pulls\n- label: Sigue tirando aunque me pare\n- reassure: Al principio muchos perros tiran más fuerte cuando paras. Es normal.\n- cause: Está probando si tirar más funciona, como funcionaba antes.\n- c1: Mantén el poste sin moverte ni un paso hasta que la correa se afloje.\n- c2: Marca el instante en que la correa se afloja, aunque sea un poco.\n- easier: Hacer poste en el pasillo de casa hasta que afloje, 3 veces.\n- alt: Una persona quieta mientras el perro deja de tirar\n- caption: Quieto hasta que afloja\n\n### pulled\n- label: Acabé tirando yo\n- reassure: Tirar de vuelta es un reflejo. A casi todo el mundo le pasa.\n- cause: Seguramente la correa estaba muy corta o ibas con prisa.\n- c1: Pega la mano de la correa a tu cadera: así no puedes tirar con el brazo.\n- c2: Sal con tiempo: el poste necesita paciencia.\n- easier: Hacer poste con la mano en la cadera en el portal, 2 veces.\n- alt: Una persona con la mano de la correa apoyada en la cadera\n- caption: La mano en la cadera\n\n### long\n- label: Tardó muchísimo\n- reassure: Que tarde mucho al principio es buena señal: está pensando.\n- cause: Aún no sabe qué hace que vuelvas a andar.\n- c1: Di su nombre suave una vez para ayudarle a girarse.\n- c2: Practica en un sitio aburrido, donde haya poco que mirar.\n- easier: Hacer poste en un sitio tranquilo hasta que se gire, 3 veces.\n- alt: El perro se gira hacia la persona en un pasillo tranquilo\n- caption: Un sitio aburrido\n\n## general\n- reassure: La escalera es un sitio difícil. Cualquier avance cuenta.\n- cause: Salir de casa es el momento de más excitación del paseo.\n- c1: Haz el ritual del arnés con calma antes de bajar.\n- c2: Para en cada rellano aunque no tire.\n- easier: Hacer poste solo en el último tramo de escalera, 2 veces.\n- alt: Una persona y su perro parados en un rellano\n- caption: Parar en cada rellano\n\n"
      },
      "files": []
    },
    "mission-shields": {
      "config": {
        "id": "mission-shields",
        "technique": "visual-shields",
        "reps": 2,
        "trains": [
          {
            "kind": "node",
            "id": "calm-zone-intro"
          },
          {
            "kind": "node",
            "id": "scooter-crossing"
          }
        ],
        "problems": [
          {
            "id": "late",
            "label": "late",
            "practise": {
              "kind": "node",
              "id": "scooter-crossing"
            }
          },
          {
            "id": "sees",
            "label": "sees",
            "practise": {
              "kind": "node",
              "id": "scooter-crossing"
            }
          },
          {
            "id": "nocar",
            "label": "nocar",
            "practise": {
              "kind": "lesson",
              "id": "theory-visual-shields"
            }
          }
        ]
      },
      "text": {
        "es": "# Escudos en tu calle\n\n## target\nCuando pase un patinete o una bici, pon un coche aparcado entre tu perro y la calle.\n\n## success\nPasa el vehículo sin que tu perro se lance.\n\n## problems\n### late\n- label: No me dio tiempo\n- reassure: Los patinetes son rápidos de verdad. A todo el mundo le pilla alguno.\n- cause: Buscaste el escudo cuando ya llegaba.\n- c1: Camina ya cerca de los coches en calles con patinetes.\n- c2: Escucha: muchos patinetes se oyen antes de verse.\n- easier: Caminar junto a los coches en una calle tranquila, 2 veces.\n- alt: Una persona camina pegada a los coches aparcados\n- caption: Caminar cerca del escudo\n\n### sees\n- label: Lo vio igualmente\n- reassure: Un escudo no lo tapa todo. Ya es mucho que lo intentes.\n- cause: El coche quedaba bajo o tu perro iba por fuera.\n- c1: Pon a tu perro en tu lado más cercano a los coches.\n- c2: Llámalo con Vamos antes de salir del escudo.\n- easier: Llamarle con Vamos tras un coche aparcado, 2 veces.\n- alt: El perro camina del lado de los coches aparcados\n- caption: El perro del lado del escudo\n\n### nocar\n- label: No había coches\n- reassure: No siempre hay escudos a mano. Hay otras formas.\n- cause: La calle elegida no tenía coches aparcados.\n- c1: Usa un portal, un árbol o tu propio cuerpo como escudo.\n- c2: Elige otra calle con aparcamiento.\n- easier: Ponerte entre tu perro y la calzada cuando pase algo, 2 veces.\n- alt: Una persona se pone entre su perro y la calle\n- caption: Tu cuerpo como escudo\n\n## general\n- reassure: Las calles con patinetes son de lo más exigente.\n- cause: Lo habitual es elegir una calle demasiado concurrida.\n- c1: Empieza por una calle con poco tráfico.\n- c2: Repasa la lección de los escudos visuales.\n- easier: Usar un escudo con una bici lenta, 1 vez.\n- alt: Una calle tranquila con coches aparcados\n- caption: Una calle tranquila\n\n"
      },
      "files": []
    },
    "mission-u-leash": {
      "config": {
        "id": "mission-u-leash",
        "technique": "slack-u",
        "reps": 1,
        "trains": [
          {
            "kind": "node",
            "id": "slack-u"
          }
        ],
        "problems": [
          {
            "id": "lost",
            "label": "lost",
            "practise": {
              "kind": "node",
              "id": "slack-u"
            }
          },
          {
            "id": "zigzag",
            "label": "zigzag",
            "practise": {
              "kind": "node",
              "id": "slack-u"
            }
          },
          {
            "id": "treats",
            "label": "treats",
            "practise": {
              "kind": "node",
              "id": "slack-u"
            }
          }
        ]
      },
      "text": {
        "es": "# Un paseo en U\n\n## target\nCamina una manzana entera con la correa en U y premia cuando vuelva a tu lado.\n\n## success\nLa correa cuelga en U la mayor parte de la manzana.\n\n## problems\n### lost\n- label: La U desaparece enseguida\n- reassure: Mantener la U cuesta. Un trozo de manzana ya es un avance.\n- cause: Probablemente caminas más rápido o más lento que él.\n- c1: Ajusta tu paso al suyo durante los primeros minutos.\n- c2: Frena en cuanto la U se estira, antes del tirón.\n- easier: Media manzana con la correa en U.\n- alt: Persona y perro caminando al mismo paso con la correa en U\n- caption: El mismo paso\n\n### zigzag\n- label: Va de un lado a otro\n- reassure: Ir de lado a lado es su forma de oler el mundo.\n- cause: Hay muchos olores y aún no sabe dónde quieres que vaya.\n- c1: Premia siempre del mismo lado.\n- c2: Dale ratos de olfato como recompensa.\n- easier: Que vuelva a tu lado 3 veces en una manzana.\n- alt: Un perro recibe el premio siempre del mismo lado\n- caption: Premiar del mismo lado\n\n### treats\n- label: Solo viene por el premio\n- reassure: Que venga por el premio es un buen comienzo.\n- cause: El premio se ve antes de que haga nada.\n- c1: Guarda el premio en el bolsillo y sácalo solo después de marcar.\n- c2: Alterna premios con ratos de olfato.\n- easier: Marcar 3 vueltas a tu lado con el premio guardado.\n- alt: Una persona saca el premio del bolsillo tras marcar\n- caption: Marcar y después premiar\n\n## general\n- reassure: La correa en U se construye paseo a paseo.\n- cause: Lo habitual es querer la U desde el primer paso.\n- c1: Cuenta las U, no los tirones.\n- c2: Termina el paseo tras un buen tramo.\n- easier: Un tramo corto de calle con la correa en U.\n- alt: Una correa en U durante un tramo corto\n- caption: Contar las U\n\n"
      },
      "files": []
    },
    "mission-walk": {
      "config": {
        "id": "mission-walk",
        "technique": "loose-leash",
        "reps": 1,
        "trains": [
          {
            "kind": "node",
            "id": "walk-distraction"
          }
        ],
        "problems": [
          {
            "id": "fixates",
            "label": "fixates",
            "practise": {
              "kind": "node",
              "id": "walk-distraction"
            }
          },
          {
            "id": "pulls",
            "label": "pulls",
            "practise": {
              "kind": "node",
              "id": "walk-distraction"
            }
          },
          {
            "id": "lunges",
            "label": "lunges",
            "practise": {
              "kind": "node",
              "id": "walk-distraction"
            }
          }
        ]
      },
      "text": {
        "es": "# Cinco minutos con una distracción\n\n## target\nPasea 5 minutos con la correa floja pasando cerca de una distracción.\n\n## success\nPasas junto a la distracción sin un tirón largo.\n\n## problems\n### fixates\n- label: Se fija y no me escucha\n- reassure: Fijarse en algo es lo más natural del mundo para un perro.\n- cause: Probablemente estabais demasiado cerca de la distracción.\n- c1: Aumenta la distancia hasta que pueda mirarte.\n- c2: Marca en cuanto aparte la mirada de la distracción.\n- easier: Ver la distracción de lejos y mirarte, 3 veces.\n- alt: Un perro mira a una bici lejana y luego a su persona\n- caption: Más distancia\n\n### pulls\n- label: Tira desde el principio\n- reassure: Tirar al salir es lo más habitual. Llega con muchas ganas.\n- cause: La excitación del principio del paseo aún está muy alta.\n- c1: Deja que olfatee un par de minutos antes de pedirle nada.\n- c2: Haz poste en cada tirón, sin excepciones.\n- easier: Dos minutos de correa floja en una calle tranquila.\n- alt: Un perro olfateando junto al portal antes del paseo\n- caption: Olfatear primero\n\n### lunges\n- label: Se lanza hacia la distracción\n- reassure: Lanzarse asusta, pero tiene arreglo con distancia y tiempo.\n- cause: La distracción llegó demasiado cerca o demasiado rápido.\n- c1: Cruza de acera o gira antes de que esté cerca.\n- c2: Si se lanza, haz poste y espera a que vuelva, sin regañar.\n- easier: Pasar a una acera de distancia de la distracción, 2 veces.\n- alt: Una persona cruza la acera para dejar espacio a una bici\n- caption: Dejar espacio\n\n## general\n- reassure: Los paseos de verdad tienen sorpresas. Un mal día no deshace nada.\n- cause: Lo habitual es elegir una calle con demasiado movimiento.\n- c1: Elige una hora y una calle más tranquilas.\n- c2: Acorta el paseo y termínalo bien.\n- easier: Tres minutos de correa floja sin distracciones.\n- alt: Una calle tranquila a primera hora\n- caption: Una calle tranquila\n\n"
      },
      "files": []
    }
  }
};
