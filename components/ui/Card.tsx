import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-2xl bg-white border border-engrity-gray shadow-card p-6 animate-fade-in', className)}
      {...props}
    />
  );
}
