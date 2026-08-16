import React, { useState, useEffect, useCallback, useRef } from 'react';

const QUICK_EMOJIS = [
  { emoji: '😂', label: 'Laugh', key: '1' },
  { emoji: '🔥', label: 'On Fire', key: '2' },
  { emoji: '🤡', label: 'Clown', key: '3' },
  { emoji: '💀', label: 'Dead', key: '4' },
  { emoji: '👑', label: 'Boss', key: '5' },
  { emoji: '😜', label: 'Tease', key: '6' },
];

const EXTRA_EMOJIS = [
  { emoji: '🤫', label: 'Quiet' },
  { emoji: '👏', label: 'Applause' },
  { emoji: '😱', label: 'Shocked' },
  { emoji: '🥱', label: 'Too Easy' },
  { emoji: '🎯', label: 'Bullseye' },
  { emoji: '💩', label: 'Poop' },
];

const ALL_EMOJIS = [...QUICK_EMOJIS, ...EXTRA_EMOJIS];

/**
 * ReactionPicker — Docked glassmorphism reaction bar for sending emoji teases with Show/Hide toggle.
 *
 * @param {Function} onSendEmoji - Callback when an emoji is selected
 * @param {boolean}  disabled    - Whether reactions are disabled
 */
function ReactionPicker({ onSendEmoji, disabled = false }) {
  const [isDockVisible, setIsDockVisible] = useState(() => {
    return localStorage.getItem('memory_game_show_emojis') !== 'false';
  });
  const [expanded, setExpanded] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(0);
  const lastSendRef = useRef(0);
  const COOLDOWN_MS = 800;

  const toggleDockVisibility = () => {
    setIsDockVisible(prev => {
      const next = !prev;
      localStorage.setItem('memory_game_show_emojis', String(next));
      if (!next) setExpanded(false);
      return next;
    });
  };

  const triggerReaction = useCallback((emoji) => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastSendRef.current < COOLDOWN_MS) return;

    lastSendRef.current = now;
    setCooldown(true);
    setCooldownProgress(100);

    onSendEmoji(emoji);

    // Cooldown animation
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / COOLDOWN_MS) * 100);
      setCooldownProgress(remaining);
      if (elapsed >= COOLDOWN_MS) {
        clearInterval(timer);
        setCooldown(false);
        setCooldownProgress(0);
      }
    }, 30);
  }, [disabled, onSendEmoji]);

  // Keyboard shortcut listener (1-6)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (!isDockVisible || cooldown || disabled) return;

      const matched = QUICK_EMOJIS.find(item => item.key === e.key);
      if (matched) {
        e.preventDefault();
        triggerReaction(matched.emoji);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDockVisible, cooldown, disabled, triggerReaction]);

  return (
    <div className="reaction-dock-container" aria-label="Emoji Reactions">
      {/* Collapsed Pill Button when hidden */}
      {!isDockVisible ? (
        <button
          id="btn-show-emojis"
          className="reaction-toggle-pill fade-in"
          onClick={toggleDockVisibility}
          title="Show Emoji Teases (Keys 1-6)"
          aria-label="Show Emoji Teases"
        >
          <span className="pill-emoji">🎭</span>
          <span className="pill-text">Show Tease Dock</span>
        </button>
      ) : (
        <>
          {/* Expanded Tray Popup */}
          {expanded && (
            <div className="reaction-tray-expanded fade-in">
              <div className="tray-header">
                <span className="tray-title">🎭 Tease Players</span>
                <button
                  className="tray-close-btn"
                  onClick={() => setExpanded(false)}
                  aria-label="Close emoji picker"
                >
                  ✕
                </button>
              </div>
              <div className="tray-grid">
                {ALL_EMOJIS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    className="reaction-btn reaction-btn--large"
                    onClick={() => {
                      triggerReaction(emoji);
                      setExpanded(false);
                    }}
                    disabled={cooldown || disabled}
                    title={label}
                    aria-label={`Send ${label} reaction`}
                  >
                    <span className="reaction-emoji">{emoji}</span>
                    <span className="reaction-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Reaction Dock */}
          <div className={`reaction-dock${cooldown ? ' reaction-dock--cooldown' : ''}`}>
            <button
              className="reaction-hide-btn"
              onClick={toggleDockVisibility}
              title="Hide emoji dock"
              aria-label="Hide emoji dock"
            >
              ▼
            </button>

            <div className="reaction-quick-list">
              {QUICK_EMOJIS.map(({ emoji, label, key }) => (
                <button
                  key={emoji}
                  className="reaction-btn"
                  onClick={() => triggerReaction(emoji)}
                  disabled={cooldown || disabled}
                  title={`${label} (Press ${key})`}
                  aria-label={`Send ${label}`}
                >
                  <span className="reaction-emoji">{emoji}</span>
                  <span className="reaction-key-hint">{key}</span>
                </button>
              ))}
            </div>

            <button
              className={`reaction-expand-btn${expanded ? ' is-active' : ''}`}
              onClick={() => setExpanded(prev => !prev)}
              title="More emojis"
              aria-label="More emoji reactions"
            >
              {expanded ? '▲' : '✨'}
            </button>

            {cooldown && (
              <div
                className="cooldown-bar"
                style={{ width: `${cooldownProgress}%` }}
                aria-hidden="true"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ReactionPicker;
