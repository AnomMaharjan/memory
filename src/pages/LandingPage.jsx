import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import { DIFFICULTY_CONFIG } from '../utils/deck';

const DIFFICULTIES = [
  {
    key: 'easy',
    icon: '🌱',
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
];

function LandingPage() {
  const navigate = useNavigate();
  const [soloExpanded, setSoloExpanded] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');

  const startSolo = () => {
    navigate('/game/solo', { state: { difficulty } });
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
                <p className="mode-desc">Race against the clock to match all pairs.</p>
              </div>
              <div className="mode-pill">Single Player</div>
              <div className={`mode-chevron${soloExpanded ? ' mode-chevron--open' : ''}`}>›</div>
            </div>

            {/* Difficulty picker */}
            <div className="difficulty-drawer" aria-hidden={!soloExpanded}>
              <p className="difficulty-label">Choose difficulty</p>
              <div className="difficulty-grid">
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
                      <span className="diff-time">{cfg.time}s</span>
                    </button>
                  );
                })}
              </div>
              <button
                id="btn-start-solo"
                className="btn btn-primary btn-solo-start"
                onClick={(e) => { e.stopPropagation(); startSolo(); }}
              >
                Play Now →
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
