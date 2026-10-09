/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        tight: ['Inter Tight', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
        paper: '#FAFAFA',
        inkwell: '#0F172A',
        synapse: '#2563EB',
        'data-grey': '#64748B',
        'border-light': '#E2E8F0',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			// /top's heat scale (heatColor in DetailBoxes.jsx at 0, 0.5 and 1), so one
  			// legend icon can show the whole range.
  			heat: {
  				'0%, 100%': { color: 'hsl(40, 30%, 72%)' },
  				'25%, 75%': { color: 'hsl(20, 40.5%, 59%)' },
  				'50%': { color: 'hsl(0, 51%, 46%)' }
  			},
  			// A status LED softly brightening and glowing in its own colour.
  			breathe: {
  				'0%, 100%': { opacity: '0.45', boxShadow: '0 0 0 0 transparent' },
  				'50%': { opacity: '1', boxShadow: '0 0 4px 1px currentColor' }
  			},
  			// /top's all-clear croissant: a sparkle growing, turning and fading, and a
  			// little hop when the mouse arrives.
  			twinkle: {
  				'0%, 60%, 100%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
  				'25%': { opacity: '1', transform: 'scale(1) rotate(45deg)' }
  			},
  			hop: {
  				'0%, 100%': { transform: 'translateY(0) rotate(-12deg) scale(1.1)' },
  				'40%': { transform: 'translateY(-3px) rotate(-12deg) scale(1.1)' }
  			},
  			// /top's drive icons: an activity light blinking unevenly.
  			blink: {
  				'0%, 12%, 30%, 100%': { opacity: '0.25' },
  				'6%, 22%, 26%': { opacity: '1' }
  			},
  			// /top's notes pill: its usual shadow with a soft ring in --glow swelling and fading.
  			glow: {
  				'0%, 100%': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 0 var(--glow)' },
  				'50%': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 6px var(--glow)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			heat: 'heat 4s ease-in-out infinite',
  			breathe: 'breathe 2.4s ease-in-out infinite',
  			glow: 'glow 3.2s ease-in-out infinite',
  			twinkle: 'twinkle 2.6s ease-in-out infinite',
  			blink: 'blink 2.3s linear infinite',
  			hop: 'hop 0.45s ease-out 1 both'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
