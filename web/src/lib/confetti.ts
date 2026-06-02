import confetti from "canvas-confetti";

/**
 * A celebratory burst plus a short side-cannon stream, themed to a team's
 * colors. Safe to call only in the browser (uses window/canvas).
 */
export function celebrate(colors: string[]) {
  // Center burst.
  confetti({
    particleCount: 140,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.32 },
    colors,
    scalar: 1.1,
    ticks: 220,
  });

  // Side cannons for ~700ms.
  const end = Date.now() + 700;
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.6 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
