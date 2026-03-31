import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTasks, addTask, completeTask } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getTasks();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load tasks", sections: [], stats: { total: 0, done: 0 } },
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

    const { action, text, section, taskId } = await req.json();

    if (action === "complete" && taskId) {
      const data = await completeTask(taskId);
      return NextResponse.json(data);
    }

    if (action === "add" && text && section) {
      const data = await addTask(text, section);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update tasks" },
      { status: 500 }
    );
  }
}
