import { interpolate } from "remotion";
import { useEnterExit, useSpringPop } from "../useEnterExit";
import { Scene } from "../components/Scene";
import { colors } from "../theme";

export const HEADLINE_DURATION = 120;

export function Headline() {
  const { frame, opacity, translateY, scale } = useEnterExit({ durationInFrames: HEADLINE_DURATION });

  // Subline bounces in on its own beat, slightly after the headline lands.
  const sublinePop = useSpringPop({ delay: 10 });
  const sublineOpacity =
    interpolate(frame, [10, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(frame, [HEADLINE_DURATION - 15, HEADLINE_DURATION], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const sublineY = interpolate(sublinePop, [0, 1], [18, 0]);

  return (
    <Scene glow>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: 1400,
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
        }}
      >
        <h1
          style={{
            fontSize: 84,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            color: colors.text,
            margin: 0,
          }}
        >
          Build your GitHub portfolio
          <br />
          in minutes
        </h1>
        <p
          style={{
            marginTop: 36,
            fontSize: 32,
            color: colors.textMuted,
            lineHeight: 1.5,
            opacity: sublineOpacity,
            transform: `translateY(${sublineY}px)`,
          }}
        >
          Connect your GitHub. Get a professional resume —
          <br />
          always up-to-date, ready to send.
        </p>
      </div>
    </Scene>
  );
}
