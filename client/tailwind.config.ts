/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Important for manual dark mode toggling
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'], // Default sans-serif
        heading: ['var(--font-outfit)', 'sans-serif'], // For headings
      },
      animation: {
        'aurora': 'aurora 60s linear infinite',
        'levitate': 'levitate 5s ease-in-out infinite', // If you use it
        'sparkle': 'sparkle 1s infinite', // For button sparkles
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', // For subtle pulse
      },
      keyframes: {
        aurora: {
          from: { backgroundPosition: '0% 50%' },
          to: { backgroundPosition: '200% 50%' },
        },
        levitate: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }, 
        },
        sparkle: { 
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.5, transform: 'scale(1.2)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
      },
    },
  },
  plugins: [],
}