import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { email, eventId, workshopId } = await req.json();

    if (!email || (!eventId && !workshopId)) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "User not found with this email" }, { status: 404 });
    }

    // Check if already registered
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        userId: user.id,
        ...(eventId ? { eventId } : { workshopId }),
      },
    });

    if (existingRegistration) {
      return NextResponse.json({ message: "User is already registered" }, { status: 400 });
    }

    const registration = await prisma.registration.create({
      data: {
        userId: user.id,
        eventId: eventId || null,
        workshopId: workshopId || null,
        status: "REGISTERED",
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const eventId = url.searchParams.get("eventId");
    const workshopId = url.searchParams.get("workshopId");

    if (!userId || (!eventId && !workshopId)) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Delete attendance records first (foreign key constraints)
    await prisma.attendance.deleteMany({
      where: {
        userId,
        ...(eventId ? { eventId } : { workshopId }),
      },
    });

    // Delete registration
    await prisma.registration.deleteMany({
      where: {
        userId,
        ...(eventId ? { eventId } : { workshopId }),
      },
    });

    return NextResponse.json({ message: "Registration deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
