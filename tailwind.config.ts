import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// User-defined specific palettes
				mint: {
					50: '#F6FFFB',
					100: '#E8FFF4',
					200: '#CFF7E8',
					300: '#A7E8D7',
					400: '#7DD9C5',
					500: '#6AC7B2',
					600: '#46B69A',
					700: '#2F8F75',
					800: '#20624D'
				},
				pastel: {
					yellow: '#FFF5C2',
					pink: '#FFD9D9',
					purple: '#E8D6FF',
					sky: '#D6F0FF',
					green: '#D6F8E8',
					blue: '#D6F0FF'
				},
				ui: {
					charcoal: '#0F2B2A',
					'muted-100': '#F7F8F8',
					'muted-200': '#F0F2F1',
					'muted-300': '#E6EAEA'
				},
				// Semantic mappings (keeping existing variable references for compatibility, but updated in index.css)
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					pink: '#FFD6E0',
					purple: '#E8D7FF',
					blue: '#D6F0FF'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-soft': 'var(--gradient-soft)',
				'gradient-card': 'var(--gradient-card)'
			},
			boxShadow: {
				'soft': '0 6px 18px rgba(16,40,36,0.06)',
				'raised': '0 10px 30px rgba(16,40,36,0.12)',
				'primary': 'var(--shadow-primary)',
				'hover': 'var(--shadow-hover)'
			},
			spacing: {
				'xs': 'var(--spacing-xs)',
				'sm': 'var(--spacing-sm)',
				'md': 'var(--spacing-md)',
				'lg': 'var(--spacing-lg)',
				'xl': 'var(--spacing-xl)',
				'2xl': 'var(--spacing-2xl)',
				'mobile-padding': 'var(--mobile-padding)',
				'content-max': 'var(--content-max-width)'
			},
			borderRadius: {
				lg: '36px',
				md: '20px',
				sm: '8px',
				pill: '9999px'
			},
			fontFamily: {
				'ui': ['Inter', 'system-ui', 'sans-serif'],
				'friendly': ['"Poppins"', '"Nunito"', 'sans-serif']
			},
			fontSize: {
				'display-xl': ['48px', { lineHeight: '56px', fontWeight: '700' }],
				'display-lg': ['36px', { lineHeight: '44px', fontWeight: '700' }],
				'heading-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
				'heading-sm': ['16px', { lineHeight: '22px', fontWeight: '600' }],
				'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
				'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
				'caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
				'label': ['11px', { lineHeight: '14px', fontWeight: '600' }]
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(20px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'soft-scale': {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(0.98)' },
					'100%': { transform: 'scale(1)' }
				},
				'fade-slide-up': {
					'0%': { opacity: '0', transform: 'translateY(6px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'slide-up': 'slide-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
				'scale-in': 'scale-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
				'float': 'float 3s ease-in-out infinite',
				'soft-scale': 'soft-scale 180ms ease-in-out',
				'fade-slide-up': 'fade-slide-up 240ms cubic-bezier(.2,.8,.2,1)'
			},
			scale: {
				'102': '1.02'
			}
		}
	},
	plugins: [animatePlugin],
} satisfies Config;
