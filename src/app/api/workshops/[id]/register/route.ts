import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const registrationSchema = z.object({
  formResponses: z.any().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "You must be logged in to register" }, { status: 401 });
    }

    const { id: workshopId } = await params;
    const userId = (session.user as any).id;

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
    });

    if (!workshop) {
      return NextResponse.json({ message: "Workshop not found" }, { status: 404 });
    }

    if (workshop.status !== "OPEN_FOR_REGISTRATION") {
      return NextResponse.json({ message: "Registration is closed for this workshop" }, { status: 400 });
    }

    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_workshopId: {
          userId,
          workshopId,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json({ message: "You are already registered for this workshop" }, { status: 400 });
    }

    const body = await req.json();
    const { formResponses } = registrationSchema.parse(body);

    const registration = await prisma.registration.create({
      data: {
        userId,
        workshopId,
        formResponses,
        status: "REGISTERED",
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
