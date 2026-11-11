import React from 'react';

const SIZE_CLASS = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-28 h-28',
};

const BrandLogo = ({ size = 'md', showText = true, className = '', variant = 'dark' }) => {
  const titleClass = variant === 'light' ? 'text-brand-charcoal' : 'text-brand-silver';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="RESIDENCE"
        className={`${SIZE_CLASS[size] || SIZE_CLASS.md} rounded-full object-cover shrink-0 shadow-lg`}
      />
      {showText && (
        <div className="leading-tight">
          <div className={`font-semibold tracking-[0.28em] text-lg ${titleClass}`}>RESIDENCE</div>
          <div className="text-[10px] tracking-[0.32em] text-brand-muted mt-0.5">БАЗА ОТДЫХА</div>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
