import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTodayEvents } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized", events: [] }, { status: 401 });
    }

    const events = await getTodayEvents();
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch calendar";
    return NextResponse.json({ error: message, events: [] });
  }
}
