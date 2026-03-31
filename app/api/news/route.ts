import { NextResponse } from "next/server";
import { getNews } from "@/lib/news-fetcher";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { articles } = await getNews();
    return NextResponse.json({ articles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch news";
    return NextResponse.json({ error: message, articles: [] });
  }
}
