import { staticFile, Img } from "remotion";
import { colors } from "../theme";

export function Wordmark({ size = 56 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.28, userSelect: "none" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Img
          src={staticFile("logo.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.5)" }}
        />
      </div>
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: size * 0.72,
          letterSpacing: "-0.02em",
          color: colors.text,
        }}
      >
        folio
      </span>
    </div>
  );
}
