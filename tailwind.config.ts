import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        saga: {
          gray: '#525F6B',
          'gray-dark': '#3A444E',
          'gray-light': '#7A8A96',
        },
        bg: {
          primary: '#1A1F24',
          card: '#22292F',
          elevated: '#2B3640',
          input: '#1E252B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      minHeight: {
        touch: '56px',   // mínimo para uso com luvas no canteiro
      },
    },
  },
  plugins: [],
}

export default config
