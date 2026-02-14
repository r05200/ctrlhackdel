/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f3ff',
        'neon-purple': '#9d4edd',
        'neon-green': '#39ff14',
        'dark-bg': '#0a0e27',
        'locked-gray': '#444',
        'active-glow': '#00ff88',
        'mastered-blue': '#4cc9f0',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
