import React, { useState, useEffect } from 'react';

/**
 * ScorePanel — Responsive scoreboard for up to 4 players with live reaction bubbles and turn timer.
 *
 * @param {Array}  players        - List of player objects: { id, name, score, isActive, isMe }
 * @param {number} turnTimeLeft   - 0–10 seconds remaining
 * @param {Object} latestReaction - Latest reaction: { id, senderRole, emoji, timestamp }
 */
function ScorePanel({ players = [], turnTimeLeft = 10, latestReaction = null }) {
  const activePlayer = players.find(p => p.isActive);
  const activeName = activePlayer?.isMe
    ? 'Your'
    : `${activePlayer?.name || 'Someone'}'s`;

  // Track active reaction bubbles per player role
  const [activeReactions, setActiveReactions] = useState({});

  useEffect(() => {
    if (!latestReaction || !latestReaction.id) return;
    const { senderRole, emoji, id } = latestReaction;

    setActiveReactions(prev => ({
      ...prev,
      [senderRole]: { emoji, id },
    }));

    const timeout = setTimeout(() => {
      setActiveReactions(prev => {
        if (prev[senderRole]?.id === id) {
          const next = { ...prev };
          delete next[senderRole];
          return next;
        }
        return prev;
      });
    }, 2400);

    return () => clearTimeout(timeout);
  }, [latestReaction]);

  return (
    <section className="score-panel" aria-label="Game scoreboard">
      {/* Turn indicator ribbon */}
      <div className="turn-indicator">
        <div className="turn-indicator-badge">
          <div
            className="turn-pulse"
            style={activePlayer ? { '--active-color': `var(--${activePlayer.id}-color)` } : {}}
          />
          <span className="turn-text">
            {activePlayer ? `${activeName} turn (${turnTimeLeft}s)` : 'Waiting...'}
          </span>
        </div>
      </div>

      {/* Player score cards */}
      <div className="players-grid">
        {players.map((p) => (
          <PlayerCard
            key={p.id}
            id={p.id}
            name={p.name}
            isMe={p.isMe}
            score={p.score}
            isActive={p.isActive}
            timeLeft={p.isActive ? turnTimeLeft : null}
            reaction={activeReactions[p.id]}
          />
        ))}
      </div>
    </section>
  );
}

function PlayerCard({ id, name, isMe, score, isActive, timeLeft, reaction }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = isActive && timeLeft != null
    ? circumference - (timeLeft / 10) * circumference
    : circumference;

  return (
    <div
      className={`player-card player-card--${id}${isActive ? ' player-card--active' : ''}${isMe ? ' player-card--me' : ''}`}
      style={{ '--active-color': `var(--${id}-color)`, '--active-glow': `var(--${id}-glow)` }}
    >
      {/* Reaction Speech Bubble */}
      {reaction && (
        <div className="player-reaction-bubble fade-pop" aria-label={`Reaction: ${reaction.emoji}`}>
          <span className="reaction-bubble-emoji">{reaction.emoji}</span>
        </div>
      )}

      <div className="player-avatar-wrapper">
        {isActive && (
          <svg className="turn-timer-svg" width="52" height="52" aria-hidden="true">
            <circle cx="26" cy="26" r={radius} className="turn-timer-bg" />
            <circle
              cx="26"
              cy="26"
              r={radius}
              className="turn-timer-progress"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: dashoffset,
                stroke: timeLeft <= 3 ? 'var(--danger)' : `var(--${id}-color)`,
              }}
            />
          </svg>
        )}
        <div className="player-avatar">
          {name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="player-info">
        <div className="player-name-row">
          <span className="player-name">{name}</span>
          {isMe && <span className="me-badge">You</span>}
        </div>
        <span className="player-score">
          {score} <span className="score-unit">pts</span>
        </span>
      </div>

      {isActive && <div className="active-dot" />}
    </div>
  );
}

export default ScorePanel;
