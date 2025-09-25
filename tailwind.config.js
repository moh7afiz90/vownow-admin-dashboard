/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mint: '#BED7D1',
        leaf: '#9DB5A4',
        peach: '#FBDDC6',
        blush: '#FFD1E0',
        coral: '#FF6F61',
        cream: '#FFF9F5',
        // Futuristic color palette
        neon: {
          cyan: '#00FFFF',
          purple: '#FF00FF',
          pink: '#FF10F0',
          blue: '#00F0FF',
          green: '#00FF88',
        },
        cyber: {
          dark: '#0A0E27',
          darker: '#060818',
          light: '#1A1F3A',
          accent: '#6B46C1',
        },
        hologram: {
          blue: 'rgba(0, 240, 255, 0.8)',
          purple: 'rgba(187, 134, 252, 0.8)',
          green: 'rgba(0, 255, 136, 0.8)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 15s ease infinite',
        // Futuristic animations
        'glow': 'glow 2s ease-in-out infinite',
        'glitch': 'glitch 3s linear infinite',
        'glitch-1': 'glitch-1 0.3s infinite',
        'glitch-2': 'glitch-2 0.3s infinite reverse',
        'scan': 'scan 3s linear infinite',
        'flicker': 'flicker 2s infinite',
        'neon-pulse': 'neonPulse 1.5s ease-in-out infinite',
        'hologram': 'hologram 8s ease-in-out infinite',
        'matrix': 'matrix 20s linear infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'shimmer': 'shimmer 2s ease-out infinite',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)',
        'neon-purple': '0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)',
        'neon-pink': '0 0 20px rgba(255, 16, 240, 0.5), 0 0 40px rgba(255, 16, 240, 0.3)',
        'glass': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
        'hologram': '0 0 30px rgba(0, 240, 255, 0.4), inset 0 0 20px rgba(187, 134, 252, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hologram-gradient': 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(187, 134, 252, 0.1) 50%, rgba(0, 255, 136, 0.1) 100%)',
        'cyber-grid': "linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)",
      },
      borderWidth: {
        '0.5': '0.5px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.5)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        neonPulse: {
          '0%, 100%': { textShadow: '0 0 10px rgba(0, 255, 255, 0.8)' },
          '50%': { textShadow: '0 0 20px rgba(0, 255, 255, 1), 0 0 30px rgba(0, 255, 255, 0.8)' },
        },
        hologram: {
          '0%, 100%': { opacity: '0.8', transform: 'rotateY(0deg)' },
          '50%': { opacity: '1', transform: 'rotateY(180deg)' },
        },
        matrix: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'glitch-1': {
          '0%, 100%': { clip: 'rect(0px, 9999px, 0px, 0)' },
          '5%': { clip: 'rect(86px, 9999px, 38px, 0)' },
          '10%': { clip: 'rect(60px, 9999px, 45px, 0)' },
          '15%': { clip: 'rect(6px, 9999px, 16px, 0)' },
          '20%': { clip: 'rect(47px, 9999px, 36px, 0)' },
          '25%': { clip: 'rect(62px, 9999px, 11px, 0)' },
          '30%': { clip: 'rect(95px, 9999px, 61px, 0)' },
          '35%': { clip: 'rect(36px, 9999px, 29px, 0)' },
          '40%': { clip: 'rect(49px, 9999px, 65px, 0)' },
          '45%': { clip: 'rect(24px, 9999px, 77px, 0)' },
          '50%': { clip: 'rect(87px, 9999px, 3px, 0)' },
          '55%': { clip: 'rect(26px, 9999px, 44px, 0)' },
          '60%': { clip: 'rect(14px, 9999px, 50px, 0)' },
          '65%': { clip: 'rect(25px, 9999px, 63px, 0)' },
          '70%': { clip: 'rect(90px, 9999px, 9px, 0)' },
          '75%': { clip: 'rect(59px, 9999px, 16px, 0)' },
          '80%': { clip: 'rect(13px, 9999px, 94px, 0)' },
          '85%': { clip: 'rect(52px, 9999px, 51px, 0)' },
          '90%': { clip: 'rect(35px, 9999px, 13px, 0)' },
          '95%': { clip: 'rect(95px, 9999px, 68px, 0)' },
        },
        'glitch-2': {
          '0%, 100%': { clip: 'rect(0px, 9999px, 0px, 0)' },
          '5%': { clip: 'rect(36px, 9999px, 71px, 0)' },
          '10%': { clip: 'rect(85px, 9999px, 20px, 0)' },
          '15%': { clip: 'rect(91px, 9999px, 82px, 0)' },
          '20%': { clip: 'rect(36px, 9999px, 47px, 0)' },
          '25%': { clip: 'rect(19px, 9999px, 100px, 0)' },
          '30%': { clip: 'rect(53px, 9999px, 27px, 0)' },
          '35%': { clip: 'rect(69px, 9999px, 44px, 0)' },
          '40%': { clip: 'rect(2px, 9999px, 66px, 0)' },
          '45%': { clip: 'rect(47px, 9999px, 48px, 0)' },
          '50%': { clip: 'rect(57px, 9999px, 16px, 0)' },
          '55%': { clip: 'rect(42px, 9999px, 35px, 0)' },
          '60%': { clip: 'rect(51px, 9999px, 4px, 0)' },
          '65%': { clip: 'rect(62px, 9999px, 59px, 0)' },
          '70%': { clip: 'rect(44px, 9999px, 67px, 0)' },
          '75%': { clip: 'rect(6px, 9999px, 31px, 0)' },
          '80%': { clip: 'rect(79px, 9999px, 10px, 0)' },
          '85%': { clip: 'rect(43px, 9999px, 77px, 0)' },
          '90%': { clip: 'rect(56px, 9999px, 80px, 0)' },
          '95%': { clip: 'rect(6px, 9999px, 22px, 0)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Glassmorphism utilities
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-heavy': {
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        '.glass-light': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(5px)',
          '-webkit-backdrop-filter': 'blur(5px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-gradient': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          backdropFilter: 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        // Neon text utilities
        '.neon-text-cyan': {
          color: '#00FFFF',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.6)',
        },
        '.neon-text-purple': {
          color: '#FF00FF',
          textShadow: '0 0 10px rgba(255, 0, 255, 0.8), 0 0 20px rgba(255, 0, 255, 0.6)',
        },
        '.neon-text-pink': {
          color: '#FF10F0',
          textShadow: '0 0 10px rgba(255, 16, 240, 0.8), 0 0 20px rgba(255, 16, 240, 0.6)',
        },
        // Holographic effect
        '.holographic': {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #fec163 75%, #667eea 100%)',
          backgroundSize: '400% 400%',
          animation: 'hologram 8s ease infinite',
        },
        // Cyber grid background
        '.cyber-grid': {
          backgroundImage: `linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        },
        // Glitch effect
        '.glitch': {
          position: 'relative',
          '&::before, &::after': {
            content: 'attr(data-text)',
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
          },
          '&::before': {
            animation: 'glitch 3s infinite',
            color: '#00FFFF',
            zIndex: '-1',
          },
          '&::after': {
            animation: 'glitch 3s infinite reverse',
            color: '#FF00FF',
            zIndex: '-2',
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
};