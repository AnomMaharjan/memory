import React, { useEffect, useRef } from 'react';

/**
 * Animated particle background — renders floating orbs on canvas.
 * @param {number} activeColor - Target hue value
 */
function ParticleBackground({ activeColor }) {
  const canvasRef = useRef(null);
  const targetHueRef = useRef(activeColor);

  useEffect(() => {
    targetHueRef.current = activeColor;
  }, [activeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const isMobile = window.innerWidth < 768;
    const NUM_PARTICLES = isMobile ? 14 : 32;
    const particles = Array.from({ length: NUM_PARTICLES }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * (isMobile ? 100 : 160) + 30,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.05 + 0.02,
      hue: Math.random() < 0.5 ? 250 : 180, // initial
    }));

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const target = targetHueRef.current;
      
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.r) p.x = canvas.width + p.r;
        if (p.x > canvas.width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = canvas.height + p.r;
        if (p.y > canvas.height + p.r) p.y = -p.r;

        // Transition hue towards target
        if (target != null) {
          // simple linear interpolation towards target
          const diff = target - p.hue;
          // Normalize difference to take shortest path on color wheel
          let shortest = diff;
          if (Math.abs(diff) > 180) {
            shortest = diff > 0 ? diff - 360 : diff + 360;
          }
          p.hue += shortest * 0.02;
          if (p.hue < 0) p.hue += 360;
          if (p.hue > 360) p.hue -= 360;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${p.alpha})`);
        grad.addColorStop(1, `hsla(${p.hue}, 80%, 65%, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}

export default ParticleBackground;
