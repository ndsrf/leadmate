import type { BarkdokuBoard, CellCoord } from './types';

/** Curated catalog of verified unique-solution Barkdoku boards across sizes 4x4 to 9x9. */
export const BARKDOKU_BOARDS: readonly BarkdokuBoard[] = [
  {
    "id": "barkdoku-4x4-1",
    "name": "Jardín Inicial",
    "size": 4,
    "difficulty": "tutorial",
    "regions": [
      [
        0,
        0,
        0,
        1
      ],
      [
        0,
        0,
        0,
        1
      ],
      [
        2,
        0,
        0,
        3
      ],
      [
        2,
        3,
        3,
        3
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 1
      },
      {
        "row": 1,
        "col": 3
      },
      {
        "row": 2,
        "col": 0
      },
      {
        "row": 3,
        "col": 2
      }
    ]
  },
  {
    "id": "barkdoku-4x4-2",
    "name": "Pradera Tranquila",
    "size": 4,
    "difficulty": "tutorial",
    "regions": [
      [
        1,
        1,
        0,
        0
      ],
      [
        1,
        1,
        2,
        2
      ],
      [
        1,
        1,
        2,
        2
      ],
      [
        3,
        3,
        3,
        2
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 2
      },
      {
        "row": 1,
        "col": 0
      },
      {
        "row": 2,
        "col": 3
      },
      {
        "row": 3,
        "col": 1
      }
    ]
  },
  {
    "id": "barkdoku-5x5-1",
    "name": "Terraza del Parque",
    "size": 5,
    "difficulty": "easy",
    "regions": [
      [
        0,
        0,
        0,
        0,
        1
      ],
      [
        0,
        0,
        1,
        1,
        1
      ],
      [
        0,
        3,
        1,
        4,
        2
      ],
      [
        3,
        3,
        3,
        4,
        2
      ],
      [
        3,
        3,
        3,
        4,
        4
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 2
      },
      {
        "row": 2,
        "col": 4
      },
      {
        "row": 3,
        "col": 1
      },
      {
        "row": 4,
        "col": 3
      }
    ]
  },
  {
    "id": "barkdoku-5x5-2",
    "name": "Paseo Fluvial",
    "size": 5,
    "difficulty": "easy",
    "regions": [
      [
        0,
        0,
        0,
        1,
        1
      ],
      [
        0,
        1,
        1,
        1,
        1
      ],
      [
        4,
        2,
        1,
        1,
        3
      ],
      [
        4,
        4,
        1,
        1,
        3
      ],
      [
        4,
        4,
        4,
        3,
        3
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 3
      },
      {
        "row": 2,
        "col": 1
      },
      {
        "row": 3,
        "col": 4
      },
      {
        "row": 4,
        "col": 2
      }
    ]
  },
  {
    "id": "barkdoku-6x6-1",
    "name": "Plaza de los Olivos",
    "size": 6,
    "difficulty": "medium",
    "regions": [
      [
        0,
        0,
        1,
        1,
        1,
        2
      ],
      [
        3,
        1,
        1,
        2,
        2,
        2
      ],
      [
        3,
        3,
        3,
        2,
        2,
        2
      ],
      [
        3,
        3,
        3,
        4,
        4,
        4
      ],
      [
        3,
        3,
        3,
        4,
        4,
        4
      ],
      [
        3,
        3,
        4,
        4,
        4,
        5
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 2
      },
      {
        "row": 2,
        "col": 4
      },
      {
        "row": 3,
        "col": 1
      },
      {
        "row": 4,
        "col": 3
      },
      {
        "row": 5,
        "col": 5
      }
    ]
  },
  {
    "id": "barkdoku-6x6-2",
    "name": "Bulevar Sombrío",
    "size": 6,
    "difficulty": "medium",
    "regions": [
      [
        0,
        1,
        1,
        1,
        2,
        2
      ],
      [
        3,
        3,
        1,
        1,
        2,
        2
      ],
      [
        3,
        3,
        3,
        2,
        2,
        2
      ],
      [
        3,
        3,
        3,
        2,
        4,
        4
      ],
      [
        3,
        3,
        5,
        5,
        5,
        4
      ],
      [
        3,
        3,
        5,
        5,
        5,
        5
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 2
      },
      {
        "row": 2,
        "col": 4
      },
      {
        "row": 3,
        "col": 1
      },
      {
        "row": 4,
        "col": 5
      },
      {
        "row": 5,
        "col": 3
      }
    ]
  },
  {
    "id": "barkdoku-7x7-1",
    "name": "Alameda de la Calma",
    "size": 7,
    "difficulty": "medium",
    "regions": [
      [
        0,
        0,
        1,
        1,
        1,
        1,
        2
      ],
      [
        3,
        1,
        1,
        1,
        1,
        1,
        2
      ],
      [
        3,
        3,
        3,
        3,
        2,
        2,
        2
      ],
      [
        3,
        3,
        3,
        3,
        2,
        2,
        2
      ],
      [
        3,
        3,
        5,
        3,
        2,
        4,
        2
      ],
      [
        3,
        3,
        5,
        5,
        5,
        4,
        4
      ],
      [
        3,
        5,
        5,
        5,
        5,
        5,
        6
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 2
      },
      {
        "row": 2,
        "col": 4
      },
      {
        "row": 3,
        "col": 1
      },
      {
        "row": 4,
        "col": 5
      },
      {
        "row": 5,
        "col": 3
      },
      {
        "row": 6,
        "col": 6
      }
    ]
  },
  {
    "id": "barkdoku-7x7-2",
    "name": "Parque del Lago",
    "size": 7,
    "difficulty": "medium",
    "regions": [
      [
        0,
        0,
        0,
        3,
        2,
        2,
        2
      ],
      [
        0,
        3,
        1,
        3,
        3,
        2,
        2
      ],
      [
        0,
        3,
        3,
        3,
        2,
        2,
        2
      ],
      [
        0,
        3,
        3,
        3,
        3,
        2,
        4
      ],
      [
        0,
        0,
        3,
        4,
        4,
        4,
        4
      ],
      [
        0,
        3,
        3,
        5,
        5,
        4,
        4
      ],
      [
        0,
        5,
        5,
        5,
        6,
        6,
        4
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 2
      },
      {
        "row": 2,
        "col": 4
      },
      {
        "row": 3,
        "col": 1
      },
      {
        "row": 4,
        "col": 6
      },
      {
        "row": 5,
        "col": 3
      },
      {
        "row": 6,
        "col": 5
      }
    ]
  },
  {
    "id": "barkdoku-8x8-1",
    "name": "Gran Dehesa Urbana",
    "size": 8,
    "difficulty": "hard",
    "regions": [
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        2
      ],
      [
        0,
        0,
        1,
        0,
        0,
        2,
        2,
        2
      ],
      [
        0,
        0,
        1,
        1,
        2,
        2,
        2,
        2
      ],
      [
        3,
        3,
        3,
        2,
        2,
        2,
        2,
        2
      ],
      [
        3,
        3,
        3,
        2,
        6,
        4,
        5,
        5
      ],
      [
        3,
        3,
        3,
        6,
        6,
        6,
        5,
        5
      ],
      [
        3,
        3,
        3,
        6,
        6,
        7,
        7,
        5
      ],
      [
        3,
        6,
        6,
        6,
        6,
        6,
        7,
        7
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 2
      },
      {
        "row": 2,
        "col": 4
      },
      {
        "row": 3,
        "col": 1
      },
      {
        "row": 4,
        "col": 5
      },
      {
        "row": 5,
        "col": 7
      },
      {
        "row": 6,
        "col": 3
      },
      {
        "row": 7,
        "col": 6
      }
    ]
  },
  {
    "id": "barkdoku-8x8-2",
    "name": "Mirador del Valle",
    "size": 8,
    "difficulty": "hard",
    "regions": [
      [
        0,
        1,
        1,
        2,
        2,
        2,
        2,
        2
      ],
      [
        1,
        1,
        1,
        2,
        2,
        2,
        4,
        2
      ],
      [
        3,
        3,
        2,
        2,
        2,
        2,
        4,
        4
      ],
      [
        3,
        3,
        2,
        2,
        2,
        4,
        4,
        4
      ],
      [
        5,
        5,
        5,
        5,
        5,
        6,
        4,
        4
      ],
      [
        5,
        5,
        5,
        5,
        6,
        6,
        6,
        4
      ],
      [
        5,
        5,
        5,
        5,
        6,
        6,
        6,
        6
      ],
      [
        5,
        5,
        6,
        6,
        6,
        6,
        6,
        7
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 2
      },
      {
        "row": 2,
        "col": 4
      },
      {
        "row": 3,
        "col": 1
      },
      {
        "row": 4,
        "col": 6
      },
      {
        "row": 5,
        "col": 3
      },
      {
        "row": 6,
        "col": 5
      },
      {
        "row": 7,
        "col": 7
      }
    ]
  },
  {
    "id": "barkdoku-9x9-1",
    "name": "Laberinto Botánico",
    "size": 9,
    "difficulty": "hard",
    "regions": [
      [
        0,
        1,
        1,
        1,
        1,
        2,
        2,
        2,
        2
      ],
      [
        1,
        1,
        1,
        1,
        1,
        2,
        2,
        2,
        2
      ],
      [
        1,
        3,
        3,
        2,
        2,
        2,
        2,
        2,
        2
      ],
      [
        3,
        3,
        3,
        2,
        2,
        2,
        2,
        5,
        5
      ],
      [
        3,
        3,
        3,
        4,
        5,
        5,
        5,
        5,
        6
      ],
      [
        3,
        3,
        3,
        5,
        5,
        5,
        5,
        6,
        6
      ],
      [
        3,
        3,
        3,
        5,
        5,
        6,
        6,
        6,
        6
      ],
      [
        3,
        3,
        3,
        3,
        5,
        7,
        8,
        8,
        6
      ],
      [
        3,
        3,
        3,
        3,
        3,
        3,
        8,
        8,
        8
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 2
      },
      {
        "row": 2,
        "col": 4
      },
      {
        "row": 3,
        "col": 1
      },
      {
        "row": 4,
        "col": 3
      },
      {
        "row": 5,
        "col": 6
      },
      {
        "row": 6,
        "col": 8
      },
      {
        "row": 7,
        "col": 5
      },
      {
        "row": 8,
        "col": 7
      }
    ]
  },
  {
    "id": "barkdoku-9x9-2",
    "name": "Santuario Canino",
    "size": 9,
    "difficulty": "hard",
    "regions": [
      [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1
      ],
      [
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1
      ],
      [
        0,
        1,
        1,
        1,
        2,
        2,
        4,
        1,
        1
      ],
      [
        3,
        3,
        1,
        4,
        4,
        4,
        4,
        4,
        1
      ],
      [
        3,
        3,
        1,
        4,
        4,
        4,
        4,
        4,
        5
      ],
      [
        3,
        3,
        3,
        4,
        4,
        4,
        4,
        5,
        5
      ],
      [
        3,
        3,
        4,
        4,
        4,
        6,
        6,
        5,
        5
      ],
      [
        3,
        3,
        4,
        4,
        4,
        8,
        8,
        7,
        7
      ],
      [
        3,
        3,
        3,
        4,
        8,
        8,
        8,
        7,
        7
      ]
    ],
    "solution": [
      {
        "row": 0,
        "col": 0
      },
      {
        "row": 1,
        "col": 2
      },
      {
        "row": 2,
        "col": 4
      },
      {
        "row": 3,
        "col": 1
      },
      {
        "row": 4,
        "col": 3
      },
      {
        "row": 5,
        "col": 7
      },
      {
        "row": 6,
        "col": 5
      },
      {
        "row": 7,
        "col": 8
      },
      {
        "row": 8,
        "col": 6
      }
    ]
  }
] as const;

/** Retrieve a board by unique identifier. */
export function getBoardById(id: string): BarkdokuBoard | undefined {
  return BARKDOKU_BOARDS.find((b) => b.id === id);
}

/** Retrieve all boards of a specific dimension. */
export function getBoardsBySize(size: number): BarkdokuBoard[] {
  return BARKDOKU_BOARDS.filter((b) => b.size === size);
}

/** Default introductory board for World 3 curriculum (size 4x4 or 5x5). */
export const INTRO_BARKDOKU_BOARD: BarkdokuBoard =
  getBoardById('barkdoku-4x4-1') ?? BARKDOKU_BOARDS[0];

/**
 * Deterministic backtracking solver to find all valid placements for a board.
 * Used for board verification and uniqueness validation.
 */
export function solveBoard(board: BarkdokuBoard, maxSolutions = 2): CellCoord[][] {
  const size = board.size;
  const solutions: CellCoord[][] = [];

  function canPlace(row: number, col: number, placedCols: number[]): boolean {
    for (let r = 0; r < row; r++) {
      const prevCol = placedCols[r];
      // Column conflict
      if (prevCol === col) return false;
      // 8-neighbor adjacency conflict
      if (Math.abs(r - row) <= 1 && Math.abs(prevCol - col) <= 1) return false;
      // Region conflict
      if (board.regions[r][prevCol] === board.regions[row][col]) return false;
    }
    return true;
  }

  function search(row: number, placedCols: number[]) {
    if (row === size) {
      solutions.push(placedCols.map((col, r) => ({ row: r, col })));
      return;
    }
    for (let col = 0; col < size; col++) {
      if (canPlace(row, col, placedCols)) {
        placedCols.push(col);
        search(row + 1, placedCols);
        placedCols.pop();
        if (solutions.length >= maxSolutions) return;
      }
    }
  }

  search(0, []);
  return solutions;
}

/**
 * Return a date-seeded daily Barkdoku board.
 * Picks between sizes 5x5 and 8x8 for varied daily mental exercises.
 */
export function getDailyBoard(dateString: string): BarkdokuBoard {
  // Simple deterministic integer hash of YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash << 5) - hash + dateString.charCodeAt(i);
    hash |= 0;
  }
  const eligible = BARKDOKU_BOARDS.filter((b) => b.size >= 5 && b.size <= 8);
  const index = Math.abs(hash) % eligible.length;
  return eligible[index];
}
