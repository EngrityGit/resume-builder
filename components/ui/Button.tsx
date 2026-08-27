import { clsx } from 'clsx';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
        variant === 'primary' && 'bg-engrity-blue text-white hover:brightness-110 shadow-card',
        variant === 'secondary' && 'bg-engrity-soft text-engrity-navy hover:bg-engrity-gray',
        variant === 'ghost' && 'bg-transparent text-engrity-navy hover:bg-engrity-gray/60',
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      {...props}
    />
  );
}
