import React from 'react';

interface LiquidGlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const LiquidGlassButton = React.forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`group relative isolate inline-flex items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 text-base font-semibold text-white shadow-[0_10px_35px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white/20 active:scale-[0.98] ${className}`}
        {...props}
      >
        <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.55),_transparent_45%)] opacity-80" />
        <span className="absolute inset-[1px] rounded-[15px] border border-white/20" />
        <span className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-12px_24px_rgba(255,255,255,0.08)]" />
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/35 via-white/10 to-transparent opacity-80" />
        <span className="relative z-10 flex items-center gap-3">
          {children}
        </span>
      </button>
    );
  },
);

LiquidGlassButton.displayName = 'LiquidGlassButton';
