import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Official Saathy Logo Component
 * Green rounded square with flowing white S and accent elements
 */
export function Logo({ className, withWordmark = true, size = 28 }: { className?: string; withWordmark?: boolean; size?: number }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Official Saathy Logo SVG */}
      <svg width={size} height={size} viewBox="0 0 256 256" className="flex-shrink-0">
        {/* Background rounded square - Forest Green */}
        <rect x="16" y="16" width="224" height="224" rx="56" fill="#2D5F52" />
        
        {/* Flowing White S Curve */}
        <path
          d="M 168 72 C 168 72, 120 72, 104 88 C 88 104, 88 128, 104 144 C 120 160, 144 152, 144 152 C 160 148, 168 160, 168 176 C 168 192, 152 208, 120 208 C 88 208, 72 184, 72 160"
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
      
      {withWordmark && (
        <span className="font-serif text-lg tracking-tight text-[hsl(var(--brand-forest))]">Saathy</span>
      )}
    </div>
  );
}

/** Mascot slot — drop /public/brand/mascot.png to override. */
export function Mascot({ className }: { className?: string }) {
  const [imgOk, setImgOk] = useState(true);
  if (!imgOk) return null;
  return (
    <img
      src="/brand/mascot.png"
      alt=""
      aria-hidden
      className={cn("object-contain", className)}
      onError={() => setImgOk(false)}
    />
  );
}
