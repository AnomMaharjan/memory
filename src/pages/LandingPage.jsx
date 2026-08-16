import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import { DIFFICULTY_CONFIG, GAME_MODES, THEMES } from '../utils/deck';

const DIFFICULTIES = [
  {
    key: 'quick',
    icon: '🌱',
    color: 'var(--teal)',
    glow: 'rgba(79,209,197,0.25)',
    border: 'rgba(79,209,197,0.4)',
  },
  {
    key: 'easy',
    icon: '🌿',
    color: 'var(--success)',
    glow: 'rgba(72,187,120,0.25)',
    border: 'rgba(72,187,120,0.4)',
  },
  {
    key: 'medium',
    icon: '⚡',
    color: 'var(--accent)',
    glow: 'var(--accent-glow)',
    border: 'rgba(124,106,245,0.45)',
  },
  {
    key: 'hard',
    icon: '🔥',
    color: 'var(--danger)',
    glow: 'rgba(245,101,101,0.25)',
    border: 'rgba(245,101,101,0.4)',
  },
  {
    key: 'master',
    icon: '💀',
    color: '#ed8936',
    glow: 'rgba(237,137,54,0.3)',
    border: 'rgba(237,137,54,0.45)',
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [soloExpanded, setSoloExpanded] = useState(true);
  const [theme, setTheme] = useState('classic');
  const [difficulty, setDifficulty] = useState('easy');
  const [gameMode, setGameMode] = useState('classic');

  const startSolo = () => {
    navigate('/game/solo', { state: { difficulty, gameMode, theme } });
  };

  const selectedDiffCfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;
  const selectedModeCfg = GAME_MODES[gameMode] || GAME_MODES.classic;
  const selectedThemeCfg = THEMES[theme] || THEMES.classic;

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

        <div className="landing-hero-text">
          <h1 className="landing-title">
            Memory <span className="gradient-text">Duel</span>
          </h1>
          <p className="landing-subtitle">
            Challenge your memory with customizable themes & modifiers, or battle up to 4 friends in real-time.
          </p>
        </div>

        <div className="mode-cards-container">
          {/* ── Solo Mode Hub ─────────────────────────────────── */}
          <div className={`mode-card mode-card--solo${soloExpanded ? ' is-expanded' : ''}`}>
            <div
              className="mode-card-header"
              onClick={() => setSoloExpanded(s => !s)}
              role="button"
              id="btn-single-player"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSoloExpanded(s => !s)}
            >
              <div className="mode-icon-circle mode-icon--solo">🎮</div>
              <div className="mode-text">
                <div className="mode-title-row">
                  <h2 className="mode-title">Solo Mode</h2>
                  <span className="mode-pill">Single Player</span>
                </div>
                <p className="mode-desc">Customize board themes, modifiers, test your speed & beat high scores.</p>
              </div>
              <div className={`mode-chevron${soloExpanded ? ' mode-chevron--open' : ''}`}>›</div>
            </div>

            {/* Solo Mode Customizer Drawer */}
            {soloExpanded && (
              <div className="solo-config-drawer fade-in">
                {/* 1. Theme Section */}
                <div className="config-section">
                  <div className="config-label-row">
                    <span className="config-label">1. Select Board Theme</span>
                    <span className="config-sublabel">{selectedThemeCfg.name} ({selectedThemeCfg.cardBack} Cards)</span>
                  </div>
                  <div className="themes-grid">
                    {Object.values(THEMES).map((t) => {
                      const isSelected = theme === t.key;
                      return (
                        <button
                          key={t.key}
                          id={`btn-theme-${t.key}`}
                          type="button"
                          className={`theme-card${isSelected ? ' is-active' : ''}`}
                          style={isSelected ? {
                            '--t-color': t.color,
                            '--t-glow': t.glow,
                            '--t-border': t.border,
                          } : {}}
                          onClick={() => setTheme(t.key)}
                        >
                          <span className="theme-card-icon">{t.icon}</span>
                          <div className="theme-card-info">
                            <span className="theme-card-name">{t.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Modifier Section */}
                <div className="config-section">
                  <div className="config-label-row">
                    <span className="config-label">2. Choose Game Modifier</span>
                    <span className="config-sublabel">{selectedModeCfg.desc}</span>
                  </div>
                  <div className="modifiers-grid">
                    {Object.values(GAME_MODES).map((mode) => {
                      const isSelected = gameMode === mode.key;
                      return (
                        <button
                          key={mode.key}
                          id={`btn-gamemode-${mode.key}`}
                          type="button"
                          className={`modifier-card${isSelected ? ' is-active' : ''}`}
                          onClick={() => setGameMode(mode.key)}
                        >
                          <span className="modifier-icon">{mode.icon}</span>
                          <div className="modifier-info">
                            <span className="modifier-name">{mode.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Difficulty Tier Section */}
                <div className="config-section">
                  <div className="config-label-row">
                    <span className="config-label">3. Choose Grid Size</span>
                    <span className="config-sublabel">{selectedDiffCfg.grid} ({selectedDiffCfg.pairs} Pairs)</span>
                  </div>
                  <div className="difficulty-tiers-row">
                    {DIFFICULTIES.map(({ key, icon, color, glow, border }) => {
                      const cfg = DIFFICULTY_CONFIG[key];
                      const isSelected = difficulty === key;
                      return (
                        <button
                          key={key}
                          id={`btn-difficulty-${key}`}
                          type="button"
                          className={`difficulty-tier-btn${isSelected ? ' is-active' : ''}`}
                          style={isSelected ? {
                            '--tier-color': color,
                            '--tier-glow': glow,
                            '--tier-border': border,
                          } : {}}
                          onClick={() => setDifficulty(key)}
                        >
                          <span className="tier-icon">{icon}</span>
                          <span className="tier-name">{cfg.label}</span>
                          <span className="tier-grid">{cfg.grid}</span>
                          <span className="tier-time">{gameMode === 'blitz' ? '30s' : `${cfg.time}s`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  id="btn-start-solo"
                  className="btn btn-primary btn-hero-play"
                  onClick={startSolo}
                >
                  Launch Solo Match ({selectedThemeCfg.icon} {selectedThemeCfg.name} · {selectedModeCfg.name} · {selectedDiffCfg.grid}) →
                </button>
              </div>
            )}
          </div>

          {/* ── Versus Mode (2–4 Players) ─────────────────────── */}
          <div
            id="btn-multiplayer"
            className="mode-card mode-card--versus"
            onClick={() => navigate('/lobby')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate('/lobby')}
          >
            <div className="mode-card-header">
              <div className="mode-icon-circle mode-icon--versus">⚔️</div>
              <div className="mode-text">
                <div className="mode-title-row">
                  <h2 className="mode-title">Versus Arena</h2>
                  <span className="mode-pill mode-pill--versus">2–4 Players</span>
                </div>
                <p className="mode-desc">Create private rooms, duel friends in real-time, and tease with emojis.</p>
              </div>
              <div className="mode-arrow">→</div>
            </div>

            <div className="versus-preview-chips">
              <span className="versus-chip">👥 Up to 4 Players</span>
              <span className="versus-chip">🎭 Emoji Teasing</span>
              <span className="versus-chip">⏱️ Turn Timers</span>
              <span className="versus-chip">🏆 Leaderboards</span>
            </div>

            <div className="versus-card-action">
              <button className="btn btn-secondary btn-versus-enter" onClick={() => navigate('/lobby')}>
                Enter Versus Arena →
              </button>
            </div>
          </div>
        </div>

        <p className="landing-footer">
          Built with ❤️ — Real-time memory battles with live state synchronization
        </p>
      </div>
    </div>
  );
}

export default LandingPage;
