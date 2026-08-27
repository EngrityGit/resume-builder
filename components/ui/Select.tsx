import { clsx } from 'clsx';
import { SelectHTMLAttributes, forwardRef } from 'react';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={clsx(
        'w-full rounded-xl border border-engrity-gray bg-white px-3.5 py-2.5 text-sm text-engrity-navy',
        'focus:outline-none focus:ring-2 focus:ring-engrity-blue/40 focus:border-engrity-blue transition-colors duration-150',
        className
      )}
      {...props}
    />
  )
);
Select.displayName = 'Select';
