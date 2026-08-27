import { clsx } from 'clsx';
import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-xl border border-engrity-gray bg-white px-3.5 py-2.5 text-sm text-engrity-navy',
        'placeholder:text-engrity-navy/40 focus:outline-none focus:ring-2 focus:ring-engrity-blue/40 focus:border-engrity-blue',
        'transition-colors duration-150',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
