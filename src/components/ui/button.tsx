import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
  {
    variants: {
      variant: {
        default: 'bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-600',
        outline: 'border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50',
        ghost: 'px-3 py-2 text-slate-700 hover:bg-slate-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />
}
