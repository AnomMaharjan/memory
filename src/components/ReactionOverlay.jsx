import React, { useState, useEffect, useRef } from 'react';

/**
 * ReactionOverlay — Renders floating animated emojis and tease toast alerts on screen.
 *
 * @param {Object} latestReaction - { id, senderRole, senderName, emoji, timestamp }
 */
function ReactionOverlay({ latestReaction }) {
  const [floatingParticles, setFloatingParticles] = useState([]);
  const [activeToast, setActiveToast] = useState(null);
  const processedIdRef = useRef(null);

  useEffect(() => {
    if (!latestReaction || !latestReaction.id) return;
    if (processedIdRef.current === latestReaction.id) return;
    processedIdRef.current = latestReaction.id;

    const { senderRole, senderName, emoji } = latestReaction;

    // Trigger toast alert
    setActiveToast({
      id: latestReaction.id,
      senderRole,
      senderName,
      emoji,
    });

    const toastTimeout = setTimeout(() => {
      setActiveToast(current => (current?.id === latestReaction.id ? null : current));
    }, 2800);

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const particleCount = isMobile ? 3 : 5;
    const maxParticles = isMobile ? -6 : -15;
    const baseLeft = Math.random() * 60 + 20; // 20% to 80% screen width
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: `${latestReaction.id}_${i}`,
      emoji,
      left: `${baseLeft + (Math.random() - 0.5) * 20}%`,
      duration: `${1.6 + Math.random() * 0.6}s`,
      drift: `${(Math.random() - 0.5) * 60}px`,
      size: `${clampSize(isMobile ? 1.4 + Math.random() * 0.6 : 1.8 + Math.random() * 1.2)}rem`,
      delay: `${i * 80}ms`,
    }));

    setFloatingParticles(prev => [...prev.slice(maxParticles), ...newParticles]);

    const cleanupTimeout = setTimeout(() => {
      setFloatingParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 2500);

    return () => {
      clearTimeout(toastTimeout);
      clearTimeout(cleanupTimeout);
    };
  }, [latestReaction]);

  return (
    <div className="reaction-overlay" aria-live="polite" aria-atomic="true">
      {/* Active Toast Notification */}
      {activeToast && (
        <div
          key={activeToast.id}
          className={`tease-toast tease-toast--${activeToast.senderRole}`}
          style={{ '--sender-color': `var(--${activeToast.senderRole}-color)` }}
        >
          <div className="tease-toast-avatar">
            {activeToast.senderName.charAt(0).toUpperCase()}
          </div>
          <div className="tease-toast-content">
            <span className="tease-toast-name">{activeToast.senderName}</span>
            <span className="tease-toast-emoji">{activeToast.emoji}</span>
          </div>
        </div>
      )}

      {/* Floating Emojis */}
      <div className="floating-emojis-container" aria-hidden="true">
        {floatingParticles.map((particle) => (
          <div
            key={particle.id}
            className="floating-emoji-item"
            style={{
              left: particle.left,
              animationDuration: particle.duration,
              animationDelay: particle.delay,
              '--drift-x': particle.drift,
              fontSize: particle.size,
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

function clampSize(val) {
  return Math.min(Math.max(val, 1.4), 3.0).toFixed(2);
}

export default ReactionOverlay;
