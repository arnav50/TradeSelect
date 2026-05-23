import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0b0f17", soft: "#111827", card: "#151b27" },
        line: "#1f2937",
        accent: { DEFAULT: "#22d3ee", soft: "#0ea5e9" },
        good: "#10b981",
        warn: "#f59e0b",
        bad: "#ef4444",
        muted: "#94a3b8",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
