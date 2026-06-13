interface BrandIllustrationProps {
  /** Optional custom image source — replace with your illustration file */
  imageSrc?: string;
  /** Optional className override */
  className?: string;
}

/**
 * Hero illustration component for the login page sidebar.
 * 
 * To use your own illustration:
 * <BrandIllustration imageSrc="/src/assets/images/hero.png" />
 * 
 * For now, renders an inline SVG illustration that can be
 * swapped out for an image file at any time.
 */
export default function BrandIllustration({ imageSrc, className = '' }: BrandIllustrationProps) {
  if (imageSrc) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src={imageSrc}
          alt="Dashboard Preview"
          className="w-full max-w-md h-auto rounded-2xl shadow-lg border border-gray-100"
        />
      </div>
    );
  }

  // Inline SVG illustration — a mockup dashboard graphic
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 500 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-lg h-auto"
      >
        {/* Background card */}
        <rect x="0" y="0" width="500" height="320" rx="16" fill="white" className="shadow-lg" />
        
        {/* Top bar */}
        <rect x="0" y="0" width="500" height="48" rx="16" fill="#f8fafc" />
        <rect x="0" y="24" width="500" height="24" fill="#f8fafc" />
        <circle cx="28" cy="24" r="10" fill="#0f5c3a" />
        <rect x="48" y="19" width="80" height="10" rx="4" fill="#1a7a4c" />
        <rect x="380" y="19" width="100" height="10" rx="4" fill="#e2e8f0" />
        
        {/* KPI Cards Row */}
        <rect x="20" y="64" width="105" height="60" rx="10" fill="#f0fdf4" />
        <rect x="30" y="74" width="16" height="16" rx="4" fill="#d1fae5" />
        <rect x="52" y="76" width="40" height="6" rx="3" fill="#6ee7b7" />
        <rect x="30" y="98" width="30" height="12" rx="3" fill="#0f5c3a" />
        
        <rect x="137" y="64" width="105" height="60" rx="10" fill="#f8fafc" />
        <rect x="147" y="74" width="16" height="16" rx="4" fill="#f1f5f9" />
        <rect x="169" y="76" width="40" height="6" rx="3" fill="#cbd5e1" />
        <rect x="147" y="98" width="35" height="12" rx="3" fill="#334155" />
        
        <rect x="254" y="64" width="105" height="60" rx="10" fill="#f8fafc" />
        <rect x="264" y="74" width="16" height="16" rx="4" fill="#f1f5f9" />
        <rect x="286" y="76" width="40" height="6" rx="3" fill="#cbd5e1" />
        <rect x="264" y="98" width="35" height="12" rx="3" fill="#334155" />
        
        <rect x="371" y="64" width="109" height="60" rx="10" fill="#fff1f2" />
        <rect x="381" y="74" width="16" height="16" rx="4" fill="#ffe4e6" />
        <rect x="403" y="76" width="40" height="6" rx="3" fill="#fda4af" />
        <rect x="381" y="98" width="35" height="12" rx="3" fill="#e11d48" />

        {/* Chart area */}
        <rect x="20" y="140" width="300" height="160" rx="12" fill="#fafafa" stroke="#f1f5f9" strokeWidth="1" />
        
        {/* Bar chart bars */}
        <rect x="40" y="230" width="24" height="50" rx="4" fill="#0f5c3a" opacity="0.8" />
        <rect x="72" y="200" width="24" height="80" rx="4" fill="#1a7a4c" opacity="0.7" />
        <rect x="104" y="180" width="24" height="100" rx="4" fill="#34d399" opacity="0.6" />
        <rect x="136" y="210" width="24" height="70" rx="4" fill="#6ee7b7" opacity="0.5" />
        <rect x="168" y="190" width="24" height="90" rx="4" fill="#0f5c3a" opacity="0.8" />
        <rect x="200" y="240" width="24" height="40" rx="4" fill="#1a7a4c" opacity="0.7" />
        <rect x="232" y="220" width="24" height="60" rx="4" fill="#34d399" opacity="0.6" />
        <rect x="264" y="170" width="24" height="110" rx="4" fill="#6ee7b7" opacity="0.5" />
        
        {/* X-axis labels */}
        <rect x="40" y="284" width="24" height="4" rx="2" fill="#e2e8f0" />
        <rect x="72" y="284" width="24" height="4" rx="2" fill="#e2e8f0" />
        <rect x="104" y="284" width="24" height="4" rx="2" fill="#e2e8f0" />
        <rect x="136" y="284" width="24" height="4" rx="2" fill="#e2e8f0" />
        <rect x="168" y="284" width="24" height="4" rx="2" fill="#e2e8f0" />
        <rect x="200" y="284" width="24" height="4" rx="2" fill="#e2e8f0" />
        <rect x="232" y="284" width="24" height="4" rx="2" fill="#e2e8f0" />
        <rect x="264" y="284" width="24" height="4" rx="2" fill="#e2e8f0" />

        {/* Side panel */}
        <rect x="336" y="140" width="144" height="160" rx="12" fill="#fafafa" stroke="#f1f5f9" strokeWidth="1" />
        
        {/* Legend items */}
        <circle cx="354" cy="162" r="5" fill="#0f5c3a" />
        <rect x="366" y="158" width="50" height="6" rx="3" fill="#cbd5e1" />
        <rect x="420" y="158" width="30" height="6" rx="3" fill="#94a3b8" />
        
        <circle cx="354" cy="182" r="5" fill="#34d399" />
        <rect x="366" y="178" width="50" height="6" rx="3" fill="#cbd5e1" />
        <rect x="420" y="178" width="30" height="6" rx="3" fill="#94a3b8" />
        
        <circle cx="354" cy="202" r="5" fill="#0f5c3a" />
        <rect x="366" y="198" width="50" height="6" rx="3" fill="#cbd5e1" />
        <rect x="420" y="198" width="30" height="6" rx="3" fill="#94a3b8" />

        {/* Donut chart */}
        <circle cx="408" cy="260" r="28" fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="408" cy="260" r="28" fill="none" stroke="#0f5c3a" strokeWidth="10" strokeDasharray="70 106" strokeDashoffset="0" />
        <circle cx="408" cy="260" r="28" fill="none" stroke="#34d399" strokeWidth="10" strokeDasharray="40 136" strokeDashoffset="-70" />
        <circle cx="408" cy="260" r="28" fill="none" stroke="#fda4af" strokeWidth="10" strokeDasharray="20 156" strokeDashoffset="-110" />
      </svg>
    </div>
  );
}
