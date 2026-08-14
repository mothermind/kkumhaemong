import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firestore";

const ALLOWED_TYPES = new Set([
  "related_click",
  "search_submit",
  "search_result_click",
  "explore_nav",
  "lucky_reveal",
]);

/** Today's date in Asia/Seoul, formatted YYYY-MM-DD — used as the daily counter doc ID. */
function todayKST(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { type, slug, locale } = (payload ?? {}) as Record<string, unknown>;

  if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  let safeSlug: string | undefined;
  if (slug !== undefined) {
    if (typeof slug !== "string") {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }
    // Sanitize slug — same rule as getContent()
    safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safeSlug) {
      return NextResponse.json({ error: "invalid slug" }, { status: 400 });
    }
  }

  if (locale !== undefined && typeof locale !== "string") {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }

  try {
    const db = getFirestore();
    const counters: Record<string, FirebaseFirestore.FieldValue> = {
      [type]: FieldValue.increment(1),
    };
    if (safeSlug) {
      counters[`${type}__${safeSlug}`] = FieldValue.increment(1);
    }

    await db.collection("events").doc(todayKST()).set(counters, { merge: true });

    return NextResponse.json({ ok: true });
  } catch {
    // Never surface Firestore errors to the client
    return NextResponse.json({ ok: true });
  }
}
