import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7B68EE', // mediumslateblue
          hover: '#6a60dd',
          light: '#C4C1E0',
        },
        campus: {
          bg: '#f6f6f6',
          dark: '#474A56',
          grey: '#929AAB',
          text: '#999999',
        },
      },
      fontFamily: {
        yeon: ['"Yeon Sung"', 'cursive'],
        nunito: ['"Nunito Sans"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        quicksand: ['Quicksand', 'sans-serif'],
        overlock: ['Overlock', 'cursive'],
        special: ['"Special Elite"', 'cursive'],
      },
      zIndex: {
        'tag': '103',
        'control': '104',
        'panel': '105',
        'legend': '103',
        'pin': '103',
        'search': '200',
        'instruction': '200',
      },
    },
  },
  plugins: [],
};

export default config;
