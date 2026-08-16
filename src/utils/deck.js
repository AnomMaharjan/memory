// Difficulty → grid size mapping
export const DIFFICULTY_CONFIG = {
  quick:  { cols: 4, pairs: 6,  label: 'Quick',  grid: '4×3', time: 45,  turnTime: 8  },
  easy:   { cols: 4, pairs: 8,  label: 'Easy',   grid: '4×4', time: 90,  turnTime: 10 },
  medium: { cols: 6, pairs: 18, label: 'Medium', grid: '6×6', time: 150, turnTime: 10 },
  hard:   { cols: 8, pairs: 32, label: 'Hard',   grid: '8×8', time: 240, turnTime: 10 },
  master: { cols: 10, pairs: 40, label: 'Master', grid: '10×8', time: 300, turnTime: 12 },
};

export const GAME_MODES = {
  classic: {
    key: 'classic',
    icon: '🎯',
    name: 'Classic',
    desc: 'Standard memory match rules',
  },
  blitz: {
    key: 'blitz',
    icon: '⚡',
    name: 'Speed Blitz',
    desc: '30s start (+4s per match, -2s miss penalty)',
  },
  combo: {
    key: 'combo',
    icon: '🔥',
    name: 'Combo Streak',
    desc: 'Consecutive matches earn 1x, 2x, 4x points',
  },
  flash: {
    key: 'flash',
    icon: '👁️',
    name: 'Flash Peek',
    desc: 'All cards revealed for 3s at start',
  },
};

// 6 pairs for Quick (4×3)
const SYMBOLS_QUICK = [
  { id: 'moon',      emoji: '🌙', label: 'Moon'      },
  { id: 'star',      emoji: '⭐', label: 'Star'      },
  { id: 'fire',      emoji: '🔥', label: 'Fire'      },
  { id: 'flower',    emoji: '🌸', label: 'Flower'    },
  { id: 'gem',       emoji: '💎', label: 'Gem'       },
  { id: 'thunder',   emoji: '⚡', label: 'Thunder'   },
];

// 8 pairs for Easy (4×4)
const SYMBOLS_EASY = [
  ...SYMBOLS_QUICK,
  { id: 'wave',      emoji: '🌊', label: 'Wave'      },
  { id: 'comet',     emoji: '☄️', label: 'Comet'     },
];

// 18 pairs for Medium (6×6)
const SYMBOLS_MEDIUM = [
  ...SYMBOLS_EASY,
  { id: 'planet',    emoji: '🪐', label: 'Planet'    },
  { id: 'rainbow',   emoji: '🌈', label: 'Rainbow'   },
  { id: 'leaf',      emoji: '🍃', label: 'Leaf'      },
  { id: 'snowflake', emoji: '❄️', label: 'Snow'      },
  { id: 'heart',     emoji: '💜', label: 'Heart'     },
  { id: 'eye',       emoji: '👁️', label: 'Eye'       },
  { id: 'mushroom',  emoji: '🍄', label: 'Mushroom'  },
  { id: 'ghost',     emoji: '👻', label: 'Ghost'     },
  { id: 'dragon',    emoji: '🐉', label: 'Dragon'    },
  { id: 'crystal',   emoji: '🔮', label: 'Crystal'   },
];

// 32 pairs for Hard (8×8)
const SYMBOLS_HARD = [
  ...SYMBOLS_MEDIUM,
  { id: 'fox',       emoji: '🦊', label: 'Fox'       },
  { id: 'owl',       emoji: '🦉', label: 'Owl'       },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly' },
  { id: 'penguin',   emoji: '🐧', label: 'Penguin'   },
  { id: 'volcano',   emoji: '🌋', label: 'Volcano'   },
  { id: 'tornado',   emoji: '🌪️', label: 'Tornado'   },
  { id: 'robot',     emoji: '🤖', label: 'Robot'     },
  { id: 'alien',     emoji: '👽', label: 'Alien'     },
  { id: 'ninja',     emoji: '🥷', label: 'Ninja'     },
  { id: 'crown',     emoji: '👑', label: 'Crown'     },
  { id: 'dice',      emoji: '🎲', label: 'Dice'      },
  { id: 'target',    emoji: '🎯', label: 'Target'    },
  { id: 'trophy',    emoji: '🏆', label: 'Trophy'    },
  { id: 'key',       emoji: '🗝️', label: 'Key'       },
];

// 40 pairs for Master (10×8) — Hard + 8 epic mythical symbols
const SYMBOLS_MASTER = [
  ...SYMBOLS_HARD,
  { id: 'wand',      emoji: '🪄', label: 'Magic Wand' },
  { id: 'unicorn',   emoji: '🦄', label: 'Unicorn'    },
  { id: 'swords',    emoji: '⚔️', label: 'Swords'     },
  { id: 'shield',    emoji: '🛡️', label: 'Shield'     },
  { id: 'ufo',       emoji: '🛸', label: 'UFO'        },
  { id: 'sun',       emoji: '☀️', label: 'Sun'        },
  { id: 'compass',   emoji: '🧭', label: 'Compass'    },
  { id: 'hourglass', emoji: '⏳', label: 'Hourglass'  },
];

const SYMBOL_MAP = {
  quick:  SYMBOLS_QUICK,
  easy:   SYMBOLS_EASY,
  medium: SYMBOLS_MEDIUM,
  hard:   SYMBOLS_HARD,
  master: SYMBOLS_MASTER,
};

/**
 * Fisher-Yates shuffle
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Create a shuffled deck of card objects.
 * Each symbol appears exactly twice.
 * @param {'quick'|'easy'|'medium'|'hard'|'master'} difficulty
 * @returns {Card[]}
 */
export function createDeck(difficulty = 'easy') {
  const symbols = SYMBOL_MAP[difficulty] ?? SYMBOL_MAP.easy;
  const pairs = symbols.flatMap((sym) => [
    { id: `${sym.id}-a`, pairId: sym.id, emoji: sym.emoji, label: sym.label, index: 0 },
    { id: `${sym.id}-b`, pairId: sym.id, emoji: sym.emoji, label: sym.label, index: 0 },
  ]);
  return shuffle(pairs).map((card, idx) => ({ ...card, index: idx }));
}

/**
 * Generate a 6-character alphanumeric room code.
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Get grid column count for a difficulty level.
 * @param {'quick'|'easy'|'medium'|'hard'|'master'} difficulty
 * @returns {number}
 */
export function getGridCols(difficulty = 'easy') {
  return DIFFICULTY_CONFIG[difficulty]?.cols ?? 4;
}
