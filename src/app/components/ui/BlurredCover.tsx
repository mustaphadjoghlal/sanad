import React from "react";

import type { CSSProperties } from "react";

interface BlurredCoverProps {
  src: string;
  alt: string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export default function BlurredCover({ src, alt, height = 200, className = "", style, children }: BlurredCoverProps) {
  return (
    <div
      className={className}
      style={{ height, position: "relative", overflow: "hidden", background: "#080b08", flexShrink: 0, ...style }}
    >
      {/* Blurred fill */}
      <img
        src={src}
        alt=""
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          filter: "blur(22px) brightness(0.55)",
          transform: "scale(1.12)",
          pointerEvents: "none",
        }}
      />
      {/* Main image — original aspect ratio */}
      <img
        src={src}
        alt={alt}
        style={{
          position: "relative", zIndex: 1,
          width: "100%", height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
      {/* Overlays (badges, labels…) */}
      {children}
    </div>
  );
}
