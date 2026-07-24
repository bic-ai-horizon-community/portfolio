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
    const workshop = await prisma.workshop.findUnique({
      where: { id },
    });

    if (!workshop) {
      return NextResponse.json({ message: "Workshop not found" }, { status: 404 });
    }

    const result = await syncDedicatedRegistrations({
      targetId: workshop.id,
      targetType: "workshop",
      title: workshop.title,
      organizedById: workshop.organizedById,
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
