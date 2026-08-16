import React, { useEffect, useRef } from 'react';

/**
 * WinModal — End-game overlay with confetti and 4-player podium rankings.
 *
 * @param {boolean} isWin        - True if local player won
 * @param {boolean} isDraw       - True if draw/tie
 * @param {string}  title        - Main heading
 * @param {string}  subtitle     - Subtext description
 * @param {Array}   rankings     - Optional array of { role, name, score, isMe }
 * @param {Function} onPlayAgain - Rematch callback
 * @param {Function} onHome      - Return to main menu callback
 */
function WinModal({ isWin, isDraw, title, subtitle, rankings = [], onPlayAgain, onHome }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!isWin || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4.5,
      vy: Math.random() * 3.5 + 2.5,
      size: Math.random() * 8 + 4,
      color: ['#7c6af5', '#4fd1c5', '#f6ad55', '#f06292', '#48bb78', '#ffd700'][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 6,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vy += 0.04;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        ctx.restore();
      });
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [isWin]);

  const emoji = isDraw ? '🤝' : isWin ? '🏆' : '😔';
  const colorClass = isDraw ? 'modal--draw' : isWin ? 'modal--win' : 'modal--lose';

  const rankMedals = ['🥇', '🥈', '🥉', '4️⃣'];

  return (
    <div className="win-modal-overlay fade-in" role="dialog" aria-modal="true" aria-label={title}>
      {isWin && <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />}

      <div className={`win-modal ${colorClass}`}>
        <div className="modal-emoji">{emoji}</div>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-subtitle">{subtitle}</p>

        {/* 4-Player Leaderboard Table */}
        {rankings && rankings.length > 0 && (
          <div className="podium-container">
            <h3 className="podium-title">Final Standings</h3>
            <div className="podium-list">
              {rankings.map((item, idx) => {
                const medal = rankMedals[idx] || `${idx + 1}`;
                return (
                  <div
                    key={item.role}
                    className={`podium-item${item.isMe ? ' podium-item--me' : ''}`}
                    style={{ '--player-color': `var(--${item.role}-color)` }}
                  >
                    <span className="podium-rank">{medal}</span>
                    <div className="podium-avatar">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="podium-info">
                      <span className="podium-name">
                        {item.name} {item.isMe && <span className="me-pill">You</span>}
                      </span>
                    </div>
                    <span className="podium-score">
                      {item.score} <span className="score-unit">pts</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button
            id="btn-play-again"
            className="btn btn-primary btn-lg"
            onClick={onPlayAgain}
          >
            🔄 Play Again
          </button>
          <button
            id="btn-go-home"
            className="btn btn-ghost"
            onClick={onHome}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export default WinModal;
