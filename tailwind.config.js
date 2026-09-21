/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0B2C4D',
          'primary-dark': '#071B31',
          'primary-light': '#17507F',
          accent: '#FFC53D',
          'accent-dark': '#E9A400',
          'accent-light': '#FFE29A',
          ink: '#0C1726',
          muted: '#7B8AA0',
          surface: '#F5F7FB',
          'surface-2': '#EDF1F8',
          border: '#E5EAF3',
          dark: '#0B2C4D',
          success: '#12A150',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#0EA5E9',
        },
        // Alias odoo → brand for backward compatibility
        odoo: {
          primary: '#0B2C4D',
          'primary-dark': '#071B31',
          'primary-light': '#17507F',
          secondary: '#0B2C4D',
          accent: '#FFC53D',
          surface: '#F5F7FB',
          border: '#E5EAF3',
          muted: '#7B8AA0',
          dark: '#0B2C4D',
          success: '#12A150',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#0EA5E9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'eyebrow': ['0.7rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
      },
      maxWidth: {
        shell: '1320px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      backgroundImage: {
        'mesh-navy':
          'radial-gradient(circle at 15% 20%, rgba(23,80,127,0.55) 0%, transparent 45%), radial-gradient(circle at 85% 10%, rgba(255,197,61,0.28) 0%, transparent 40%), radial-gradient(circle at 60% 90%, rgba(23,80,127,0.35) 0%, transparent 55%), linear-gradient(135deg, #0B2C4D 0%, #071B31 55%, #0B2C4D 100%)',
        'gold-sheen':
          'linear-gradient(100deg, #FFD463 0%, #FFC53D 35%, #FFE29A 55%, #FFC53D 80%)',
        'card-fade': 'linear-gradient(180deg, rgba(12,23,38,0) 40%, rgba(12,23,38,0.78) 100%)',
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
        fadeInScale: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
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
        floatSlow: {
          '0%, 100%': { transform: 'translate3d(0,0,0) rotate(0deg)' },
          '50%':       { transform: 'translate3d(0,-18px,0) rotate(3deg)' },
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
        marquee: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.65', transform: 'scale(1.06)' },
        },
        sheen: {
          '0%':   { transform: 'translateX(-120%) skewX(-12deg)' },
          '100%': { transform: 'translateX(220%) skewX(-12deg)' },
        },
        progressBar: {
          from: { transform: 'scaleX(0)' },
          to:   { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'page-enter':   'pageEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in-up':   'fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in-scale':'fadeInScale 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'badge-bounce': 'badgeBounce 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'float':        'float 3.8s ease-in-out infinite',
        'float-slow':   'floatSlow 9s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s infinite linear',
        'success-pop':  'successPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin-slow':    'spin 2s linear infinite',
        'marquee':      'marquee 32s linear infinite',
        'pulse-soft':   'pulseSoft 2.6s ease-in-out infinite',
        'sheen':        'sheen 1.4s ease-in-out',
      },
      boxShadow: {
        'card-hover': '0 8px 30px -6px rgba(11, 44, 77, 0.25)',
        'card-lg':    '0 20px 60px -12px rgba(11, 44, 77, 0.15)',
        'accent':     '0 4px 14px -3px rgba(255, 197, 61, 0.45)',
        soft:         '0 1px 2px rgba(12, 23, 38, 0.04), 0 8px 24px -12px rgba(12, 23, 38, 0.12)',
        lift:         '0 18px 40px -18px rgba(11, 44, 77, 0.34)',
        sheet:        '0 -12px 40px -18px rgba(11, 44, 77, 0.28)',
        'inner-line': 'inset 0 0 0 1px rgba(12, 23, 38, 0.06)',
      },
    },
  },
  plugins: [],
};
