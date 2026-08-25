import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fear: {
          bg: '#070605',
          raised: '#120e0c',
          panel: '#181310',
          line: '#3a2a22',
          blood: '#c23030',
          ember: '#d45b1a',
          rust: '#a84828',
          ash: '#8a8178',
          mist: '#6b6560',
          bone: '#ead9c6',
          mute: '#b9a894',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        logo: ['var(--font-logo)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
      },
      boxShadow: {
        ember: '0 0 40px rgba(196, 48, 48, 0.18)',
        glow: '0 0 24px rgba(212, 91, 26, 0.35)',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -3%, 0) scale(1.08)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
        flicker: {
          '0%, 100%': { opacity: '0.9' },
          '40%': { opacity: '0.55' },
          '42%': { opacity: '0.95' },
          '78%': { opacity: '0.7' },
        },
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        flicker: 'flicker 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
