import React from "react";

interface BarcodeSVGProps {
  value: string;
  width?: number;
  height?: number;
  className?: string;
  showText?: boolean;
}

// Crisp deterministic SVG 1D Barcode Generator (Code 128 style)
export default function BarcodeSVG({
  value,
  width = 200,
  height = 50,
  className = "",
  showText = true,
}: BarcodeSVGProps) {
  // Generate deterministic bar widths based on ASCII char codes
  const bars: { width: number; space: number }[] = [];
  
  // Guard start pattern
  bars.push({ width: 2, space: 1 });
  bars.push({ width: 1, space: 2 });

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const s1 = ((code >> 1) % 2) + 1;
    const b2 = ((code >> 2) % 3) + 1;
    const s2 = ((code >> 3) % 2) + 1;
    bars.push({ width: b1, space: s1 });
    bars.push({ width: b2, space: s2 });
  }

  // Guard stop pattern
  bars.push({ width: 2, space: 1 });
  bars.push({ width: 3, space: 0 });

  let totalUnits = 0;
  bars.forEach(b => { totalUnits += b.width + b.space; });

  const scale = width / Math.max(1, totalUnits);
  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {bars.map((bar, idx) => {
          const barW = bar.width * scale;
          const x = currentX;
          currentX += (bar.width + bar.space) * scale;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={barW}
              height={height}
              fill="#0f172a"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono font-bold text-xs tracking-widest text-slate-800 mt-1">
          {value}
        </span>
      )}
    </div>
  );
}
