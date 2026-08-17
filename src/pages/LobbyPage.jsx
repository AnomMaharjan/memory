import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { createDeck, generateRoomCode } from '../utils/deck';
import ParticleBackground from '../components/ParticleBackground';

const TIMEOUT_MS = 10000;

function timeoutPromise(ms, message = 'Request timed out') {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

function LobbyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => location.state?.prefillCode ? 'join' : 'create');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(() => location.state?.prefillCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gridSize, setGridSize] = useState('easy');

  // Live avatar initial
  const avatarLetter = playerName.trim().charAt(0).toUpperCase() || '👤';

  // ── CREATE ROOM ──────────────────────────────────────────────
  const handleCreateRoom = async () => {
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setError('Please enter your player name first.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const code = generateRoomCode();
      const deck = createDeck(gridSize);
      const roomRef = doc(db, 'rooms', code);

      await Promise.race([
        setDoc(roomRef, {
          code,
          status: 'waiting',
          gridSize,
          currentTurn: 'player1',
          deck,
          flipped: [],
          matched: [],
          winner: null,
          players: {
            player1: { name: trimmedName, score: 0 },
          },
          createdAt: new Date().toISOString(),
          turnUpdatedAt: new Date().toISOString(),
        }),
        timeoutPromise(TIMEOUT_MS, 'TIMEOUT'),
      ]);

      try {
        sessionStorage.setItem('memory_game_session', JSON.stringify({
          roomId: code,
          role: 'player1',
          name: trimmedName,
        }));
      } catch (e) {
        console.warn('sessionStorage write failed:', e);
      }

      navigate(`/game/multi/${code}`, {
        state: { role: 'player1', name: trimmedName },
      });
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        setError('Creating room timed out. Please check your network.');
      } else {
        setError('Failed to create room. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── JOIN ROOM ────────────────────────────────────────────────
  const handleJoinRoom = async () => {
    const trimmedName = playerName.trim();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!trimmedName) {
      setError('Please enter your player name first.');
      return;
    }
    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter a valid 6-character room code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const roomRef = doc(db, 'rooms', cleanCode);

      const joinOp = runTransaction(db, async (transaction) => {
        const roomSnap = await transaction.get(roomRef);

        if (!roomSnap.exists()) {
          throw new Error('ROOM_NOT_FOUND');
        }

        const data = roomSnap.data();
        if (data.status !== 'waiting') {
          throw new Error('ROOM_NOT_WAITING');
        }

        const players = data.players || {};

        // Allocate lowest unoccupied slot atomically
        let roleToJoin = null;
        if (!players.player2) roleToJoin = 'player2';
        else if (!players.player3) roleToJoin = 'player3';
        else if (!players.player4) roleToJoin = 'player4';

        if (!roleToJoin) {
          throw new Error('ROOM_FULL');
        }

        transaction.update(roomRef, {
          [`players.${roleToJoin}`]: { name: trimmedName, score: 0 },
        });

        return roleToJoin;
      });

      const roleToJoin = await Promise.race([
        joinOp,
        timeoutPromise(TIMEOUT_MS, 'TIMEOUT'),
      ]);

      try {
        sessionStorage.setItem('memory_game_session', JSON.stringify({
          roomId: cleanCode,
          role: roleToJoin,
          name: trimmedName,
        }));
      } catch (e) {
        console.warn('sessionStorage write failed:', e);
      }

      navigate(`/game/multi/${cleanCode}`, {
        state: { role: roleToJoin, name: trimmedName },
      });
    } catch (err) {
      if (err.message === 'ROOM_NOT_FOUND') {
        setError('Room not found. Check the code and try again.');
      } else if (err.message === 'ROOM_NOT_WAITING') {
        setError('This room has already started or finished.');
      } else if (err.message === 'ROOM_FULL') {
        setError('This room is already full (4/4 players).');
      } else if (err.message === 'TIMEOUT') {
        setError('Connection timed out. Please check your network and try again.');
      } else {
        setError('Failed to join room. Please check your connection.');
      }
      console.error('Join room error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Paste from clipboard helper
  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleaned = text.trim().toUpperCase().substring(0, 6);
        setRoomCode(cleaned);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  return (
    <div className="page lobby-page">
      <ParticleBackground />

      <div className="lobby-content">
        <button id="btn-back-lobby" className="back-btn" onClick={() => navigate('/')}>
          ← Back to Menu
        </button>

        {/* Lobby Hero Header */}
        <div className="lobby-hero">
          <div className="lobby-badge">⚔️ Multiplayer Arena</div>
          <h1 className="lobby-title">Versus Mode</h1>
          <p className="lobby-desc">Battle friends in real-time memory duels with up to 4 players</p>
        </div>

        {/* Card Container */}
        <div className="lobby-main-card fade-in">
          {/* Tab Switcher */}
          <div className="lobby-tab-switcher" role="tablist" aria-label="Lobby Mode Tabs">
            <button
              id="tab-create-room"
              role="tab"
              aria-selected={activeTab === 'create'}
              className={`lobby-tab-btn${activeTab === 'create' ? ' is-active' : ''}`}
              onClick={() => { setActiveTab('create'); setError(''); }}
            >
              🏠 Create Room
            </button>
            <button
              id="tab-join-room"
              role="tab"
              aria-selected={activeTab === 'join'}
              className={`lobby-tab-btn${activeTab === 'join' ? ' is-active' : ''}`}
              onClick={() => { setActiveTab('join'); setError(''); }}
            >
              🚪 Join Room
            </button>
          </div>

          {/* Name Input with Live Avatar Preview */}
          <div className="form-group-avatar-row">
            <div className="live-avatar-preview" title="Your avatar preview">
              <span className="live-avatar-letter">{avatarLetter}</span>
            </div>
            <div className="live-name-input-col">
              <label htmlFor="player-name-input" className="form-label">Your Nickname</label>
              <input
                id="player-name-input"
                className="form-input form-input--hero"
                type="text"
                placeholder="Enter your name (e.g. Alex)"
                maxLength={20}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (activeTab === 'create') handleCreateRoom();
                    else handleJoinRoom();
                  }
                }}
              />
            </div>
          </div>

          {/* ── CREATE ROOM TAB ──────────────────────────────── */}
          {activeTab === 'create' && (
            <div className="tab-pane fade-in">
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Game Board Difficulty</label>
                  <span className="form-hint">Choose grid complexity</span>
                </div>

                <div className="difficulty-card-group">
                  {[
                    { key: 'easy', icon: '🌱', title: 'Easy', subtitle: '4×4 Grid · 8 Pairs' },
                    { key: 'medium', icon: '⚡', title: 'Medium', subtitle: '6×6 Grid · 18 Pairs' },
                    { key: 'hard', icon: '🔥', title: 'Hard', subtitle: '8×8 Grid · 32 Pairs' },
                    { key: 'expert', icon: '👑', title: 'Expert', subtitle: '10×8 Grid · 40 Pairs' },
                  ].map(({ key, icon, title, subtitle }) => {
                    const isSelected = gridSize === key;
                    return (
                      <button
                        key={key}
                        id={`btn-size-${key}`}
                        type="button"
                        className={`difficulty-choice-card${isSelected ? ' is-selected' : ''} difficulty-choice-card--${key}`}
                        onClick={() => setGridSize(key)}
                      >
                        <div className="choice-icon">{icon}</div>
                        <div className="choice-details">
                          <div className="choice-title-row">
                            <span className="choice-title">{title}</span>
                            {isSelected && <span className="choice-check">✓</span>}
                          </div>
                          <span className="choice-sub">{subtitle}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="form-error-banner" role="alert">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                id="btn-create-room-submit"
                className="btn btn-primary btn-hero-submit"
                onClick={handleCreateRoom}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Create Room & Get Code →'}
              </button>
            </div>
          )}

          {/* ── JOIN ROOM TAB ────────────────────────────────── */}
          {activeTab === 'join' && (
            <div className="tab-pane fade-in">
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="join-code" className="form-label">6-Character Room Code</label>
                  <button
                    type="button"
                    className="paste-code-btn"
                    onClick={handlePasteCode}
                    title="Paste from clipboard"
                  >
                    📋 Paste Code
                  </button>
                </div>
                <input
                  id="join-code"
                  className="form-input form-input--code-hero"
                  type="text"
                  placeholder="e.g. AB3X7K"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>

              {error && (
                <div className="form-error-banner" role="alert">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                id="btn-join-room-submit"
                className="btn btn-primary btn-hero-submit"
                onClick={handleJoinRoom}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Enter Room Lobby →'}
              </button>
            </div>
          )}

          {/* Lobby Features Chips */}
          <div className="lobby-chips-row">
            <span className="lobby-feature-chip">👥 Up to 4 Players</span>
            <span className="lobby-feature-chip">🎭 Emoji Teasing</span>
            <span className="lobby-feature-chip">⏱️ 10s Fast Turns</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LobbyPage;
