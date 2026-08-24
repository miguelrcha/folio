import { useCurrentFrame, interpolate } from "remotion";
import { Scene } from "../components/Scene";
import { GithubMark } from "../components/GithubMark";
import { useSpringPop } from "../useEnterExit";
import { colors } from "../theme";

export const CTA_DURATION = 120;

const USERNAME = "github.com/miguelrcha";

export function Cta() {
  const frame = useCurrentFrame();

  // Input box bounces in first.
  const boxPop = useSpringPop({ delay: 0, config: { damping: 12, mass: 0.6, stiffness: 190 } });
  const boxOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const boxY = interpolate(boxPop, [0, 1], [26, 0]);
  const boxScale = interpolate(boxPop, [0, 1], [0.92, 1]);

  // Typewriter effect over frames 10-55
  const typedChars = Math.floor(
    interpolate(frame, [10, 55], [0, USERNAME.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typedText = USERNAME.slice(0, typedChars);
  const showCaret = frame < 60 && Math.floor(frame / 8) % 2 === 0;

  // Button pops in with an overshoot once typing finishes.
  const buttonPop = useSpringPop({ delay: 58, config: { damping: 9, mass: 0.5, stiffness: 260 } });
  const buttonOpacity = interpolate(frame, [58, 66], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buttonScale = interpolate(buttonPop, [0, 1], [0.4, 1]);

  const overallExit = interpolate(frame, [CTA_DURATION - 15, CTA_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Scene glow>
      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "stretch",
          opacity: overallExit,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderRadius: 16,
            border: `1.5px solid ${colors.borderBright}`,
            background: colors.surface,
            padding: "26px 32px",
            width: 620,
            opacity: boxOpacity,
            transform: `translateY(${boxY}px) scale(${boxScale})`,
          }}
        >
          <GithubMark size={26} color={colors.textFaint} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 28,
              color: colors.text,
            }}
          >
            {typedText}
            <span style={{ opacity: showCaret ? 1 : 0 }}>|</span>
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            background: colors.text,
            color: colors.ink,
            fontSize: 26,
            fontWeight: 600,
            padding: "0 40px",
            whiteSpace: "nowrap",
            opacity: buttonOpacity,
            transform: `scale(${buttonScale})`,
          }}
        >
          View Profile on Folio
        </div>
      </div>
    </Scene>
  );
}
