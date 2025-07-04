/** @type {import('tailwindcss').Config} */

const {nextui} = require("@nextui-org/react");

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'museo': ['Museo Sans', 'sans-serif'],
        'sans': ['Museo Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        // Variáveis de tema para cores alaranjadas
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        card: {
          DEFAULT: 'var(--bg-secondary)',
          foreground: 'var(--text-primary)',
        },
        popover: {
          DEFAULT: 'var(--bg-secondary)',
          foreground: 'var(--text-primary)',
        },
        primary: {
          DEFAULT: 'var(--accent-primary)',
          foreground: 'hsl(210 40% 98%)',
        },
        secondary: {
          DEFAULT: 'var(--accent-secondary)',
          foreground: 'var(--text-primary)',
        },
        muted: {
          DEFAULT: 'var(--bg-tertiary)',
          foreground: 'var(--text-secondary)',
        },
        accent: {
          DEFAULT: 'var(--accent-tertiary)',
          foreground: 'var(--text-primary)',
        },
        destructive: {
          DEFAULT: 'hsl(0 84.2% 60.2%)',
          foreground: 'hsl(210 40% 98%)',
        },
        border: 'var(--border-primary)',
        input: 'var(--border-primary)',
        ring: 'var(--accent-primary)',
        chart: {
          '1': 'var(--accent-primary)',
          '2': 'var(--accent-secondary)',
          '3': 'var(--accent-tertiary)',
          '4': 'var(--text-secondary)',
          '5': 'var(--text-tertiary)',
        },
      },
    },
  },
  darkMode: ["class", "[data-theme='dark']"],
  plugins: [
    nextui({
      themes: {
        light: {
          layout: {
            fontFamily: 'Museo Sans',
          },
        },
        dark: {
          layout: {
            fontFamily: 'Museo Sans',
          },
        },
      },
    }),
  ],
}
