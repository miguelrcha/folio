import { interpolate } from "remotion";
import { useEnterExit, useSpringPop } from "../useEnterExit";
import { Scene } from "../components/Scene";
import { Wordmark } from "../components/Wordmark";
import { colors } from "../theme";

export const OUTRO_DURATION = 165;

function useStaggeredItem(frame: number, delay: number, exitFrom: number) {
  const pop = useSpringPop({ delay });
  const opacity =
    interpolate(frame, [delay, delay + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [exitFrom, exitFrom + 20], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const translateY = interpolate(pop, [0, 1], [22, 0]);
  const scale = interpolate(pop, [0, 1], [0.85, 1]);
  return { opacity, translateY, scale };
}

export function Outro() {
  const { frame } = useEnterExit({ durationInFrames: OUTRO_DURATION, exitFrames: 20 });
  const exitFrom = OUTRO_DURATION - 20;

  const wordmark = useStaggeredItem(frame, 0, exitFrom);
  const title = useStaggeredItem(frame, 8, exitFrom);
  const tagline = useStaggeredItem(frame, 18, exitFrom);

  return (
    <Scene glow>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <div
          style={{
            opacity: wordmark.opacity,
            transform: `translateY(${wordmark.translateY}px) scale(${wordmark.scale})`,
          }}
        >
          <Wordmark size={56} />
        </div>
        <h2
          style={{
            fontSize: 76,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: colors.text,
            margin: 0,
            textAlign: "center",
            opacity: title.opacity,
            transform: `translateY(${title.translateY}px) scale(${title.scale})`,
          }}
        >
          folio.dev/{"{"}you{"}"}
        </h2>
        <p
          style={{
            fontSize: 28,
            color: colors.textMuted,
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
            opacity: tagline.opacity,
            transform: `translateY(${tagline.translateY}px)`,
          }}
        >
          always up to date · zero manual work
        </p>
      </div>
    </Scene>
  );
}
