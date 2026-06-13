import { BarChart3 } from 'lucide-react';

interface BrandLogoProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show text alongside icon */
  showText?: boolean;
  /** Optional className override */
  className?: string;
  /** Optional custom image source — set this to use an actual image file instead of the SVG icon */
  imageSrc?: string;
}

const sizeMap = {
  sm: { icon: 'w-8 h-8', iconInner: 'w-4 h-4', text: 'text-sm', subtext: 'text-[9px]' },
  md: { icon: 'w-10 h-10', iconInner: 'w-5 h-5', text: 'text-base', subtext: 'text-[10px]' },
  lg: { icon: 'w-14 h-14', iconInner: 'w-7 h-7', text: 'text-xl', subtext: 'text-xs' },
};

export default function BrandLogo({ size = 'md', showText = true, className = '', imageSrc }: BrandLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon / Image */}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Brand Logo"
          className={`${s.icon} rounded-xl object-contain`}
        />
      ) : (
        <div className={`${s.icon} gradient-primary rounded-xl flex items-center justify-center shadow-sm`}>
          <BarChart3 className={`${s.iconInner} text-white`} />
        </div>
      )}

      {/* Text */}
      {showText && (
        <div className="leading-none">
          <span className={`font-bold text-gray-950 tracking-tight block ${s.text}`}>AttendEase</span>
          <span className={`${s.subtext} text-gray-400 font-semibold mt-0.5 block`}>Resource Planning</span>
        </div>
      )}
    </div>
  );
}

/**
 * Minimal icon-only brand mark — useful for favicon, mobile header, etc.
 */
export function BrandMark({ size = 'md', imageSrc }: { size?: 'sm' | 'md' | 'lg'; imageSrc?: string }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };
  const innerSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt="Brand"
        className={`${sizeMap[size]} rounded-xl object-contain`}
      />
    );
  }

  return (
    <div className={`${sizeMap[size]} gradient-primary rounded-xl flex items-center justify-center shadow-sm`}>
      <BarChart3 className={`${innerSizeMap[size]} text-white`} />
    </div>
  );
}
