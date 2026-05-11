import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id: workshopId } = await params;
    const { userId } = await req.json();

    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) return NextResponse.json({ message: "Workshop not found" }, { status: 404 });

    if (workshop.status !== "ONGOING") {
      return NextResponse.json({ message: "Attendance can only be marked during ongoing workshops" }, { status: 400 });
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        workshopId,
        verifiedById: (session.user as any).id,
      },
    });

    // Also update registration status
    await prisma.registration.update({
      where: { userId_workshopId: { userId, workshopId } },
      data: { status: "ATTENDED" },
    }).catch(() => { /* User might not have registered but attended, that's fine for some cases */ });

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id: workshopId } = await params;
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }

    await prisma.attendance.deleteMany({
      where: { userId, workshopId },
    });

    // Optionally revert registration status to REGISTERED
    await prisma.registration.updateMany({
      where: { userId, workshopId },
      data: { status: "REGISTERED" },
    });

    return NextResponse.json({ message: "Attendance removed" });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

