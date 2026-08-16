import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import { DIFFICULTY_CONFIG, GAME_MODES } from '../utils/deck';

const DIFFICULTIES = [
  {
    key: 'quick',
    icon: '🌱',
    color: 'var(--teal)',
    glow: 'rgba(79,209,197,0.25)',
    border: 'rgba(79,209,197,0.35)',
  },
  {
    key: 'easy',
    icon: '🌿',
    color: 'var(--success)',
    glow: 'rgba(72,187,120,0.25)',
    border: 'rgba(72,187,120,0.35)',
  },
  {
    key: 'medium',
    icon: '⚡',
    color: 'var(--accent)',
    glow: 'var(--accent-glow)',
    border: 'rgba(124,106,245,0.4)',
  },
  {
    key: 'hard',
    icon: '🔥',
    color: 'var(--danger)',
    glow: 'rgba(245,101,101,0.25)',
    border: 'rgba(245,101,101,0.35)',
  },
  {
    key: 'master',
    icon: '💀',
    color: '#ed8936',
    glow: 'rgba(237,137,54,0.3)',
    border: 'rgba(237,137,54,0.4)',
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [soloExpanded, setSoloExpanded] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [gameMode, setGameMode] = useState('classic');

  const startSolo = () => {
    navigate('/game/solo', { state: { difficulty, gameMode } });
  };

  return (
    <div className="page landing-page">
      <ParticleBackground />

      <div className="landing-content">
        {/* Glowing logo mark */}
        <div className="logo-mark" aria-hidden="true">
          <div className="logo-grid">
            {['🌙', '⭐', '🔥', '💎'].map((e, i) => (
              <div key={i} className="logo-card" style={{ '--i': i }}>
                <span>{e}</span>
              </div>
            ))}
          </div>
        </div>

        <h1 className="landing-title">
          Memory <span className="gradient-text">Duel</span>
        </h1>
        <p className="landing-subtitle">
          Test your memory. Challenge your friends. Tease in real-time.
        </p>

        <div className="mode-cards">
          {/* ── Solo Mode ─────────────────────────────────────── */}
          <div className={`mode-card mode-card--expandable${soloExpanded ? ' mode-card--expanded' : ''}`}>
            <div
              className="mode-card-header"
              onClick={() => setSoloExpanded(s => !s)}
              role="button"
              id="btn-single-player"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSoloExpanded(s => !s)}
            >
              <div className="mode-icon">🎮</div>
              <div className="mode-text">
                <h2 className="mode-title">Solo Mode</h2>
                <p className="mode-desc">Race against the clock, test modifiers & hone memory.</p>
              </div>
              <div className="mode-pill">Single Player</div>
              <div className={`mode-chevron${soloExpanded ? ' mode-chevron--open' : ''}`}>›</div>
            </div>

            {/* Difficulty & Modifier picker */}
            <div className="difficulty-drawer" aria-hidden={!soloExpanded}>
              {/* Game Mode Modifiers */}
              <p className="difficulty-label">Select Game Modifier</p>
              <div className="game-mode-chips-grid">
                {Object.values(GAME_MODES).map((mode) => {
                  const isSelected = gameMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      id={`btn-gamemode-${mode.key}`}
                      type="button"
                      className={`game-mode-chip${isSelected ? ' is-selected' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setGameMode(mode.key); }}
                    >
                      <span className="mode-chip-icon">{mode.icon}</span>
                      <span className="mode-chip-name">{mode.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mode-modifier-hint">
                {GAME_MODES[gameMode]?.desc}
              </p>

              {/* Grid Size / Difficulty */}
              <p className="difficulty-label" style={{ marginTop: '1rem' }}>Choose Grid Size</p>
              <div className="difficulty-grid difficulty-grid--5cols">
                {DIFFICULTIES.map(({ key, icon, color, glow, border }) => {
                  const cfg = DIFFICULTY_CONFIG[key];
                  const isSelected = difficulty === key;
                  return (
                    <button
                      key={key}
                      id={`btn-difficulty-${key}`}
                      className={`difficulty-btn${isSelected ? ' difficulty-btn--selected' : ''}`}
                      style={isSelected ? {
                        '--diff-color': color,
                        '--diff-glow': glow,
                        '--diff-border': border,
                      } : {}}
                      onClick={(e) => { e.stopPropagation(); setDifficulty(key); }}
                    >
                      <span className="diff-icon">{icon}</span>
                      <span className="diff-name">{cfg.label}</span>
                      <span className="diff-grid">{cfg.grid}</span>
                      <span className="diff-time">{gameMode === 'blitz' ? '30s' : `${cfg.time}s`}</span>
                    </button>
                  );
                })}
              </div>

              <button
                id="btn-start-solo"
                className="btn btn-primary btn-solo-start"
                onClick={(e) => { e.stopPropagation(); startSolo(); }}
              >
                Play {GAME_MODES[gameMode]?.name} ({DIFFICULTY_CONFIG[difficulty]?.grid}) →
              </button>
            </div>
          </div>

          {/* ── Versus Mode (2–4 Players) ─────────────────────── */}
          <button
            id="btn-multiplayer"
            className="mode-card mode-card--featured"
            onClick={() => navigate('/lobby')}
          >
            <div className="mode-card-header">
              <div className="mode-icon">⚔️</div>
              <div className="mode-text">
                <h2 className="mode-title">Versus Mode</h2>
                <p className="mode-desc">Create a room for up to 4 players and tease each other in real-time.</p>
              </div>
              <div className="mode-pill mode-pill--featured">2–4 Players</div>
              <div className="mode-arrow">→</div>
            </div>
          </button>
        </div>

        <p className="landing-footer">
          Built with ❤️ — Flip cards, match pairs, tease friends & win glory
        </p>
      </div>
    </div>
  );
}

export default LandingPage;
