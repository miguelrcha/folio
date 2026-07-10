import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Scene } from "../components/Scene";
import { FeatureLayout } from "../components/FeatureLayout";
import { colors } from "../theme";

export const FEATURE_PROFILE_DURATION = 170;

const ROWS = [
  { name: "flowqueue", impact: 94, stars: 842 },
  { name: "api-gateway-lite", impact: 81, stars: 401 },
  { name: "obs-tracer", impact: 73, stars: 205 },
];

export function FeatureProfile() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneOpacity = interpolate(
    frame,
    [0, 15, FEATURE_PROFILE_DURATION - 15, FEATURE_PROFILE_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <Scene>
      <div style={{ opacity: sceneOpacity }}>
        <FeatureLayout
          eyebrow="01 — public profile"
          title="A page that's always accurate"
          description="folio.dev/you — bio, real stack, and projects ranked by impact. Pulled straight from GitHub, no manual upkeep."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 70px",
              fontSize: 18,
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              paddingBottom: 14,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <span>Repository</span>
            <span>Impact</span>
            <span style={{ textAlign: "right" }}>★</span>
          </div>
          {ROWS.map((r, i) => {
            const rowStart = 26 + i * 11;
            const pop = spring({
              frame: frame - rowStart,
              fps,
              config: { damping: 12, mass: 0.6, stiffness: 210 },
            });
            const rowOpacity = interpolate(pop, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
            const rowX = interpolate(pop, [0, 1], [30, 0]);
            return (
              <div
                key={r.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 70px",
                  padding: "18px 0",
                  borderBottom: `1px solid ${colors.border}`,
                  opacity: rowOpacity,
                  transform: `translateX(${rowX}px)`,
                }}
              >
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: colors.text }}>
                  {r.name}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: colors.amber }}>
                  {r.impact}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 20,
                    color: colors.textMuted,
                    textAlign: "right",
                  }}
                >
                  {r.stars}
                </span>
              </div>
            );
          })}
        </FeatureLayout>
      </div>
    </Scene>
  );
}
