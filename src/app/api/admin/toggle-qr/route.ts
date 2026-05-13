import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, type, showQr, qrVisibility } = await req.json();
    const normalizedVisibility = qrVisibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";

    if (type === "workshop") {
      await prisma.workshop.update({
        where: { id },
        data: { showQr, qrVisibility: normalizedVisibility },
      });
    } else {
      await prisma.event.update({
        where: { id },
        data: { showQr, qrVisibility: normalizedVisibility },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle QR Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
