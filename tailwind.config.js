/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#060710",
        "void-light": "#0c0e18",
        "void-lighter": "#141624",
        accent: {
          blue: "#64B5F6",
          green: "#81C784",
          red: "#E57373",
          orange: "#FFB74D",
          purple: "#BA68C8",
          teal: "#64FFDA",
          muted: "#90A4AE",
        },
      },
      fontFamily: {
        display: ["'Newsreader'", "Georgia", "serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease both",
        "slide-up": "slideUp 0.5s ease both",
        "pulse-soft": "pulseSoft 2s ease infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 0.4 },
          "50%": { opacity: 0.8 },
        },
      },
    },
  },
  plugins: [],
};
