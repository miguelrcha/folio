import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../theme";

type Day = { count: 0 | 1 | 2 | 3 | 4 };

// Deterministic pseudo-random contribution pattern (no external data —
// this only needs to *look* like a real GitHub graph).
function generateData(weeks: number): Day[] {
  const days: Day[] = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const seed = Math.sin(w * 12.9898 + d * 78.233) * 43758.5453;
      const noise = seed - Math.floor(seed);
      const isWeekend = d === 0 || d === 6;
      const bias = isWeekend ? 0.5 : 1;
      const value = noise * bias;
      const count = value > 0.82 ? 4 : value > 0.65 ? 3 : value > 0.45 ? 2 : value > 0.25 ? 1 : 0;
      days.push({ count: count as Day["count"] });
    }
  }
  return days;
}

const intensityColor = (count: number) => {
  switch (count) {
    case 0:
      return colors.surfaceRaised;
    case 1:
      return colors.greenCommitDim;
    case 2:
      return colors.greenCommitMid;
    case 3:
      return colors.greenCommit;
    default:
      return colors.greenCommitBright;
  }
};

// Frame-driven equivalent of components/ContributionGraph.tsx's "building"
// mode: weeks cascade in left-to-right instead of relying on setInterval,
// since Remotion needs the render to be a pure function of `frame`.
export function ContributionGraph({
  weeks = 30,
  cell = 12,
  gap = 4,
  buildDurationInFrames = 45,
  startFrame = 0,
}: {
  weeks?: number;
  cell?: number;
  gap?: number;
  buildDurationInFrames?: number;
  startFrame?: number;
}) {
  const frame = useCurrentFrame();
  const data = generateData(weeks);
  const localFrame = Math.max(0, frame - startFrame);

  const revealedWeeks = interpolate(localFrame, [0, buildDurationInFrames], [0, weeks], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const width = weeks * (cell + gap);
  const height = 7 * (cell + gap);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {Array.from({ length: weeks }, (_, w) => {
        const isRevealed = w < revealedWeeks;
        const weekProgress = Math.min(1, Math.max(0, revealedWeeks - w));
        return Array.from({ length: 7 }, (_, d) => {
          const idx = w * 7 + d;
          const day = data[idx];
          const x = w * (cell + gap);
          const y = d * (cell + gap);
          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={2.5}
              fill={isRevealed ? intensityColor(day.count) : colors.surfaceRaised}
              opacity={isRevealed ? weekProgress : 0.35}
            />
          );
        });
      })}
    </svg>
  );
}
