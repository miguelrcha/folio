// Mirrors the design tokens in app/globals.css. Kept as plain constants (rather
// than importing the CSS) because Remotion bundles this project independently
// of the Next.js app.
export const colors = {
  ink: "#000000",
  surface: "#141414",
  surfaceRaised: "#1a1a1a",
  border: "#262626",
  borderBright: "#333333",
  text: "#ededed",
  textMuted: "#8c8c8c",
  textFaint: "#5c5c5c",
  accent: "#ffffff",
  greenCommit: "#4a7c4e",
  greenCommitBright: "#6fae74",
  greenCommitMid: "#3d6640",
  greenCommitDim: "#2d4a2f",
  amber: "#fcd34d",
};

export const fontFamily = {
  sans: "Inter, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};
