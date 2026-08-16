import React from 'react';

/**
 * Circular countdown timer for single player mode.
 * Shows a SVG arc that drains as time runs out.
 *
 * @param {number} timeLeft    - Seconds remaining
 * @param {number} totalTime   - Total seconds (for arc calculation)
 */
function Timer({ timeLeft, totalTime }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const fraction = timeLeft / totalTime;
  const dashOffset = circumference * (1 - fraction);

  const isUrgent = timeLeft <= 15;
  const isCritical = timeLeft <= 5;

  return (
    <div className={`timer${isUrgent ? ' timer--urgent' : ''}${isCritical ? ' timer--critical' : ''}`}
      aria-label={`${timeLeft} seconds remaining`}
      aria-live="polite"
    >
      <svg viewBox="0 0 60 60" className="timer-ring">
        {/* Track */}
        <circle
          cx="30" cy="30" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
        />
        {/* Progress arc */}
        <circle
          cx="30" cy="30" r={radius}
          fill="none"
          stroke={isCritical ? '#f56565' : isUrgent ? '#ed8936' : '#7c6af5'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 30 30)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span className="timer-label">{timeLeft}</span>
    </div>
  );
}

export default Timer;
