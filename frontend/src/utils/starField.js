export const MAIN_STAR_COUNT = 76;
export const MAIN_GEMINI_COUNT = 11;

export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function createMainStar(id) {
  const landingDuration = randomBetween(1247, 1855);
  const landingDelay = randomBetween(0, 280);
  return {
    id,
    x: randomBetween(2, 98),
    y: randomBetween(2, 98),
    size: randomBetween(0.9, 2.8),
    opacity: randomBetween(0.35, 0.92),
    pulseDuration: randomBetween(2.4, 4.2),
    pulseDelay: randomBetween(0, 0.45),
    landingDelay,
    landingDuration,
    travelDown: randomBetween(240, 640),
    streakLen: randomBetween(24, 82),
    phase: 'landing',
    pulseMode: 'out',
    hidden: false,
  };
}

export function createMainGeminiStar(id) {
  const landingDuration = randomBetween(1308, 1916);
  const landingDelay = randomBetween(0, 300);
  return {
    id,
    x: randomBetween(3, 97),
    y: randomBetween(3, 97),
    size: randomBetween(9.5, 17.5),
    rotation: randomBetween(-22, 22),
    pulseDuration: randomBetween(3.0, 5.2),
    pulseDelay: randomBetween(0, 0.5),
    opacity: randomBetween(0.35, 0.82),
    landingDelay,
    landingDuration,
    travelDown: randomBetween(260, 660),
    phase: 'landing',
    pulseMode: 'out',
    hidden: false,
  };
}

export function generateMainStarField() {
  return {
    stars: Array.from({ length: MAIN_STAR_COUNT }, (_, i) => createMainStar(i)),
    gemini: Array.from({ length: MAIN_GEMINI_COUNT }, (_, i) => createMainGeminiStar(i)),
  };
}
