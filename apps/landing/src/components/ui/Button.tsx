import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover shadow-[0_8px_24px_-8px_rgba(255,122,26,0.55)] hover:shadow-[0_12px_32px_-8px_rgba(255,122,26,0.7)]',
  secondary:
    'border border-border-strong bg-bg-raised/60 text-fg hover:bg-bg-raised hover:border-border-strong/80 backdrop-blur',
  ghost: 'text-fg-muted hover:text-fg',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-6 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  ),
)
Button.displayName = 'Button'

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant
  size?: Size
  href: string
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  ...props
}: ButtonLinkProps) {
  const isExternal = href.startsWith('http')
  const classes = cn(base, variants[variant], sizes[size], className)
  if (isExternal) {
    return <a className={classes} href={href} target="_blank" rel="noreferrer noopener" {...props} />
  }
  return <Link className={classes} href={href} {...props} />
}
