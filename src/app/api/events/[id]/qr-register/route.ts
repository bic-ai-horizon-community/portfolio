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

    const { id } = await params;
    const userId = (session.user as any).id;
    const url = new URL(_req.url);
    const type = url.searchParams.get("type") || "event";

    let item;
    if (type === "workshop") {
      item = await prisma.workshop.findUnique({ where: { id } });
    } else {
      item = await prisma.event.findUnique({ where: { id } });
    }

    if (!item) {
      return NextResponse.json({ message: `${type === 'workshop' ? 'Workshop' : 'Event'} not found` }, { status: 404 });
    }

    if (item.status !== "OPEN_FOR_REGISTRATION") {
      return NextResponse.json(
        { message: `Registration is closed for this ${type}` },
        { status: 400 }
      );
    }

    if (!item.showQr) {
      return NextResponse.json(
        { message: `QR registration is currently disabled for this ${type}` },
        { status: 403 }
      );
    }

    const whereClause = type === "workshop"
      ? { userId_workshopId: { userId, workshopId: id } }
      : { userId_eventId: { userId, eventId: id } };

    const existing = await prisma.registration.findUnique({
      where: whereClause as any,
    });

    if (existing) {
      return NextResponse.json(
        { message: `You are already registered for this ${type}`, alreadyRegistered: true },
        { status: 200 }
      );
    }

    const registration = await prisma.registration.create({
      data: { 
        userId, 
        eventId: type === "event" ? id : null,
        workshopId: type === "workshop" ? id : null,
        status: "REGISTERED" 
      },
    });

    return NextResponse.json(
      { success: true, registration, eventTitle: item.title },
      { status: 201 }
    );
  } catch (error) {
    console.error("QR Register Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
