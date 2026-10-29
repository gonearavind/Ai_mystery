/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          bg:      '#0b0d12',
          card:    '#141821',
          elevated:'#1c2030',
          border:  'rgba(255,255,255,0.08)',
        },
        amber: {
          DEFAULT: '#f5b942',
          light:   '#fcd97a',
          dark:    '#c8922a',
          glow:    'rgba(245,185,66,0.25)',
        },
        crimson: {
          DEFAULT: '#e5484d',
          light:   '#f87171',
          dark:    '#b91c1c',
          glow:    'rgba(229,72,77,0.25)',
        },
        emerald: {
          DEFAULT: '#3ecf8e',
          light:   '#6ee7b7',
          dark:    '#059669',
          glow:    'rgba(62,207,142,0.25)',
        },
        muted:   '#8b95a7',
        ghost:   '#e8eaf0',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'amber-glow': '0 0 20px rgba(245,185,66,0.3), 0 0 40px rgba(245,185,66,0.15)',
        'amber-glow-sm': '0 0 10px rgba(245,185,66,0.2)',
        'crimson-glow': '0 0 20px rgba(229,72,77,0.3)',
        'emerald-glow': '0 0 20px rgba(62,207,142,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(245,185,66,0.15)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'glow-pulse': { '0%,100%': { boxShadow: '0 0 10px rgba(245,185,66,0.2)' }, '50%': { boxShadow: '0 0 30px rgba(245,185,66,0.5)' } },
        'spin-slow': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        'float': { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        'count-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'slide-in-right': { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'card-flip': { '0%': { transform: 'rotateY(90deg)', opacity: '0' }, '100%': { transform: 'rotateY(0deg)', opacity: '1' } },
        'bounce-in': { '0%': { transform: 'scale(0.8)', opacity: '0' }, '60%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
        'card-flip': 'card-flip 0.4s ease-out forwards',
        'bounce-in': 'bounce-in 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
