/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        bg:       '#0f0f0f',
        surface:  '#1c1c1e',
        surface2: '#2c2c2e',
        surface3: '#3a3a3c',
        accent:   '#5e7bff',
        accent2:  '#7c5cfc',
        debit:    '#ff5f5f',
        credit:   '#32d583',
        muted:    '#8e8e93',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
