import { interpolate } from "remotion";
import { useSpringPop } from "../useEnterExit";
import { colors } from "../theme";

export function FeatureLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  // Text column slides in from the left, card column pops in from the right —
  // staggered so the eye lands on the copy first, then the proof.
  const textPop = useSpringPop({ delay: 4, config: { damping: 13, mass: 0.6, stiffness: 180 } });
  const textX = interpolate(textPop, [0, 1], [-50, 0]);
  const textOpacity = interpolate(textPop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  const cardPop = useSpringPop({ delay: 12, config: { damping: 11, mass: 0.7, stiffness: 170 } });
  const cardX = interpolate(cardPop, [0, 1], [60, 0]);
  const cardScale = interpolate(cardPop, [0, 1], [0.9, 1]);
  const cardOpacity = interpolate(cardPop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 100, maxWidth: 1500 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: 560,
          opacity: textOpacity,
          transform: `translateX(${textX}px)`,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 20,
            color: colors.greenCommitBright,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </span>
        <h2
          style={{
            fontSize: 60,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: colors.text,
            margin: 0,
          }}
        >
          {title}
        </h2>
        <p style={{ fontSize: 27, lineHeight: 1.55, color: colors.textMuted, margin: 0 }}>
          {description}
        </p>
      </div>
      <div
        style={{
          width: 620,
          borderRadius: 24,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          padding: 36,
          opacity: cardOpacity,
          transform: `translateX(${cardX}px) scale(${cardScale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
