import { ImageResponse } from "next/og";

// PNG app icon (iOS home screen, Safari, and any browser that prefers raster icons)
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #1C2740 0%, #0B1220 100%)",
        }}
      >
        <svg width="118" height="118" viewBox="0 0 64 64">
          <path d="M32 9 9.5 53 32 42.6 54.5 53 32 9Z" fill="#FFFFFF" />
          <path d="M32 9v33.6" stroke="#3B6CF0" strokeWidth="4.2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size
  );
}
