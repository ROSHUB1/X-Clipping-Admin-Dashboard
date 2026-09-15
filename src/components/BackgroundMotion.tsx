import React from 'react';

interface BackgroundMotionProps {
  className?: string;
}

export const BackgroundMotion: React.FC<BackgroundMotionProps> = ({ className = '' }) => {
  return (
    <div
      id="bg-ambient-layer"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* User-Provided Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed transform scale-[1.02] transition-transform duration-1000"
        style={{
          backgroundImage: `url('/background.png')`,
        }}
      />

      {/* Sophisticated Dark Tint Overlay for High Text Readability & Professional SaaS Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f19]/80 via-[#0b0f19]/75 to-[#0b0f19]/90" />

      {/* Subtle Ambient Depth Lighting */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-slate-950/40 to-transparent pointer-events-none" />

      {/* Very faint structural grid texture overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"
      />
    </div>
  );
};

