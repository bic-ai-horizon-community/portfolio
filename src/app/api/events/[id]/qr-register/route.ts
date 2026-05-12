import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "You must be logged in to register" },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;
    const userId = (session.user as any).id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (event.status !== "OPEN_FOR_REGISTRATION") {
      return NextResponse.json(
        { message: "Registration is closed for this event" },
        { status: 400 }
      );
    }

    const existing = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      return NextResponse.json(
        { message: "You are already registered for this event", alreadyRegistered: true },
        { status: 200 }
      );
    }

    const registration = await prisma.registration.create({
      data: { userId, eventId, status: "REGISTERED" },
    });

    return NextResponse.json(
      { success: true, registration, eventTitle: event.title },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
