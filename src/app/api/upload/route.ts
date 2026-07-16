import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import heicConvert from "heic-convert";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Convert HEIC/HEIF to JPEG
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (isHeic) {
      const converted = await heicConvert({
        buffer,
        format: "JPEG",
        quality: 0.9,
      });

      buffer = Buffer.from(converted);
    }

    const result = (await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "ai-horizon",
            resource_type: "image",
            format: isHeic ? "jpg" : undefined,
        },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    })) as any;

    return NextResponse.json({
      url: result.secure_url,
      type: result.resource_type,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500 }
    );
  }
}