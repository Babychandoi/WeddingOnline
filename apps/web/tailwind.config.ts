import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        wedding: {
          cream: '#FFFDF8',
          rose: '#E11D48',
          gold: '#D4AF37',
          ink: '#1E1B4B',
        },
      },
    },
  },
  plugins: [],
};

export default config;
