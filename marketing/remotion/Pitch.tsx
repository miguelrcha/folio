import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import "./loadFonts";
import { Intro, INTRO_DURATION } from "./scenes/Intro";
import { Headline, HEADLINE_DURATION } from "./scenes/Headline";
import { Cta, CTA_DURATION } from "./scenes/Cta";
import { FeatureProfile, FEATURE_PROFILE_DURATION } from "./scenes/FeatureProfile";
import { FeatureResume, FEATURE_RESUME_DURATION } from "./scenes/FeatureResume";
import { FeatureSelection, FEATURE_SELECTION_DURATION } from "./scenes/FeatureSelection";
import { Outro, OUTRO_DURATION } from "./scenes/Outro";

export const PITCH_WIDTH = 1920;
export const PITCH_HEIGHT = 1080;
export const PITCH_FPS = 30;

const TRANSITION_FRAMES = 20;
const TRANSITION_COUNT = 6;

export const PITCH_DURATION_IN_FRAMES =
  INTRO_DURATION +
  HEADLINE_DURATION +
  CTA_DURATION +
  FEATURE_PROFILE_DURATION +
  FEATURE_RESUME_DURATION +
  FEATURE_SELECTION_DURATION +
  OUTRO_DURATION -
  TRANSITION_FRAMES * TRANSITION_COUNT;

// Heavily-damped spring = a smooth, silky crossfade with no bounce — the
// bounce lives in each scene's own element entrances instead, so the cut
// itself never fights the content for attention.
const crossfade = () => ({
  presentation: fade(),
  timing: springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES }),
});

export function Pitch() {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
        <Intro />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...crossfade()} />
      <TransitionSeries.Sequence durationInFrames={HEADLINE_DURATION}>
        <Headline />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...crossfade()} />
      <TransitionSeries.Sequence durationInFrames={CTA_DURATION}>
        <Cta />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...crossfade()} />
      <TransitionSeries.Sequence durationInFrames={FEATURE_PROFILE_DURATION}>
        <FeatureProfile />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...crossfade()} />
      <TransitionSeries.Sequence durationInFrames={FEATURE_RESUME_DURATION}>
        <FeatureResume />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...crossfade()} />
      <TransitionSeries.Sequence durationInFrames={FEATURE_SELECTION_DURATION}>
        <FeatureSelection />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition {...crossfade()} />
      <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
}
