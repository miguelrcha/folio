import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: interFontFamily } = loadInter("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
export const { fontFamily: jetBrainsMonoFontFamily } = loadJetBrainsMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});
