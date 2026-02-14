// Hardcoded star positions shared between SplashScreen and StarryBackground
// These ensure seamless transition — splash exit stars land exactly where main screen stars are

const FIXED_STARS = [
  // Row 1 — top band (y: 2-12%)
  { id: 0, x: 12.3, y: 8.7, size: 1.8 },
  { id: 1, x: 87.1, y: 4.2, size: 1.2 },
  { id: 2, x: 45.6, y: 5.3, size: 2.1 },
  { id: 4, x: 67.4, y: 3.8, size: 1.5 },
  { id: 29, x: 93.6, y: 9.1, size: 2.0 },
  { id: 31, x: 25.4, y: 6.1, size: 1.4 },
  { id: 32, x: 55.1, y: 11.0, size: 0.9 },
  { id: 33, x: 79.8, y: 10.5, size: 1.7 },
  { id: 34, x: 37.2, y: 3.0, size: 1.1 },

  // Row 2 — upper (y: 13-25%)
  { id: 3, x: 23.8, y: 22.1, size: 0.9 },
  { id: 7, x: 34.1, y: 18.9, size: 1.7 },
  { id: 23, x: 58.7, y: 15.4, size: 2.1 },
  { id: 27, x: 10.8, y: 19.4, size: 1.2 },
  { id: 35, x: 71.3, y: 20.8, size: 1.5 },
  { id: 37, x: 90.2, y: 16.7, size: 1.3 },
  { id: 38, x: 6.5, y: 14.1, size: 1.9 },
  { id: 39, x: 83.7, y: 23.5, size: 1.0 },
  { id: 40, x: 16.1, y: 13.8, size: 2.0 },

  // Row 3 — upper-mid (y: 26-40%)
  { id: 8, x: 78.5, y: 27.4, size: 0.8 },
  { id: 5, x: 5.2, y: 35.6, size: 2.0 },
  { id: 9, x: 56.2, y: 33.1, size: 2.3 },
  { id: 22, x: 88.4, y: 33.8, size: 1.7 },
  { id: 21, x: 19.5, y: 38.3, size: 1.1 },
  { id: 41, x: 42.7, y: 29.6, size: 1.4 },
  { id: 43, x: 31.8, y: 40.0, size: 1.6 },
  { id: 44, x: 96.1, y: 30.4, size: 1.2 },
  { id: 45, x: 13.4, y: 28.9, size: 1.8 },

  // Row 4 — middle (y: 41-55%)
  { id: 6, x: 91.7, y: 41.3, size: 1.1 },
  { id: 12, x: 41.8, y: 45.6, size: 0.7 },
  { id: 16, x: 63.9, y: 48.7, size: 1.3 },
  { id: 10, x: 15.9, y: 52.7, size: 1.4 },
  { id: 46, x: 75.3, y: 43.1, size: 2.0 },
  { id: 48, x: 52.1, y: 54.8, size: 0.8 },
  { id: 49, x: 7.8, y: 44.6, size: 1.9 },
  { id: 50, x: 85.5, y: 52.0, size: 1.2 },
  { id: 51, x: 38.0, y: 42.5, size: 1.5 },

  // Row 5 — lower-mid (y: 56-70%)
  { id: 26, x: 47.9, y: 56.8, size: 1.9 },
  { id: 11, x: 82.3, y: 58.2, size: 1.9 },
  { id: 15, x: 28.6, y: 61.3, size: 2.2 },
  { id: 25, x: 76.1, y: 62.5, size: 1.4 },
  { id: 13, x: 3.7, y: 67.8, size: 1.6 },
  { id: 52, x: 60.4, y: 65.3, size: 1.1 },
  { id: 54, x: 93.0, y: 68.4, size: 1.7 },
  { id: 55, x: 40.5, y: 69.1, size: 1.3 },
  { id: 56, x: 70.8, y: 57.6, size: 2.0 },

  // Row 6 — lower (y: 71-85%)
  { id: 14, x: 95.1, y: 72.4, size: 1.0 },
  { id: 17, x: 50.4, y: 76.2, size: 1.8 },
  { id: 24, x: 31.3, y: 73.6, size: 0.8 },
  { id: 18, x: 8.1, y: 84.5, size: 0.9 },
  { id: 19, x: 73.7, y: 81.9, size: 2.0 },
  { id: 58, x: 62.7, y: 71.8, size: 1.2 },
  { id: 59, x: 44.3, y: 83.7, size: 1.7 },
  { id: 60, x: 86.9, y: 75.0, size: 1.1 },
  { id: 61, x: 14.6, y: 72.1, size: 1.4 },

  // Row 7 — bottom band (y: 86-97%)
  { id: 20, x: 38.2, y: 89.1, size: 1.5 },
  { id: 28, x: 65.3, y: 91.7, size: 1.6 },
  { id: 62, x: 10.5, y: 93.2, size: 1.0 },
  { id: 63, x: 80.1, y: 87.4, size: 2.1 },
  { id: 65, x: 26.4, y: 86.8, size: 1.8 },
  { id: 66, x: 91.3, y: 94.5, size: 1.3 },
  { id: 67, x: 4.1, y: 90.6, size: 1.6 },
  { id: 68, x: 72.0, y: 96.2, size: 0.9 },
  { id: 69, x: 46.7, y: 88.3, size: 2.0 },
];

export default FIXED_STARS;
