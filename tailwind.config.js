/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        odoo: {
          primary: '#714B67',
          'primary-dark': '#5d3d55',
          'primary-light': '#875A7B',
          secondary: '#017E84',
          accent: '#00A09D',
          surface: '#F8F9FA',
          border: '#DEE2E6',
          muted: '#6C757D',
          dark: '#212529',
          success: '#28A745',
          warning: '#FFC107',
          danger: '#DC3545',
          info: '#17A2B8',
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
        'card-hover': '0 8px 30px -6px rgba(113, 75, 103, 0.2)',
        'card-lg':    '0 20px 60px -12px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
