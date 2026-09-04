/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070A12',
          900: '#0B0F19',
          850: '#111726',
          800: '#162035',
          750: '#1E293B',
          700: '#334155',
        },
        brand: {
          blue: '#3B82F6',
          indigo: '#6366F1',
          purple: '#8B5CF6',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
