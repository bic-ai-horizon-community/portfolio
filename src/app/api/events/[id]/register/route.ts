import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const COLLEGE_DOMAIN = "bicnepal.edu.np";

const registrationSchema = z.object({
  formResponses: z.any().optional(),
});

function checkAudience(email: string, audienceType: string): { allowed: boolean; message: string } {
  const isCollegeEmail = email.endsWith(`@${COLLEGE_DOMAIN}`);
  const isGmail = email.endsWith("@gmail.com");

  switch (audienceType) {
    case "COLLEGE_ONLY":
      if (!isCollegeEmail) {
        return { allowed: false, message: `This event is for college members only (@${COLLEGE_DOMAIN})` };
      }
      break;
    case "PUBLIC_ONLY":
      if (!isGmail) {
        return { allowed: false, message: "This event is for the general public only (@gmail.com)" };
      }
      break;
    case "BOTH":
    default:
      break;
  }
  return { allowed: true, message: "" };
}

function validateFormResponses(
  formFields: any[] | null,
  formResponses: Record<string, any> | null | undefined,
  registrationType: string
): { valid: boolean; message: string } {
  if (registrationType !== "FORM" || !formFields || formFields.length === 0) {
    return { valid: true, message: "" };
  }

  if (!formResponses || typeof formResponses !== "object") {
    return { valid: false, message: "Form responses are required for this event" };
  }

  for (const field of formFields) {
    if (field.required) {
      const value = formResponses[field.label];
      if (value === undefined || value === null || value === "") {
        return { valid: false, message: `"${field.label}" is required` };
      }
    }
  }

  return { valid: true, message: "" };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "You must be logged in to register" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const userId = (session.user as any).id;
    const userEmail = session.user?.email || "";

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (event.status !== "OPEN_FOR_REGISTRATION") {
      return NextResponse.json({ message: "Registration is closed for this event" }, { status: 400 });
    }

    // Audience validation
    const audienceCheck = checkAudience(userEmail, event.audienceType);
    if (!audienceCheck.allowed) {
      return NextResponse.json({ message: audienceCheck.message }, { status: 403 });
    }

    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json({ message: "You are already registered for this event" }, { status: 400 });
    }

    const body = await req.json();
    const { formResponses } = registrationSchema.parse(body);

    // Form field validation
    const formValidation = validateFormResponses(
      event.formFields as any[] | null,
      formResponses,
      event.registrationType
    );
    if (!formValidation.valid) {
      return NextResponse.json({ message: formValidation.message }, { status: 400 });
    }

    const registration = await prisma.registration.create({
      data: {
        userId,
        eventId,
        formResponses: event.registrationType === "FORM" ? formResponses : undefined,
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "You must be logged in to update registration" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const userId = (session.user as any).id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!existingRegistration) {
      return NextResponse.json({ message: "You are not registered for this event" }, { status: 404 });
    }

    if (existingRegistration.status === "ATTENDED") {
      return NextResponse.json({ message: "Cannot edit registration after attendance is marked" }, { status: 400 });
    }

    const body = await req.json();
    const { formResponses } = registrationSchema.parse(body);

    const formValidation = validateFormResponses(
      event.formFields as any[] | null,
      formResponses,
      event.registrationType
    );
    
    if (!formValidation.valid) {
      return NextResponse.json({ message: formValidation.message }, { status: 400 });
    }

    const updatedRegistration = await prisma.registration.update({
      where: { id: existingRegistration.id },
      data: {
        formResponses: event.registrationType === "FORM" ? formResponses : undefined,
      },
    });

    return NextResponse.json(updatedRegistration, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
