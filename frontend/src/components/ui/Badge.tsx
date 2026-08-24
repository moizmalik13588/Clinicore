import type { ReactNode } from 'react';

type BadgeVariant =
  | 'default' | 'primary' | 'success' | 'warning'
  | 'danger' | 'info' | 'purple';

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-slate-500/20 text-slate-400',
  primary: 'bg-primary-600/20 text-primary-400',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  danger:  'bg-red-500/20 text-red-400',
  info:    'bg-cyan-500/20 text-cyan-400',
  purple:  'bg-purple-500/20 text-purple-400',
};

interface BadgeProps {
  children:  ReactNode;
  variant?:  BadgeVariant;
  dot?:      boolean;
  className?: string;
}

export default function Badge({
  children, variant = 'default', dot, className = '',
}: BadgeProps) {
  return (
    <span className={`badge ${VARIANTS[variant]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${
          variant === 'success' ? 'bg-green-400' :
          variant === 'danger'  ? 'bg-red-400'   :
          'bg-current'
        }`} />
      )}
      {children}
    </span>
  );
}