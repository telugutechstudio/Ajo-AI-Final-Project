import React from 'react';

export const AjoAiLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 300 100" 
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="ajo-ai-logo-title"
    >
      <title id="ajo-ai-logo-title">Ajo AI Technologies Logo</title>
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
        </linearGradient>
         <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 0.8 }} />
        </linearGradient>
      </defs>
      
      {/* Icon */}
      <g transform="translate(50, 50)">
        <circle cx="0" cy="0" r="45" fill="none" stroke="url(#iconGradient)" strokeWidth="2" opacity="0.5"/>
        <circle cx="0" cy="0" r="20" fill="url(#iconGradient)" />

        {[0, 60, 120, 180, 240, 300].map(angle => (
          <g key={angle} transform={`rotate(${angle})`}>
            <line x1="0" y1="0" x2="32" y2="0" stroke="url(#iconGradient)" strokeWidth="1.5" opacity="0.6" />
            <circle cx="35" cy="0" r="6" fill="url(#iconGradient)" />
          </g>
        ))}
      </g>
      
      {/* Text */}
      <text x="115" y="45" fontFamily="Inter, sans-serif" fontSize="36" fontWeight="bold" fill="#E2E8F0">Ajo</text>
      <text x="185" y="45" fontFamily="Inter, sans-serif" fontSize="36" fontWeight="bold" fill="url(#textGradient)">AI</text>
      <text x="118" y="70" fontFamily="Inter, sans-serif" fontSize="16" letterSpacing="2" fill="#A0AEC0">TECHNOLOGIES</text>
      <rect x="118" y="80" width="150" height="3" fill="url(#lineGradient)" />

    </svg>
  );
};
