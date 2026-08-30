import React from "react";

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
}

// Lightweight deterministic QR matrix generator for UI simulation
export default function QRCodeSVG({ value, size = 180, className = "" }: QRCodeSVGProps) {
  // Generate a pseudo-random yet deterministic 21x21 QR code matrix based on value hash
  const gridSize = 21;
  const matrix: boolean[][] = Array(gridSize).fill(false).map(() => Array(gridSize).fill(false));

  // 1. Draw Position Detection Patterns (Corners)
  const drawCorner = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer box
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner box
        ) {
          matrix[row + r][col + c] = true;
        }
      }
    }
  };

  drawCorner(0, 0);                 // Top-Left
  drawCorner(0, gridSize - 7);       // Top-Right
  drawCorner(gridSize - 7, 0);       // Bottom-Left

  // 2. Timing Patterns
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Fill Data Payload based on hash of string
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip corner finder patterns
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= gridSize - 8) ||
        (r >= gridSize - 8 && c < 8) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      const pseudo = Math.sin(hash * (r * gridSize + c + 1)) * 10000;
      matrix[r][c] = (pseudo - Math.floor(pseudo)) > 0.45;
    }
  }

  const cellSize = size / gridSize;

  return (
    <div className={`inline-block p-2 bg-white rounded-xl shadow-inner border border-slate-200 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.5}
                height={cellSize + 0.5}
                fill="#0f172a"
                rx={cellSize * 0.15}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
