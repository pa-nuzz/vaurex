/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    orange: '#FF6B35',
                    blue: '#3B82F6',
                },
                surface: {
                    primary: '#1C1C1E',
                    secondary: '#2C2C2E',
                    tertiary: '#3A3A3C',
                },
                // 60% - Primary Gray (dominant background)
                gray: {
                    50: '#FAFAFA',
                    100: '#F5F5F5', 
                    200: '#E5E5E5',
                    300: '#D4D4D8',
                    400: '#A1A1AA',
                    500: '#71717A',
                    600: '#52525B',
                    700: '#3F3F46',
                    800: '#27272A',
                    850: '#1F1F21', // 60% primary
                    900: '#18181B',
                    950: '#0F0F10',
                },
                // 30% - Secondary Gray (cards, surfaces)
                neutral: {
                    50: '#FAFAFA',
                    100: '#F5F5F5',
                    200: '#E5E5E5',
                    300: '#D4D4D8',
                    400: '#A1A1AA',
                    500: '#71717A',
                    600: '#52525B',
                    700: '#3F3F46',
                    800: '#2C2C2E', // 30% secondary
                    900: '#18181B',
                    950: '#0F0F10',
                },
                // 10% - Accent Orange (CTAs, highlights)
                orange: {
                    50: '#FFF4ED',
                    100: '#FFE5D4',
                    200: '#FFC7A1',
                    300: '#FFA86E',
                    400: '#FF893A',
                    500: '#FF6B35', // 10% accent
                    600: '#E55A25',
                    700: '#CC4A1F',
                    800: '#B33A19',
                    900: '#992A13',
                },
                // Add blue accent as requested
                blue: {
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    200: '#BFDBFE',
                    300: '#93C5FD',
                    400: '#60A5FA',
                    500: '#3B82F6', // Main blue
                    600: '#2563EB',
                    700: '#1D4ED8',
                    800: '#1E40AF',
                    900: '#1E3A8A',
                },
                // White-gray backgrounds
                'white-gray': {
                    50: '#FAFAFA',
                    100: '#F8F9FA',
                    200: '#F1F3F4',
                    300: '#E9ECEF',
                    400: '#DEE2E6',
                    500: '#CED4DA',
                    600: '#ADB5BD',
                    700: '#6C757D',
                    800: '#495057',
                    900: '#212529',
                },
                // Semantic colors using the palette
                success: '#22C55E',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#3B82F6',
            },
            fontFamily: {
                display: ["Inter", "system-ui", "sans-serif"],
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem', { lineHeight: '1.5rem' }],
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
                '5xl': ['3rem', { lineHeight: '1' }],
                '6xl': ['3.75rem', { lineHeight: '1' }],
                '7xl': ['4.5rem', { lineHeight: '1' }],
                '8xl': ['6rem', { lineHeight: '1' }],
                '9xl': ['8rem', { lineHeight: '1' }],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            maxWidth: {
                '8xl': '88rem',
                '9xl': '96rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'fade-up': 'fadeUp 0.6s ease-out',
                'fade-down': 'fadeDown 0.6s ease-out',
                'fade-left': 'fadeLeft 0.6s ease-out',
                'fade-right': 'fadeRight 0.6s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.4s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'bounce-slow': 'bounce 2s infinite',
                'spin-slow': 'spin 3s linear infinite',
                'gradient': 'gradient 8s ease infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'float': 'float 3s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeDown: {
                    '0%': { opacity: '0', transform: 'translateY(-30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeLeft: {
                    '0%': { opacity: '0', transform: 'translateX(30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                fadeRight: {
                    '0%': { opacity: '0', transform: 'translateX(-30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(255, 107, 53, 0.5)' },
                    '100%': { boxShadow: '0 0 40px rgba(255, 107, 53, 0.8)' },
                },
            },
            boxShadow: {
                'glow': '0 0 20px rgba(255, 107, 53, 0.5)',
                'glow-lg': '0 0 40px rgba(255, 107, 53, 0.8)',
                'inner-glow': 'inset 0 0 20px rgba(255, 107, 53, 0.2)',
                'card': '0 10px 40px rgba(0, 0, 0, 0.1)',
                'card-lg': '0 20px 60px rgba(0, 0, 0, 0.15)',
                'floating': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
            backdropBlur: {
                'xs': '2px',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            typography: {
                DEFAULT: {
                    css: {
                        colorScheme: 'dark',
                    },
                },
            },
        },
    },
    plugins: [],
};
