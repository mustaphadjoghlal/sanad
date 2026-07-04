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
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {children}
    </div>
  );
}
