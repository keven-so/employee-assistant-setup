import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { chat, PageContext } from "@/lib/claude";
import { getPipeline } from "@/lib/pipeline";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages } = body;

    const employeeName = process.env.EMPLOYEE_NAME || session.user.name || "Employee";
    const employeeRole = process.env.EMPLOYEE_ROLE || "";
    const companyName = process.env.COMPANY_NAME || "";

    const [pipelineResult] = await Promise.allSettled([getPipeline()]);

    const pageContext: PageContext = {
      pipeline: pipelineResult.status === "fulfilled" ? pipelineResult.value : undefined,
    };

    const stream = await chat(
      messages as Anthropic.Messages.MessageParam[],
      employeeName,
      employeeRole,
      companyName,
      pageContext
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
