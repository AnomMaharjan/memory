import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';
import GameBoard from '../components/GameBoard';
import ScorePanel from '../components/ScorePanel';
import Timer from '../components/Timer';
import WinModal from '../components/WinModal';
import ReactionPicker from '../components/ReactionPicker';
import ReactionOverlay from '../components/ReactionOverlay';
import ParticleBackground from '../components/ParticleBackground';
import { soundManager } from '../utils/sound';
import { DIFFICULTY_CONFIG, createDeck } from '../utils/deck';

// ─────────────────────────────────────────────────────────────
// Single Player Game
// ─────────────────────────────────────────────────────────────
function SoloGame({ navigate }) {
  const location = useLocation();
  const difficulty = location.state?.difficulty ?? 'easy';
  const cfg = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.easy;

  const { deck, flipped, matched, moves, timeLeft, initialTime, gameOver, won, flipCard, restart } = useGame(difficulty);
  const matchedCount = matched.size;
  const totalPairs = deck.length / 2;

  const showModal = won || gameOver;

  return (
    <div className="game-layout">
      <ParticleBackground />

      <header className="game-header">
        <button id="btn-back-solo" className="back-btn" onClick={() => navigate('/')}>← Menu</button>
        <div className="game-title-group">
          <h1 className="game-title">Solo Mode</h1>
          <span className={`difficulty-badge difficulty-badge--${difficulty}`}>{cfg.label} · {cfg.grid}</span>
        </div>
        <div className="game-stats">
          <div className="stat">
            <span className="stat-value">{matchedCount}/{totalPairs}</span>
            <span className="stat-label">Pairs</span>
          </div>
          <Timer timeLeft={timeLeft} totalTime={initialTime} />
          <div className="stat">
            <span className="stat-value">{moves}</span>
            <span className="stat-label">Moves</span>
          </div>
        </div>
      </header>

      <main className="game-main">
        <GameBoard
          deck={deck}
          flipped={flipped}
          matched={matched}
          onFlip={flipCard}
          gridSize={difficulty}
        />
      </main>

      {showModal && (
        <WinModal
          isWin={won}
          isDraw={false}
          title={won ? 'You did it! 🎉' : 'Time\'s up! ⏰'}
          subtitle={
            won
              ? `Matched all ${totalPairs} pairs in ${moves} moves!`
              : `You matched ${matchedCount} of ${totalPairs} pairs.`
          }
          onPlayAgain={restart}
          onHome={() => navigate('/')}
        />
      )}
    </div>
  );
}

function getSavedSession(roomId) {
  try {
    const raw = sessionStorage.getItem('memory_game_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && session.roomId === roomId) {
      return session;
    }
  } catch {
    // ignore
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Multiplayer Game (2–4 Players + Emoji Teasing)
// ─────────────────────────────────────────────────────────────
function MultiGame({ roomId, navigate }) {
  const location = useLocation();
  const savedSession = getSavedSession(roomId);
  const role = location.state?.role ?? savedSession?.role ?? null;
  const name = location.state?.name ?? savedSession?.name ?? 'Player';

  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundManager.isSoundEnabled());

  const {
    roomData, loading, error,
    myScore, playersList,
    turnTimeLeft, latestReaction, rankings,
    flipCard, startGame, sendReaction, leaveRoom,
    requestPlayAgain, acceptPlayAgain,
  } = useMultiplayerGame(roomId, role || 'player1', name);

  const handleLeave = async () => {
    try {
      sessionStorage.removeItem('memory_game_session');
    } catch {
      // ignore
    }
    await leaveRoom();
    navigate('/');
  };

  const handleCopyCode = () => {
    if (!roomData?.code) return;
    navigator.clipboard.writeText(roomData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundEnabled(next);
  };

  const handlePlayAgainRequest = async () => {
    await requestPlayAgain();
  };

  const handleAcceptPlayAgain = async () => {
    const newDeck = createDeck(roomData.gridSize);
    await acceptPlayAgain(newDeck);
  };

  const handleDeclinePlayAgain = async () => {
    try {
      sessionStorage.removeItem('memory_game_session');
    } catch {
      // ignore
    }
    await leaveRoom();
    navigate('/');
  };

  // Direct link without role — prompt user to join
  if (!role) {
    return (
      <div className="page center-screen">
        <ParticleBackground />
        <div className="lobby-hero" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div className="lobby-badge">⚔️ Room Invite</div>
          <h2 className="lobby-title" style={{ fontSize: '1.75rem', marginTop: '0.5rem' }}>Room {roomId}</h2>
          <p className="lobby-desc" style={{ marginBottom: '1.5rem' }}>Enter your nickname to join this memory duel.</p>
          <button
            id="btn-join-invite"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={() => navigate('/lobby', { state: { prefillCode: roomId } })}
          >
            Join with Room Code →
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onHome={() => navigate('/')} />;
  if (!roomData) return <LoadingScreen />;

  // If waiting in lobby and role was removed/evicted
  if (roomData.status === 'waiting' && !roomData.players?.[role]) {
    return (
      <div className="page center-screen">
        <ParticleBackground />
        <div className="error-icon">⚠️</div>
        <p className="error-text">You are no longer in this room.</p>
        <button
          id="btn-rejoin-room"
          className="btn btn-primary"
          onClick={() => navigate('/lobby', { state: { prefillCode: roomId } })}
        >
          Re-join Room
        </button>
      </div>
    );
  }

  const { deck = [], flipped = [], matched = [], matchedBy = {}, status, winner, code, playAgainRequestedBy } = roomData;
  const isWaiting = status === 'waiting';
  const isFinished = status === 'finished';
  const isPlayAgainRequested = status === 'play_again_requested';
  const iRequestedPlayAgain = playAgainRequestedBy === role;
  const isDraw = winner === 'draw';
  const iWon = winner === role;

  const handleStartGame = async () => {
    const newDeck = createDeck(roomData.gridSize);
    await startGame(newDeck);
  };

  const getActiveHue = () => {
    if (isFinished || isWaiting || isPlayAgainRequested) return null;
    const activePlayer = playersList.find(p => p.isActive);
    if (!activePlayer) return null;
    if (activePlayer.id === 'player1') return 250;
    if (activePlayer.id === 'player2') return 180;
    if (activePlayer.id === 'player3') return 35;
    if (activePlayer.id === 'player4') return 330;
    return null;
  };

  const difficulty = roomData?.gridSize ?? 'easy';
  const cfg = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.easy;

  // 4 Slot lobby display
  const allSlotRoles = ['player1', 'player2', 'player3', 'player4'];

  return (
    <div className="game-layout">
      <ParticleBackground activeColor={getActiveHue()} />
      <ReactionOverlay latestReaction={latestReaction} />

      {/* Header bar */}
      <header className="game-header game-header--multi">
        <button id="btn-leave-game" className="back-btn" onClick={handleLeave}>
          ✕ Leave
        </button>

        <div className="game-title-group" style={{ flexDirection: 'row', gap: '0.75rem', alignItems: 'center' }}>
          <div className="room-code-badge" title="Room Code">
            🔑 <span id="room-code-display">{code}</span>
          </div>
          <span className={`difficulty-badge difficulty-badge--${difficulty}`}>
            {cfg.label} · {cfg.grid}
          </span>
        </div>

        <button
          id="btn-sound-toggle"
          className="sound-toggle-btn"
          onClick={handleToggleSound}
          title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
      </header>

      {/* ── Waiting Room (2–4 Players) ────────────────────────── */}
      {isWaiting && (
        <div className="waiting-screen fade-in">
          <div className="waiting-header">
            <h2 className="waiting-title">Room Lobby</h2>
            <p className="waiting-desc">Share code with friends (supports up to 4 players):</p>
            <div className="room-code-large" id="room-code-share">{code}</div>
            <div className="lobby-actions-row">
              <button
                id="btn-copy-code"
                className={`btn ${copied ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleCopyCode}
              >
                {copied ? '✅ Copied!' : '📋 Copy Code'}
              </button>
            </div>
          </div>

          {/* 4 Player Slots Grid */}
          <div className="lobby-slots-grid">
            {allSlotRoles.map((slotRole, idx) => {
              const player = roomData.players?.[slotRole];
              const isHost = slotRole === 'player1';
              const isCurrentMe = slotRole === role;

              return (
                <div
                  key={slotRole}
                  className={`lobby-slot-card${player ? ' lobby-slot-card--filled' : ' lobby-slot-card--empty'}`}
                  style={player ? { '--slot-color': `var(--${slotRole}-color)` } : {}}
                >
                  <div className="slot-badge">
                    {player ? (isHost ? '👑 Host' : `Player ${idx + 1}`) : `Slot ${idx + 1}`}
                  </div>

                  <div className="slot-avatar">
                    {player ? player.name.charAt(0).toUpperCase() : '👤'}
                  </div>

                  <div className="slot-info">
                    <span className="slot-name">
                      {player ? player.name : 'Waiting for player...'}
                    </span>
                    {player && isCurrentMe && (
                      <span className="slot-me-tag">You</span>
                    )}
                  </div>

                  <div className="slot-status">
                    {player ? (
                      <span className="status-pill status-pill--ready">● Ready</span>
                    ) : (
                      <span className="status-pill status-pill--waiting">○ Open</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Host Start / Guest Waiting CTA */}
          <div className="waiting-footer">
            {role === 'player1' ? (
              <div className="host-start-controls">
                <button
                  id="btn-start-game"
                  className="btn btn-primary btn-lg"
                  onClick={handleStartGame}
                  disabled={playersList.length < 2}
                >
                  ⚔️ Start Game ({playersList.length}/4 Players)
                </button>
                {playersList.length < 2 && (
                  <p className="waiting-subhint">Need at least 2 players to begin.</p>
                )}
              </div>
            ) : (
              <div className="guest-waiting-controls">
                <div className="waiting-spinner" aria-label="Waiting for host" />
                <p className="waiting-guest-text">
                  Waiting for host to start… ({playersList.length}/4 players ready)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Rematch Request Screen ────────────────────────────── */}
      {isPlayAgainRequested && (
        <div className="waiting-screen fade-in">
          {iRequestedPlayAgain ? (
            <div className="center-dialog">
              <div className="waiting-spinner" aria-label="Waiting for players" />
              <h2 className="waiting-title">Rematch Requested!</h2>
              <p className="waiting-desc">Waiting for other players to accept the challenge…</p>
            </div>
          ) : (
            <div className="center-dialog">
              <div className="modal-emoji">⚔️</div>
              <h2 className="waiting-title">Rematch Challenge!</h2>
              <p className="waiting-desc">A player wants to play again. Are you ready?</p>
              <div className="lobby-buttons" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-primary btn-lg" onClick={handleAcceptPlayAgain}>
                  ⚔️ Accept Rematch
                </button>
                <button className="btn btn-outline btn-lg" onClick={handleDeclinePlayAgain}>
                  Decline & Leave
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Active Game Playing ─────────────────────────────────── */}
      {!isWaiting && !isPlayAgainRequested && (
        <>
          <ScorePanel
            players={playersList}
            turnTimeLeft={turnTimeLeft}
            latestReaction={latestReaction}
          />

          <main className="game-main">
            <GameBoard
              deck={deck}
              flipped={flipped}
              matched={matched}
              matchedBy={matchedBy}
              onFlip={flipCard}
              gridSize={roomData.gridSize}
            />
          </main>

          {/* Docked In-game Reaction Picker */}
          <ReactionPicker onSendEmoji={sendReaction} />
        </>
      )}

      {/* ── Game Over & Win Modal ───────────────────────────────── */}
      {isFinished && !isPlayAgainRequested && (() => {
        let title = 'Game Over';
        let subtitle = '';

        if (isDraw) {
          title = "It's a Tie! 🤝";
          subtitle = 'Incredible match between all players!';
        } else if (iWon) {
          title = 'Victory! 🏆';
          subtitle = `You dominated with ${myScore} points!`;
        } else {
          const winnerPlayer = playersList.find(p => p.id === winner);
          title = 'Game Over! 👏';
          subtitle = `${winnerPlayer?.name || 'Someone'} won with ${roomData.players?.[winner]?.score || 0} points`;
        }

        return (
          <WinModal
            isWin={iWon}
            isDraw={isDraw}
            title={title}
            subtitle={subtitle}
            rankings={rankings}
            onPlayAgain={handlePlayAgainRequest}
            onHome={handleLeave}
          />
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GamePage Router
// ─────────────────────────────────────────────────────────────
function GamePage() {
  const { mode, roomId } = useParams();
  const navigate = useNavigate();

  if (mode === 'solo') return <SoloGame navigate={navigate} />;
  if (mode === 'multi') return <MultiGame roomId={roomId} navigate={navigate} />;
  return <ErrorScreen message="Unknown game mode." onHome={() => navigate('/')} />;
}

// ── Utility screens ───────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="page center-screen">
      <ParticleBackground />
      <div className="loading-ring" aria-label="Loading game…" />
      <p className="loading-text">Connecting to room…</p>
    </div>
  );
}

function ErrorScreen({ message, onHome }) {
  return (
    <div className="page center-screen">
      <ParticleBackground />
      <div className="error-icon">⚠️</div>
      <p className="error-text">{message}</p>
      <button id="btn-error-home" className="btn btn-primary" onClick={onHome}>Go Home</button>
    </div>
  );
}

export default GamePage;
