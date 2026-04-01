import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPipeline, updateLeadStage } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getPipeline();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load pipeline", leads: [], stats: { total: 0, totalValue: 0, activeDeals: 0 } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, leadId, stage } = await req.json();

    if (action === "update_stage" && leadId && stage) {
      const data = await updateLeadStage(leadId, stage);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update pipeline" },
      { status: 500 }
    );
  }
}
