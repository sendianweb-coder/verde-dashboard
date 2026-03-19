import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        heading: ['Space Grotesk', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        background: 'var(--color-background)',
        page: 'var(--color-page)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
        },
        brand: {
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          border: 'var(--color-sidebar-border)',
        },
        nav: {
          default: {
            text: 'var(--color-nav-default-text)',
            icon: 'var(--color-nav-default-icon)',
          },
          active: {
            text: 'var(--color-nav-active-text)',
            icon: 'var(--color-nav-active-icon)',
          },
        },
        stat: {
          icon: {
            bg: 'var(--color-stat-icon-bg)',
            DEFAULT: 'var(--color-stat-icon)',
          },
        },
        badge: {
          pending: {
            bg: 'var(--badge-pending-bg)',
            text: 'var(--badge-pending-text)',
          },
          approved: {
            bg: 'var(--badge-approved-bg)',
            text: 'var(--badge-approved-text)',
          },
          rejected: {
            bg: 'var(--badge-rejected-bg)',
            text: 'var(--badge-rejected-text)',
          },
          'picked-up': {
            bg: 'var(--badge-picked-up-bg)',
            text: 'var(--badge-picked-up-text)',
          },
          completed: {
            bg: 'var(--badge-completed-bg)',
            text: 'var(--badge-completed-text)',
          },
          processing: {
            bg: 'var(--badge-processing-bg)',
            text: 'var(--badge-processing-text)',
          },
          shipped: {
            bg: 'var(--badge-shipped-bg)',
            text: 'var(--badge-shipped-text)',
          },
          cancelled: {
            bg: 'var(--badge-cancelled-bg)',
            text: 'var(--badge-cancelled-text)',
          },
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
} satisfies Config
