/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        ink:    '#0a0a0f',
        panel:  '#13131a',
        card:   '#1c1c26',
        border: '#2a2a3a',
        muted:  '#4a4a6a',
        text:   '#e8e8f0',
        dim:    '#9090b0',
        accent: '#6c63ff',
        green:  '#22c55e',
        amber:  '#f59e0b',
        red:    '#ef4444',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease both',
        'slide-in': 'slideIn 0.3s ease both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
