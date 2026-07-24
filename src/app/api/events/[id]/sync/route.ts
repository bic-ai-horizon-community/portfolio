import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncDedicatedRegistrations } from "@/lib/firebase-sync";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const result = await syncDedicatedRegistrations({
      targetId: event.id,
      targetType: "event",
      title: event.title,
      organizedById: event.organizedById,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Firebase sync error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to sync dedicated registrations" },
      { status: 500 }
    );
  }
}
