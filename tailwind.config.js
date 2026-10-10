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
  			// The temperature key's colours: the heat scale up to the overheat red,
  			// deepening to the crimson of 90°C at the peak (overheatColor).
  			'key-heat': {
  				'0%, 100%': { color: 'hsl(40, 30%, 72%)' },
  				'25%, 75%': { color: 'hsl(20, 40.5%, 59%)' },
  				'40%, 60%': { color: '#B33A3A' },
  				'50%': { color: '#7A1F33' }
  			},
  			// The temperature key heating up: the mercury rises, the thermometer slides
  			// aside and sun rays appear one by one at the peak, then all reverses.
  			'key-mercury': {
  				'0%, 100%': { transform: 'translateY(16px)' },
  				'50%': { transform: 'translateY(0)' }
  			},
  			'key-slide': {
  				'0%, 22%, 78%, 100%': { transform: 'translateX(0)' },
  				'42%, 58%': { transform: 'translateX(6px)' }
  			},
  			// The power key heating up: the bolt fills in and three sparkles twinkle in
  			// round it one by one at the peak, then all reverses.
  			'key-fill': {
  				'0%, 100%': { fillOpacity: '0' },
  				'25%, 75%': { fillOpacity: '0.2' },
  				'46%, 54%': { fillOpacity: '1' }
  			},
  			'key-sparkle': {
  				'0%, 32%, 68%, 100%': { opacity: '0', transform: 'scale(0) rotate(-60deg)' },
  				'46%, 54%': { opacity: '1', transform: 'scale(1) rotate(0)' }
  			},
  			'key-ray': {
  				'0%, 34%, 66%, 100%': { opacity: '0', transform: 'scale(0.3)' },
  				'46%, 54%': { opacity: '1', transform: 'scale(1)' }
  			},
  			// A status LED softly brightening and glowing in its own colour.
  			breathe: {
  				'0%, 100%': { opacity: '0.45', boxShadow: '0 0 0 0 transparent' },
  				'50%': { opacity: '1', boxShadow: '0 0 4px 1px currentColor' }
  			},
  			// /top's all-clear croissant: a sparkle growing, turning and fading, and a
  			// little hop when the mouse arrives.
  			// A full tile bolt's sparkles: twisting in once as the power key's do, then
  			// blinking now and then, a quick shrink and spring back in the same colour.
  			'sparkle-in': {
  				'0%': { opacity: '0', transform: 'scale(0) rotate(-60deg)' },
  				'100%': { opacity: '1', transform: 'scale(1) rotate(0)' }
  			},
  			'sparkle-blink': {
  				'0%, 100%': { transform: 'scale(1)' },
  				'35%': { transform: 'scale(0.15)' },
  				'70%': { transform: 'scale(1.2)' }
  			},
  			// The bakery card's oven: its window glowing, steam curling
  			// up, the closed sign swinging and the dozing oven's z's floating off.
  			'oven-glow': {
  				'0%, 100%': { opacity: '0.45' },
  				'50%': { opacity: '0.85' }
  			},
  			'pastry-in': {
  				'0%': { opacity: '0', transform: 'translateX(-14px) scale(0.7)' },
  				'100%': { opacity: '1', transform: 'translateX(0) scale(1)' }
  			},
  			'pastry-out': {
  				'0%': { opacity: '1', transform: 'translateX(0)' },
  				'80%': { opacity: '1' },
  				'100%': { opacity: '0', transform: 'translateX(64px)' }
  			},
  			'pastry-enter': {
  				'0%': { opacity: '0', transform: 'translateX(-64px)' },
  				'20%': { opacity: '1' },
  				'100%': { opacity: '1', transform: 'translateX(0)' }
  			},
  			// The oven door swinging down on its hinge until it hangs open below the
  			// window (seen from the front, folded past the hinge), staying open while
  			// the pastries change, and swinging shut.
  			'door-swing': {
  				'0%, 100%': { transform: 'scaleY(1)' },
  				'14%, 86%': { transform: 'scaleY(-0.26)' }
  			},
  			// The tray coming out of the open oven towards the viewer while the
  			// pastries change, then going back in.
  			'tray-out': {
  				'0%, 14%, 86%, 100%': { transform: 'translateY(0) scale(1)' },
  				'32%, 68%': { transform: 'translateY(9px) scale(1.12)' }
  			},
  			// The oven's power button breathing while it is off.
  			'power-breathe': {
  				'0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
  				'50%': { opacity: '0.55', transform: 'scale(1.9)' }
  			},
  			// The oven's power button pulsing when the locked door is tried.
  			'power-nudge': {
  				'0%': { opacity: '0.7', transform: 'scale(1)' },
  				'100%': { opacity: '0', transform: 'scale(2.4)' }
  			},
  			// A server's packing counter: a new round's pastries popping onto the pile,
  			// the full box's lid going on, the box taken away (fading as it slides a
  			// little, so it stays inside the scene) and an empty one set down.
  			'pile-pop': {
  				'0%': { opacity: '0', transform: 'scale(0.3)' },
  				'70%': { opacity: '1', transform: 'scale(1.08)' },
  				'100%': { opacity: '1', transform: 'scale(1)' }
  			},
  			'box-lid': {
  				'0%': { opacity: '0', transform: 'translateY(-8px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'box-leave': {
  				'0%, 35%': { opacity: '1', transform: 'translateX(0)' },
  				'100%': { opacity: '0', transform: 'translateX(14px)' }
  			},
  			'box-enter': {
  				'0%': { opacity: '0', transform: 'translateY(-8px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			// The roaming bakery cat: its steps while walking, its breathing at rest,
  			// and hearts or z's rising off it.
  			'cat-pose-in': {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' }
  			},
  			'cat-pose-out': {
  				'0%': { opacity: '1' },
  				'100%': { opacity: '0' }
  			},
  			'cat-step': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-2px)' }
  			},
  			'cat-climb': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-5px)' }
  			},
  			'cat-roll': {
  				'0%': { transform: 'rotate(0deg)' },
  				'100%': { transform: 'rotate(360deg)' }
  			},
  			'cat-knead': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-3px)' }
  			},
  			'cat-breathe': {
  				'0%, 100%': { transform: 'scaleY(1)' },
  				'50%': { transform: 'scaleY(1.04)' }
  			},
  			'cat-float': {
  				'0%': { opacity: '0', transform: 'translateY(4px) scale(0.6)' },
  				'25%': { opacity: '1', transform: 'translateY(0) scale(1)' },
  				'100%': { opacity: '0', transform: 'translateY(-16px) scale(1)' }
  			},
  			steam: {
  				'0%': { opacity: '0', transform: 'translateY(4px)' },
  				'35%': { opacity: '0.9' },
  				'100%': { opacity: '0', transform: 'translateY(-10px)' }
  			},
  			'sign-swing': {
  				'0%, 100%': { transform: 'rotate(-7deg)' },
  				'50%': { transform: 'rotate(7deg)' }
  			},
  			snooze: {
  				'0%': { opacity: '0', transform: 'translate(0, 4px)' },
  				'30%': { opacity: '1' },
  				'100%': { opacity: '0', transform: 'translate(6px, -12px)' }
  			},
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
  			// /top's overheated GPUs: a red halo swelling and fading around the tile.
  			alarm: {
  				'0%, 100%': { boxShadow: 'inset 0 0 0 2px rgb(179 58 58 / 0.9), 0 0 0 0 rgb(179 58 58 / 0.35)' },
  				'50%': { boxShadow: 'inset 0 0 0 2px rgb(179 58 58 / 0.9), 0 0 0 5px rgb(179 58 58 / 0)' }
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
  			'key-heat': 'key-heat 4s ease-in-out infinite',
  			'key-mercury': 'key-mercury 4s ease-in-out infinite',
  			'key-slide': 'key-slide 4s ease-in-out infinite',
  			'key-ray': 'key-ray 4s ease-in-out infinite',
  			'key-fill': 'key-fill 4s ease-in-out infinite',
  			'key-sparkle': 'key-sparkle 4s ease-in-out infinite',
  			breathe: 'breathe 2.4s ease-in-out infinite',
  			glow: 'glow 3.2s ease-in-out infinite',
  			alarm: 'alarm 1.6s ease-out infinite',
  			'sparkle-in': 'sparkle-in 0.56s ease-in-out both',
  			'sparkle-blink': 'sparkle-blink 0.6s ease-in-out',
  			'oven-glow': 'oven-glow 2.4s ease-in-out infinite',
  			'pastry-out': 'pastry-out 0.45s ease-in 0.8s both',
  			'pastry-enter': 'pastry-enter 0.45s ease-out 1.25s both',
  			'door-swing': 'door-swing 2.5s ease-in-out both',
  			'tray-out': 'tray-out 2.5s ease-in-out both',
  			'pastry-in': 'pastry-in 0.6s ease-out both',
  			'power-breathe': 'power-breathe 1.8s ease-in-out infinite',
  			'power-nudge': 'power-nudge 0.7s ease-out 2',
  			'pile-pop': 'pile-pop 0.45s ease-out both',
  			'box-lid': 'box-lid 0.35s ease-out both',
  			'box-leave': 'box-leave 1.3s ease-in both',
  			'box-enter': 'box-enter 0.5s ease-out both',
  			'cat-pose-in': 'cat-pose-in 0.26s ease-in-out both',
  			'cat-pose-out': 'cat-pose-out 0.26s ease-in-out both',
  			'cat-roll': 'cat-roll 0.6s ease-in-out both',
  			'cat-step': 'cat-step 0.4s ease-in-out infinite',
  			'cat-climb': 'cat-climb 0.5s ease-in-out infinite',
  			'cat-knead': 'cat-knead 0.7s ease-in-out infinite',
  			'cat-breathe': 'cat-breathe 3.2s ease-in-out infinite',
  			'cat-float': 'cat-float 1.6s ease-out both',
  			steam: 'steam 2.1s ease-out infinite',
  			'sign-swing': 'sign-swing 2.8s ease-in-out infinite',
  			snooze: 'snooze 2.7s ease-out infinite',
  			twinkle: 'twinkle 2.6s ease-in-out infinite',
  			blink: 'blink 2.3s linear infinite',
  			hop: 'hop 0.45s ease-out 1 both'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
