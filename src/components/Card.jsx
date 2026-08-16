import React, { memo } from 'react';

/**
 * Individual memory card with 3D flip animation.
 *
 * @param {object}   card      - Card data object {id, pairId, emoji, label, index}
 * @param {boolean}  isFlipped - Whether card is face-up
 * @param {boolean}  isMatched - Whether card pair has been matched
 * @param {function} onClick   - Click handler
 * @param {number}   delay     - CSS animation delay for stagger effect (ms)
 */
const Card = memo(function Card({ card, isFlipped, isMatched, matchedBy, onClick, delay = 0 }) {
  const handleClick = () => {
    if (!isFlipped && !isMatched) onClick(card.index);
  };

  return (
    <div
      className={`card-wrapper${isFlipped || isMatched ? ' is-flipped' : ''}${isMatched ? ' is-matched' : ''}${matchedBy ? ` is-matched-${matchedBy}` : ''}`}
      style={{ '--delay': `${delay}ms` }}
      onClick={handleClick}
      role="button"
      aria-label={isFlipped || isMatched ? card.label : 'Hidden card'}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="card-inner">
        {/* Card Back */}
        <div className="card-face card-back">
          <div className="card-back-pattern">
            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="20" stroke="rgba(124,106,245,0.4)" strokeWidth="1.5" strokeDasharray="4 3"/>
              <circle cx="30" cy="30" r="10" stroke="rgba(79,209,197,0.4)" strokeWidth="1" />
              <circle cx="30" cy="30" r="3" fill="rgba(124,106,245,0.5)" />
            </svg>
          </div>
        </div>
        {/* Card Front */}
        <div className="card-face card-front">
          <span className="card-emoji" role="img" aria-label={card.label}>
            {card.emoji}
          </span>
        </div>
      </div>
    </div>
  );
});

export default Card;
