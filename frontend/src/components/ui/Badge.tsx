import React from 'react';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'brand'
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  brand: 'bg-indigo-50 text-[#1d1160] border border-indigo-200/60 font-medium',
  success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-medium',
  danger: 'bg-rose-50 text-rose-800 border border-rose-200/80 font-medium',
  info: 'bg-sky-50 text-sky-800 border border-sky-200/80 font-medium',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
  default: 'bg-slate-50 text-slate-700 border border-slate-200',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-md font-sans tracking-wide leading-none ${sizeClasses} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
