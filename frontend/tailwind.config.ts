import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wavemint: {
          purple: '#a855f7',
          cyan: '#22d3ee',
          dark: '#030712',
        },
      },
    },
  },
  plugins: [],
};

export default config;
