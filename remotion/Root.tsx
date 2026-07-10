import { Composition } from "remotion";
import { Pitch, PITCH_FPS, PITCH_HEIGHT, PITCH_WIDTH, PITCH_DURATION_IN_FRAMES } from "./Pitch";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Pitch"
      component={Pitch}
      durationInFrames={PITCH_DURATION_IN_FRAMES}
      fps={PITCH_FPS}
      width={PITCH_WIDTH}
      height={PITCH_HEIGHT}
    />
  );
};
