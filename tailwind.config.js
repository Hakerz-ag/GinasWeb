/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tennis: {
          green: {
            50: '#f5fbf5',
            100: '#eaf7ea',
            200: '#d4f5d4',
            300: '#a8e6a8',
            400: '#7ed67e',
            500: '#5cb85c',
            600: '#4a9e4a',
            700: '#3d7a3d',
            800: '#2d5a2d',
            900: '#1a3a1a',
          },
          yellow: {
            50: '#fefbe8',
            100: '#fdf5d0',
            200: '#fae890',
            300: '#f5d860',
            400: '#f0c830',
            500: '#e6b800',
            600: '#d4a800',
            700: '#c49a00',
            800: '#a07d00',
            900: '#7a6200',
          },
          court: '#2d8a4e',
          grass: '#4a9e4a',
          ball: '#e6b800',
          net: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};