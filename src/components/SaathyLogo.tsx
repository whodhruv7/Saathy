interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const SaathyLogo = ({ size = 'md', showText = true, className }: Props) => {
  const sizeMap = { sm: 28, md: 36, lg: 48, xl: 64 };
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className || ''}`}>
      {/* Official Saathy Logo - Green rounded square with flowing S */}
      <svg width={s} height={s} viewBox="0 0 256 256" className="flex-shrink-0">
        {/* Background rounded square - Forest Green */}
        <rect 
          x="16" 
          y="16" 
          width="224" 
          height="224" 
          rx="56" 
          fill="#2D5F52"
        />
        
        {/* Flowing White S Curve */}
        <path
          d="M 168 72 
             C 168 72, 120 72, 104 88
             C 88 104, 88 128, 104 144
             C 120 160, 144 152, 144 152
             C 160 148, 168 160, 168 176
             C 168 192, 152 208, 120 208
             C 88 208, 72 184, 72 160"
          stroke="white"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Accent dot - upper right */}
        <circle cx="196" cy="72" r="10" fill="white" opacity="0.5" />
        
        {/* Small sparkle */}
        <path
          d="M 200 120 L 204 128 L 212 132 L 204 136 L 200 144 L 196 136 L 188 132 L 196 128 Z"
          fill="white"
          opacity="0.4"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="font-serif font-bold text-foreground leading-tight">Saathy</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Argument Architecture</span>
        </div>
      )}
    </div>
  );
};
