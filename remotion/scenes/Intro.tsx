import { useCurrentFrame, interpolate } from "remotion";
import { Scene } from "../components/Scene";
import { ContributionGraph } from "../components/ContributionGraph";
import { Wordmark } from "../components/Wordmark";
import { useSpringPop } from "../useEnterExit";
import { colors } from "../theme";

export const INTRO_DURATION = 105;

export function Intro() {
  const frame = useCurrentFrame();

  const wordmarkPop = useSpringPop({ delay: 55, config: { damping: 10, mass: 0.6, stiffness: 220 } });
  const wordmarkOpacity = interpolate(frame, [55, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wordmarkScale = interpolate(wordmarkPop, [0, 1], [0.6, 1]);

  const captionOpacity = interpolate(frame, [66, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const graphOpacity = interpolate(frame, [70, 90], [1, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Scene glow>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 64,
          opacity: graphOpacity,
        }}
      >
        <ContributionGraph weeks={34} cell={13} gap={4.5} buildDurationInFrames={55} />
        <div
          style={{
            opacity: wordmarkOpacity,
            transform: `scale(${wordmarkScale})`,
          }}
        >
          <Wordmark size={64} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 90,
          fontSize: 22,
          color: colors.textFaint,
          fontFamily: "'JetBrains Mono', monospace",
          opacity: captionOpacity,
        }}
      >
        your GitHub, turned into a portfolio
      </div>
    </Scene>
  );
}
