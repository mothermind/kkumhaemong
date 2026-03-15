import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firestore";

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }

    // Sanitize slug — same rule as getContent()
    const safe = slug.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safe) return NextResponse.json({ error: "invalid slug" }, { status: 400 });

    const db = getFirestore();
    await db
      .collection("dreams")
      .doc(safe)
      .update({ views: FieldValue.increment(1) });

    return NextResponse.json({ ok: true });
  } catch {
    // Never surface Firestore errors to the client
    return NextResponse.json({ ok: true });
  }
}
