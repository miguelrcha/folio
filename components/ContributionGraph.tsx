"use client";

import { useEffect, useState } from "react";
import type { ContributionDay } from "@/lib/mock-data";

const intensityColor = (count: number) => {
  switch (count) {
    case 0:
      return "var(--color-surface-raised)";
    case 1:
      return "#2d4a2f";
    case 2:
      return "#3d6640";
    case 3:
      return "var(--color-green-commit)";
    default:
      return "var(--color-green-commit-bright)";
  }
};

/**
 * Grid de contribuições. Três modos:
 * - "skeleton": células vazias pulsando (tela de login, antes de conectar)
 * - "building": células preenchem em cascata (tela de loading/análise)
 * - "static": estado final (tela de perfil)
 */
export function ContributionGraph({
  data,
  mode = "static",
  cell = 10,
  gap = 3,
}: {
  data: ContributionDay[];
  mode?: "skeleton" | "building" | "static";
  cell?: number;
  gap?: number;
}) {
  const weeks = Math.ceil(data.length / 7);
  const [revealedWeeks, setRevealedWeeks] = useState(mode === "building" ? 0 : weeks);

  useEffect(() => {
    if (mode !== "building") return;
    setRevealedWeeks(0);
    const id = setInterval(() => {
      setRevealedWeeks((w) => {
        if (w >= weeks) {
          clearInterval(id);
          return w;
        }
        return w + 1;
      });
    }, 18);
    return () => clearInterval(id);
  }, [mode, weeks]);

  const width = weeks * (cell + gap);
  const height = 7 * (cell + gap);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="GitHub contribution graph"
    >
      {Array.from({ length: weeks }, (_, w) => {
        const isRevealed = mode !== "building" || w < revealedWeeks;
        return Array.from({ length: 7 }, (_, d) => {
          const idx = w * 7 + d;
          const day = data[idx];
          if (!day) return null;
          const x = w * (cell + gap);
          const y = d * (cell + gap);
          if (mode === "skeleton") {
            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={cell}
                height={cell}
                rx={2}
                fill="var(--color-surface-raised)"
                className="animate-pulse"
                style={{ animationDelay: `${(w + d) * 20}ms` }}
              />
            );
          }
          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={2}
              fill={isRevealed ? intensityColor(day.count) : "var(--color-surface-raised)"}
              style={{
                transition: "fill 400ms ease, opacity 400ms ease",
                opacity: isRevealed ? 1 : 0.4,
              }}
            />
          );
        });
      })}
    </svg>
  );
}
