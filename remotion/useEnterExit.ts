import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";

// Bouncy entrance (spring, slight overshoot) + smooth fade-out exit. All scenes
// live inside <TransitionSeries.Sequence>, so `frame` is local to the scene.
export function useEnterExit({
  durationInFrames,
  exitFrames = 15,
  rise = 34,
  delay = 0,
  springConfig = { damping: 13, mass: 0.6, stiffness: 170 },
}: {
  durationInFrames: number;
  exitFrames?: number;
  rise?: number;
  delay?: number;
  springConfig?: { damping?: number; mass?: number; stiffness?: number };
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({
    frame: frame - delay,
    fps,
    config: springConfig,
  });

  const opacity =
    interpolate(frame, [delay, delay + 12], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [durationInFrames - exitFrames, durationInFrames], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });

  const translateY = interpolate(bounce, [0, 1], [rise, 0]);
  const scale = interpolate(bounce, [0, 1], [0.88, 1]);

  return { frame, opacity, translateY, scale };
}

// Standalone spring pop (0 -> 1, with overshoot) for staggered rows/icons/buttons.
export function useSpringPop({
  delay = 0,
  config = { damping: 11, mass: 0.5, stiffness: 200 },
}: {
  delay?: number;
  config?: { damping?: number; mass?: number; stiffness?: number };
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
}
