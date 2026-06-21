/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Les couleurs réelles sont pilotées par des CSS custom properties
      // (voir src/shared/theme/theme.css), pas par la palette Tailwind statique,
      // car le thème change dynamiquement à l'exécution (Aube/Nuit/Ardoise...).
      colors: {
        night: 'var(--c-night)',
        surf: 'var(--c-surf)',
        surf2: 'var(--c-surf2)',
        line: 'var(--c-line)',
        ember: 'var(--c-ember)',
        gold: 'var(--c-gold)',
        text: 'var(--c-text)',
        dim: 'var(--c-dim)',
        ok: 'var(--c-ok)',
        blue: 'var(--c-blue)',
        red: 'var(--c-red)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
