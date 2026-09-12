import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return <img src="logo.png" alt="PRO-TUNING" className={cn('h-10 w-auto object-contain', className)} draggable={false} />
}