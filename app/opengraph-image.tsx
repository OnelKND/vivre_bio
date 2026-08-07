import { ImageResponse } from "next/og";

export const alt = "VIVRE BIO — Le meilleur de la nature pour vous";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "#2E7D32",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              fontSize: 56,
            }}
          >
            🌿
          </div>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>
            VIVRE <span style={{ color: "#E31E24", marginLeft: 20 }}>BIO</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "rgba(255,255,255,0.85)" }}>
          Le meilleur de la nature pour vous
        </div>
      </div>
    ),
    { ...size }
  );
}
