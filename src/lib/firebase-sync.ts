import prisma from "@/lib/prisma";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "test-69b74";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

let cachedFirebaseToken: string | null = null;
let tokenExpirationTime: number = 0;

async function getFirebaseAuthToken(): Promise<string> {
  if (cachedFirebaseToken && Date.now() < tokenExpirationTime) {
    return cachedFirebaseToken;
  }
  
  if (!FIREBASE_API_KEY) {
    throw new Error("FIREBASE_API_KEY is not defined in environment variables");
  }

  const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables");
  }

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      returnSecureToken: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to authenticate with Firebase Admin credentials: ${res.statusText}`);
  }

  const data = await res.json();
  cachedFirebaseToken = data.idToken;
  // Tokens are usually valid for 1 hour. We cache it for 55 minutes to be safe.
  tokenExpirationTime = Date.now() + (Number(data.expiresIn) - 300) * 1000;
  
  return cachedFirebaseToken!;
}

function parseFirestoreValue(val: any): any {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return parseFloat(val.doubleValue);
  if ("timestampValue" in val) return val.timestampValue;
  if ("mapValue" in val) {
    const res: Record<string, any> = {};
    const fields = val.mapValue.fields || {};
    for (const k in fields) {
      res[k] = parseFirestoreValue(fields[k]);
    }
    return res;
  }
  if ("arrayValue" in val) {
    const values = val.arrayValue.values || [];
    return values.map((v: any) => parseFirestoreValue(v));
  }
  if ("nullValue" in val) return null;
  return null;
}

function parseFirestoreFields(fields: Record<string, any> = {}): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in fields) {
    result[key] = parseFirestoreValue(fields[key]);
  }
  return result;
}

/**
 * Syncs dedicated registrations from Firebase Firestore to Supabase via Prisma
 * Matches event/workshop by case-sensitive title.
 */
export async function syncDedicatedRegistrations(params: {
  targetId: string;
  targetType: "event" | "workshop";
  title: string;
  organizedById: string;
}) {
  const { targetId, targetType, title, organizedById } = params;

  // 1. Fetch events from Firestore REST API
  const eventsUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/events`;
  const eventsRes = await fetch(eventsUrl, { cache: "no-store" });

  if (!eventsRes.ok) {
    throw new Error(`Failed to fetch events from Firebase: ${eventsRes.statusText}`);
  }

  const eventsData = await eventsRes.json();
  const documents: any[] = eventsData.documents || [];

  // Find matching document where title or name matches title (case-sensitive)
  let matchedDoc = documents.find((doc: any) => {
    const fields = parseFirestoreFields(doc.fields);
    return fields.title === title || fields.name === title;
  });

  // If not matched by exact field, check if doc ID itself matches or try to find any event
  if (!matchedDoc && documents.length > 0) {
    matchedDoc = documents.find((doc: any) => {
      const docId = doc.name.split("/").pop();
      return docId === title;
    });
  }

  if (!matchedDoc) {
    return {
      success: false,
      message: `No matching event found in Firebase Firestore with exact title "${title}" (case-sensitive).`,
      syncedCount: 0,
      presentCount: 0,
    };
  }

  const firestoreEventId = matchedDoc.name.split("/").pop();

  // Build fieldId → label map from the Firebase event's formFields array
  const matchedEventFields = parseFirestoreFields(matchedDoc.fields);
  const fieldLabelMap: Record<string, string> = {};
  const rawFormFields = matchedEventFields.formFields;
  if (Array.isArray(rawFormFields)) {
    for (const ff of rawFormFields) {
      if (ff && ff.id && ff.label) {
        fieldLabelMap[ff.id] = ff.label;
      }
    }
  }

  // Helper: remap a responses object — replace field IDs with their labels
  function remapResponseKeys(responses: Record<string, any>): Record<string, any> {
    const remapped: Record<string, any> = {};
    for (const [key, value] of Object.entries(responses)) {
      const label = fieldLabelMap[key] ?? key;
      remapped[label] = value;
    }
    return remapped;
  }

  // 2. Fetch registrations subcollection
  // Admin authentication is now required due to strict Firebase rules
  const authToken = await getFirebaseAuthToken();
  const regUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/events/${firestoreEventId}/registrations`;
  const regRes = await fetch(regUrl, { 
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });

  if (!regRes.ok) {
    if (regRes.status === 404) {
      return {
        success: true,
        message: `Matched Firebase event "${title}" (ID: ${firestoreEventId}), but no registrations found yet.`,
        syncedCount: 0,
        presentCount: 0,
      };
    }
    throw new Error(`Failed to fetch registrations from Firebase: ${regRes.statusText}`);
  }

  const regData = await regRes.json();
  const regDocs: any[] = regData.documents || [];

  let syncedCount = 0;
  let presentCount = 0;

  for (const doc of regDocs) {
    const fields = parseFirestoreFields(doc.fields);
    const rawResponses = fields.responses || {};
    // Remap field IDs → human-readable labels for storage/display
    const responses = remapResponseKeys(rawResponses);
    const present = Boolean(fields.present);
    const checkedInAtTimestamp = fields.checkedInAt;

    // Search for email and name using rawResponses (which use stable IDs like 'email' and 'fullName')
    const findRawResponse = (...keys: string[]): string | null => {
      for (const k of keys) {
        const found = Object.entries(rawResponses).find(
          ([rk]) => rk.toLowerCase() === k.toLowerCase()
        );
        if (found?.[1]) return String(found[1]);
      }
      return null;
    };

    const email =
      findRawResponse("email", "userEmail") ||
      (fields.userEmail ? String(fields.userEmail) : null);

    const name =
      findRawResponse("fullName", "name", "full_name") ||
      (email ? email.split("@")[0] : "Attendee");

    if (!email) {
      continue;
    }

    // 3. Upsert user in Supabase
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          role: "PUBLIC",
        },
      });
    }

    // 4. Upsert Registration
    const regWhere =
      targetType === "event"
        ? { userId_eventId: { userId: user.id, eventId: targetId } }
        : { userId_workshopId: { userId: user.id, workshopId: targetId } };

    const regDataObj = {
      userId: user.id,
      eventId: targetType === "event" ? targetId : null,
      workshopId: targetType === "workshop" ? targetId : null,
      status: present ? ("ATTENDED" as const) : ("REGISTERED" as const),
      formResponses: {
        ...responses,
        // Store Firebase timestamps for display (milliseconds → ISO string)
        ...(fields.createdAt ? { _registeredAt: String(fields.createdAt) } : {}),
        ...(checkedInAtTimestamp ? { _attendedAt: String(typeof checkedInAtTimestamp === "number" ? checkedInAtTimestamp : new Date(checkedInAtTimestamp).getTime()) } : {}),
      },
    };

    await prisma.registration.upsert({
      where: regWhere,
      update: {
        status: present ? "ATTENDED" : "REGISTERED",
        formResponses: {
          ...responses,
          ...(fields.createdAt ? { _registeredAt: String(fields.createdAt) } : {}),
          ...(checkedInAtTimestamp ? { _attendedAt: String(typeof checkedInAtTimestamp === "number" ? checkedInAtTimestamp : new Date(checkedInAtTimestamp).getTime()) } : {}),
        },
      },
      create: regDataObj,
    });

    syncedCount++;

    // 5. Upsert Attendance if present
    if (present) {
      presentCount++;
      const attWhere =
        targetType === "event"
          ? { userId_eventId: { userId: user.id, eventId: targetId } }
          : { userId_workshopId: { userId: user.id, workshopId: targetId } };

      let timestamp = new Date();
      if (checkedInAtTimestamp) {
        if (typeof checkedInAtTimestamp === "number") {
          timestamp = new Date(checkedInAtTimestamp);
        } else if (typeof checkedInAtTimestamp === "string") {
          timestamp = new Date(checkedInAtTimestamp);
        }
      }

      await prisma.attendance.upsert({
        where: attWhere,
        update: {
          timestamp,
          verifiedById: organizedById,
        },
        create: {
          userId: user.id,
          eventId: targetType === "event" ? targetId : null,
          workshopId: targetType === "workshop" ? targetId : null,
          verifiedById: organizedById,
          timestamp,
        },
      });
    }
  }

  return {
    success: true,
    message: `Successfully synced ${syncedCount} registrations (${presentCount} present/attended) from Firebase to Supabase!`,
    syncedCount,
    presentCount,
    firestoreEventId,
  };
}
