/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // Brand — Indigo-based
        primary: {
          50:  "hsl(240, 100%, 98%)",
          100: "hsl(240, 95%, 94%)",
          200: "hsl(240, 90%, 88%)",
          300: "hsl(240, 85%, 78%)",
          400: "hsl(240, 78%, 68%)",
          500: "hsl(240, 70%, 60%)",
          600: "hsl(240, 65%, 52%)",
          700: "hsl(240, 62%, 44%)",
          800: "hsl(240, 60%, 36%)",
          900: "hsl(240, 58%, 28%)",
        },
        // Neutral surfaces
        surface: {
          0:   "hsl(0, 0%, 100%)",
          50:  "hsl(220, 14%, 98%)",
          100: "hsl(220, 13%, 96%)",
          200: "hsl(220, 12%, 92%)",
          300: "hsl(220, 10%, 84%)",
          400: "hsl(220, 9%, 64%)",
          500: "hsl(220, 8%, 44%)",
          600: "hsl(220, 7%, 32%)",
          700: "hsl(220, 8%, 24%)",
          800: "hsl(220, 10%, 16%)",
          850: "hsl(220, 12%, 12%)",
          900: "hsl(220, 14%, 9%)",
          950: "hsl(220, 16%, 6%)",
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        sm:     "0 2px 6px 0 rgba(0,0,0,0.08), 0 1px 3px -1px rgba(0,0,0,0.06)",
        md:     "0 4px 12px 0 rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.08)",
        lg:     "0 8px 24px 0 rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.10)",
        float:  "0 12px 40px 0 rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.12)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
        fast: "100ms",
        slow: "250ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
}
