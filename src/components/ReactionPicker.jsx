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
 * ReactionPicker — Bottom-right Floating Action Button (FAB) with quick popup reaction menu.
 *
 * @param {Function} onSendEmoji - Callback when an emoji is selected
 * @param {boolean}  disabled    - Whether reactions are disabled
 */
function ReactionPicker({ onSendEmoji, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedAll, setExpandedAll] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const lastSendRef = useRef(0);
  const containerRef = useRef(null);
  const COOLDOWN_MS = 800;

  const triggerReaction = useCallback((emoji) => {
    if (disabled) return;
    const now = Date.now();
    if (now - lastSendRef.current < COOLDOWN_MS) return;

    lastSendRef.current = now;
    setCooldown(true);

    onSendEmoji(emoji);

    setTimeout(() => {
      setCooldown(false);
    }, COOLDOWN_MS);
  }, [disabled, onSendEmoji]);

  // Click outside to close reaction popup
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setExpandedAll(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  // Keyboard shortcut listener (1-6)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (cooldown || disabled) return;

      const matched = QUICK_EMOJIS.find(item => item.key === e.key);
      if (matched) {
        e.preventDefault();
        triggerReaction(matched.emoji);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cooldown, disabled, triggerReaction]);

  return (
    <div
      ref={containerRef}
      className={`reaction-fab-container${isOpen ? ' is-open' : ''}`}
      aria-label="Emoji Reactions"
    >
      {/* Expanded Grid Popup for All Emojis */}
      {isOpen && expandedAll && (
        <div className="reaction-tray-expanded fade-in">
          <div className="tray-header">
            <span className="tray-title">🎭 Tease Players</span>
            <button
              className="tray-close-btn"
              onClick={() => setExpandedAll(false)}
              aria-label="Close emoji grid"
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
                  setExpandedAll(false);
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

      {/* Quick Reaction Popup Menu (Extending up from FAB) */}
      {isOpen && (
        <div className={`reaction-quick-popup fade-in${cooldown ? ' is-cooldown' : ''}`}>
          <div className="quick-popup-header">
            <span className="quick-popup-title">Quick Tease</span>
            <button
              className={`reaction-more-btn${expandedAll ? ' is-active' : ''}`}
              onClick={() => setExpandedAll(prev => !prev)}
              title="All emojis"
              aria-label="All emoji reactions"
            >
              {expandedAll ? '▲' : '✨ More'}
            </button>
          </div>

          <div className="reaction-quick-grid">
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

          {cooldown && (
            <div className="cooldown-bar" aria-hidden="true" />
          )}
        </div>
      )}

      {/* Bottom-Right Floating Trigger Button (FAB) */}
      <button
        id="btn-reaction-fab"
        className={`reaction-fab-btn${isOpen ? ' is-active' : ''}${cooldown ? ' is-cooldown' : ''}`}
        onClick={() => {
          setIsOpen(prev => !prev);
          if (isOpen) setExpandedAll(false);
        }}
        title="Emoji Teases (Keys 1-6)"
        aria-label="Toggle emoji reaction picker"
        aria-expanded={isOpen}
      >
        <span className="fab-icon">{isOpen ? '✕' : '🎭'}</span>
        <span className="fab-keys-hint">1-6</span>
      </button>
    </div>
  );
}

export default ReactionPicker;
