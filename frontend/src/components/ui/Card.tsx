import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? bodyClassName : `p-5 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};
