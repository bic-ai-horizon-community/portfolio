import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";

export const alt = "AI Horizon Event";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  const title = event?.title || "Event";
  const description = event?.description?.substring(0, 100) || "";

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
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)",
          position: "relative",
          overflow: "hidden",
          padding: "60px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            zIndex: 1,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#818cf8",
              textTransform: "uppercase",
              letterSpacing: "3px",
              display: "flex",
            }}
          >
            AI Horizon Event
          </div>
          <div
            style={{
              fontSize: title.length > 40 ? "48px" : "56px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-1px",
              lineHeight: 1.2,
              maxWidth: "900px",
              display: "flex",
              textAlign: "center",
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: "18px",
                color: "rgba(255,255,255,0.5)",
                marginTop: "8px",
                maxWidth: "700px",
                display: "flex",
                textAlign: "center",
              }}
            >
              {description}
            </div>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
