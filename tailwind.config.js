/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0A2A4A',
          'primary-dark': '#061828',
          'primary-light': '#1a4a70',
          accent: '#FFD700',
          'accent-dark': '#E6C200',
          'accent-light': '#FFE44D',
          muted: '#B0B0B0',
          surface: '#F8F9FA',
          border: '#E2E8F0',
          dark: '#0A2A4A',
          success: '#16A34A',
          warning: '#FFD700',
          danger: '#DC2626',
          info: '#0EA5E9',
        },
        // Alias odoo → brand for backward compatibility
        odoo: {
          primary: '#0A2A4A',
          'primary-dark': '#061828',
          'primary-light': '#1a4a70',
          secondary: '#0A2A4A',
          accent: '#FFD700',
          surface: '#F8F9FA',
          border: '#E2E8F0',
          muted: '#B0B0B0',
          dark: '#0A2A4A',
          success: '#16A34A',
          warning: '#FFD700',
          danger: '#DC2626',
          info: '#0EA5E9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        pageEnter: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        badgeBounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '30%':       { transform: 'scale(1.55)' },
          '60%':       { transform: 'scale(0.85)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        successPop: {
          '0%':   { transform: 'scale(0.6)', opacity: '0' },
          '60%':  { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
      animation: {
        'page-enter':   'pageEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in-up':   'fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'badge-bounce': 'badgeBounce 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'float':        'float 3.8s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s infinite linear',
        'success-pop':  'successPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin-slow':    'spin 2s linear infinite',
      },
      boxShadow: {
        'card-hover': '0 8px 30px -6px rgba(10, 42, 74, 0.25)',
        'card-lg':    '0 20px 60px -12px rgba(10, 42, 74, 0.15)',
        'accent':     '0 4px 14px -3px rgba(255, 215, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
