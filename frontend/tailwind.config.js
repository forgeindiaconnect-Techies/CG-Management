export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
      },
      colors: {
        primary: '#0F766E',
        secondary: '#14B8A6',
        accent: '#06B6D4',
        background: '#F0FDFA',
        text: '#1F2937',
      }
    },
  },
  plugins: [],
}
