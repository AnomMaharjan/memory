import React, { memo } from 'react';

/**
 * Individual memory card with 3D flip animation and holographic shimmer.
 *
 * @param {object}   card        - Card data object {id, pairId, emoji, label, index}
 * @param {boolean}  isFlipped   - Whether card is face-up
 * @param {boolean}  isMatched   - Whether card pair has been matched
 * @param {string}   matchedBy   - Player role who matched this card
 * @param {string}   cardBack    - Themed card back icon/emoji
 * @param {function} onClick     - Click handler
 * @param {number}   delay       - CSS animation delay for stagger effect (ms)
 */
const Card = memo(function Card({ card, isFlipped, isMatched, matchedBy, cardBack = '✨', onClick, delay = 0 }) {
  const handleClick = () => {
    if (!isFlipped && !isMatched) onClick(card.index);
  };

  const isUnturned = !isFlipped && !isMatched;

  return (
    <div
      className={`card-wrapper${isFlipped || isMatched ? ' is-flipped' : ''}${isMatched ? ' is-matched' : ''}${matchedBy ? ` is-matched-${matchedBy}` : ''}${isUnturned ? ' is-unturned' : ''}`}
      style={{
        '--delay': `${delay}ms`,
        '--card-i': card.index,
        '--shimmer-delay': `${(card.index % 8) * 0.35}s`,
      }}
      onClick={handleClick}
      role="button"
      aria-label={isFlipped || isMatched ? card.label : 'Hidden card'}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="card-inner">
        {/* Card Back (Unturned with clean modern surface and shimmer) */}
        <div className="card-face card-back">
          <div className="card-shimmer-sweep" aria-hidden="true" />
          <span className="card-back-symbol" aria-hidden="true">{cardBack}</span>
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
