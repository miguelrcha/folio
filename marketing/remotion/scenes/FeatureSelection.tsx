import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Scene } from "../components/Scene";
import { FeatureLayout } from "../components/FeatureLayout";
import { colors } from "../theme";

export const FEATURE_SELECTION_DURATION = 170;

const ROWS = [
  { name: "flowqueue", impact: 94, selected: true },
  { name: "api-gateway-lite", impact: 81, selected: true },
  { name: "dotfiles", impact: 15, selected: false },
];

export function FeatureSelection() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneOpacity = interpolate(
    frame,
    [0, 15, FEATURE_SELECTION_DURATION - 15, FEATURE_SELECTION_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <Scene>
      <div style={{ opacity: sceneOpacity }}>
        <FeatureLayout
          eyebrow="03 — automatic selection"
          title="Your best work, surfaced"
          description="Projects with the most stars and recent activity come pre-selected. Adjust if you want — most people don't have to."
        >
          <div
            style={{
              fontSize: 18,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              paddingBottom: 14,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            Select your projects
          </div>
          {ROWS.map((r, i) => {
            const rowStart = 24 + i * 13;
            const rowPop = spring({
              frame: frame - rowStart,
              fps,
              config: { damping: 12, mass: 0.6, stiffness: 210 },
            });
            const rowOpacity = interpolate(rowPop, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });

            const checkPop = spring({
              frame: frame - (rowStart + 8),
              fps,
              config: { damping: 8, mass: 0.5, stiffness: 280 },
            });
            const checkScale = interpolate(checkPop, [0, 1], [0, 1]);

            return (
              <div
                key={r.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 0",
                  borderBottom: `1px solid ${colors.border}`,
                  opacity: rowOpacity,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: r.selected ? "none" : `1.5px solid ${colors.borderBright}`,
                      background: r.selected ? colors.text : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {r.selected && (
                      <span
                        style={{
                          fontSize: 15,
                          color: colors.ink,
                          fontWeight: 700,
                          display: "inline-block",
                          transform: `scale(${checkScale})`,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <span
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: colors.text }}
                  >
                    {r.name}
                  </span>
                </div>
                <span
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: colors.amber }}
                >
                  impact {r.impact}
                </span>
              </div>
            );
          })}
        </FeatureLayout>
      </div>
    </Scene>
  );
}
