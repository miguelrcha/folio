import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Scene } from "../components/Scene";
import { FeatureLayout } from "../components/FeatureLayout";
import { colors } from "../theme";

export const FEATURE_RESUME_DURATION = 170;

function Bar({ width, delay }: { width: string; delay: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.5, stiffness: 220 } });
  return (
    <div
      style={{
        height: 10,
        width,
        borderRadius: 6,
        background: colors.borderBright,
        transformOrigin: "left",
        transform: `scaleX(${pop})`,
      }}
    />
  );
}

export function FeatureResume() {
  const frame = useCurrentFrame();
  const sceneOpacity = interpolate(
    frame,
    [0, 15, FEATURE_RESUME_DURATION - 15, FEATURE_RESUME_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <Scene>
      <div style={{ opacity: sceneOpacity }}>
        <FeatureLayout
          eyebrow="02 — PDF resume"
          title="One click, ready to send"
          description="The same profile becomes a polished PDF resume — your GitHub photo, bio, and top projects, formatted to fit one page."
        >
          <div
            style={{
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              background: "rgba(0,0,0,0.25)",
              padding: 28,
            }}
          >
            <p style={{ fontSize: 24, fontWeight: 600, color: colors.text, margin: 0 }}>
              Marina Costa
            </p>
            <p style={{ fontSize: 16, color: colors.textFaint, margin: "6px 0 0" }}>
              github.com/marinacosta · folio.dev/marinacosta
            </p>

            <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <p
                style={{
                  fontSize: 15,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                Overview
              </p>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <Bar width="100%" delay={24} />
                <Bar width="82%" delay={30} />
              </div>
            </div>

            <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <p
                style={{
                  fontSize: 15,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                Projects
              </p>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <Bar width="100%" delay={38} />
                <Bar width="63%" delay={44} />
              </div>
            </div>
          </div>
        </FeatureLayout>
      </div>
    </Scene>
  );
}
