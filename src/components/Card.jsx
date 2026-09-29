import React from 'react';

export default function Card({
  title,
  subtitle,
  value,
  icon: Icon,
  variant = 'default',
  trend,
  className = '',
}) {
  const variantStyles = {
    green: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/70 hover:bg-emerald-50',
      badge: 'bg-emerald-100 text-emerald-800',
      valueColor: 'text-emerald-700',
      iconBg: 'bg-emerald-600 text-white',
    },
    red: {
      border: 'border-rose-200',
      bg: 'bg-rose-50/70 hover:bg-rose-50',
      badge: 'bg-rose-100 text-rose-800',
      valueColor: 'text-rose-700',
      iconBg: 'bg-rose-600 text-white',
    },
    orange: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/70 hover:bg-amber-50',
      badge: 'bg-amber-100 text-amber-800',
      valueColor: 'text-amber-700',
      iconBg: 'bg-amber-600 text-white',
    },
    blue: {
      border: 'border-sky-200',
      bg: 'bg-sky-50/70 hover:bg-sky-50',
      badge: 'bg-sky-100 text-sky-800',
      valueColor: 'text-sky-700',
      iconBg: 'bg-sky-600 text-white',
    },
    purple: {
      border: 'border-purple-200',
      bg: 'bg-purple-50/70 hover:bg-purple-50',
      badge: 'bg-purple-100 text-purple-800',
      valueColor: 'text-purple-700',
      iconBg: 'bg-purple-600 text-white',
    },
    stone: {
      border: 'border-stone-200',
      bg: 'bg-stone-50/80 hover:bg-stone-50',
      badge: 'bg-stone-200 text-stone-800',
      valueColor: 'text-stone-800',
      iconBg: 'bg-stone-800 text-white',
    },
    default: {
      border: 'border-stone-200',
      bg: 'bg-white hover:bg-stone-50/50',
      badge: 'bg-stone-100 text-stone-600',
      valueColor: 'text-stone-900',
      iconBg: 'bg-stone-800 text-white',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl border ${style.border} ${style.bg} shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-1.5 sm:gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-xs uppercase font-black tracking-wider text-stone-400 block truncate">
            {title}
          </span>
          {subtitle && (
            <span className="block text-[10px] sm:text-[11px] font-semibold text-stone-400 mt-0.5 truncate">
              {subtitle}
            </span>
          )}
        </div>
        {Icon && (
          <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon size={14} className="sm:hidden" />
            <Icon size={18} className="hidden sm:block" />
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-3">
        <div className={`text-base sm:text-2xl lg:text-3xl font-black font-mono tracking-tight truncate ${style.valueColor}`}>
          {value}
        </div>
        {trend && (
          <div className="text-[10px] sm:text-xs text-stone-500 mt-0.5 font-semibold flex items-center gap-1 truncate">
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
