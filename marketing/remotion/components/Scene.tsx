import { AbsoluteFill } from "remotion";
import { colors } from "../theme";

export function Scene({
  children,
  glow = false,
}: {
  children: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      {glow && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 1600,
            height: 900,
            background:
              "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 35%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
      )}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
