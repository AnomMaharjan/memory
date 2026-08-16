import React from 'react';
import Card from './Card';
import { getGridCols, THEMES } from '../utils/deck';

/**
 * Renders the NxN grid of cards.
 *
 * @param {Card[]}   deck      - Full deck array
 * @param {number[]} flipped   - Indices currently face-up
 * @param {Set|Array} matched  - Set/Array of matched pairIds
 * @param {Object}   matchedBy - Map of pairId to playerId who matched it
 * @param {function} onFlip    - Callback when a card is clicked
 * @param {string}   gridSize  - 'quick' | 'easy' | 'medium' | 'hard' | 'master'
 * @param {string}   theme     - Theme key ('classic' | 'animals' | 'snacks' | 'hearts' | 'space' | 'fantasy' | 'arcade')
 */
function GameBoard({ deck, flipped, matched, matchedBy = {}, onFlip, gridSize = 'easy', theme = 'classic' }) {
  const cols = getGridCols(gridSize);
  const rows = Math.ceil(deck.length / cols);
  const themeObj = THEMES[theme] || THEMES.classic;
  const cardBackIcon = themeObj.cardBack || '✨';

  return (
    <div
      className={`game-board theme-${theme}`}
      style={{
        '--cols': cols,
        '--rows': rows,
        '--theme-color': themeObj.color,
        '--theme-glow': themeObj.glow,
        '--theme-border': themeObj.border,
      }}
      aria-label="Memory game board"
    >
      {deck.map((card, idx) => (
        <Card
          key={card.id}
          card={card}
          isFlipped={flipped.includes(idx)}
          isMatched={matched instanceof Set ? matched.has(card.pairId) : matched.includes(card.pairId)}
          matchedBy={matchedBy[card.pairId]}
          cardBack={cardBackIcon}
          onClick={onFlip}
          delay={idx * 35}
        />
      ))}
    </div>
  );
}

export default GameBoard;
