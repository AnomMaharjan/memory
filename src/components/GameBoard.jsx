import React, { memo } from 'react';
import Card from './Card';
import { getGridCols } from '../utils/deck';

/**
 * Renders the NxN grid of cards.
 *
 * @param {Card[]}   deck     - Full deck array
 * @param {number[]} flipped  - Indices currently face-up
 * @param {Set|Array} matched  - Set/Array of matched pairIds
 * @param {Object}   matchedBy - Map of pairId to playerId who matched it
 * @param {function} onFlip   - Callback when a card is clicked
 * @param {string}   gridSize - 'small' (4x4) | 'large' (6x6)
 */
const GameBoard = memo(function GameBoard({ deck, flipped, matched, matchedBy = {}, onFlip, gridSize = 'small' }) {
  const cols = getGridCols(gridSize);
  const rows = Math.ceil(deck.length / cols);

  return (
    <div
      className="game-board"
      data-grid={gridSize}
      style={{ '--cols': cols, '--rows': rows }}
      aria-label="Memory game board"
    >
      {deck.map((card, idx) => (
        <Card
          key={card.id}
          card={card}
          isFlipped={flipped.includes(idx)}
          isMatched={matched instanceof Set ? matched.has(card.pairId) : matched.includes(card.pairId)}
          matchedBy={matchedBy[card.pairId]}
          onClick={onFlip}
          delay={idx * 40}
        />
      ))}
    </div>
  );
});

export default GameBoard;
