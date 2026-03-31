import Anthropic from "@anthropic-ai/sdk";
import { loadContext } from "./context-loader";
import { tools, executeTool } from "./tool-executor";

export interface PageContext {
  news?: Array<{ title: string; source: string; url: string; tier: string; published: string; description?: string }>;
  tasks?: string;
  calendar?: string;
}

export async function chat(
  messages: Anthropic.Messages.MessageParam[],
  employeeName: string,
  employeeRole: string,
  companyName: string,
  pageContext?: PageContext
): Promise<ReadableStream> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey });
  const context = await loadContext();

  const displayRole = employeeRole ? ` (${employeeRole})` : "";
  const displayCompany = companyName ? ` at ${companyName}` : "";
  const pageSnapshot = buildPageSnapshot(pageContext);

  const systemPrompt = `You are an AI executive assistant for ${employeeName}${displayRole}${displayCompany}. You help them stay on top of their calendar, tasks, and any work-related needs. Be concise, friendly, and action-oriented.

When you use tools, report results naturally in your response (e.g., "Done — added that to your Now tasks").

You have access to a persistent memory system. Use save_memory to remember important things the employee tells you (preferences, contacts, project details). Use recall_memory when context might be helpful.

Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.

VOICE & STYLE RULES:
- You CAN see and discuss everything currently on the dashboard — calendar, tasks, and news.
- When reading news, speak like a broadcaster: natural flowing sentences, NO bullet points or markdown. Example: "In today's top news, Company X raised 75 million dollars for its AI video tool, and the former Apple designer is building a new AI interface. Want me to go deeper on any of these?"
- Never say you "don't have access" to news — you have that data below.
- Keep news readbacks to 2–4 sentences, then offer to go deeper.
- Strip ALL markdown (**, ##, -) from spoken responses.

${pageSnapshot ? `--- LIVE DASHBOARD DATA ---\n${pageSnapshot}\n` : ""}
--- CONTEXT ---
${context || "No additional context loaded."}`;

  const currentMessages = [...messages];
  let finalText = "";

  let currentResponse = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages: currentMessages,
  });

  while (currentResponse.stop_reason === "tool_use") {
    const toolBlocks = currentResponse.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );
    const textBlocks = currentResponse.content.filter(
      (b): b is Anthropic.Messages.TextBlock => b.type === "text"
    );

    if (textBlocks.length > 0) {
      finalText += textBlocks.map((b) => b.text).join("");
    }

    currentMessages.push({ role: "assistant", content: currentResponse.content });

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const block of toolBlocks) {
      const result = await executeTool(block.name, block.input as Record<string, string>);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });
    }

    currentMessages.push({ role: "user", content: toolResults });

    currentResponse = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: currentMessages,
    });
  }

  const finalTextBlocks = currentResponse.content.filter(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text"
  );
  finalText += finalTextBlocks.map((b) => b.text).join("");

  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: finalText })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

function buildPageSnapshot(ctx?: PageContext): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.calendar) parts.push(`### Today's Calendar\n${ctx.calendar}`);
  if (ctx.tasks) parts.push(`### Today's Tasks\n${ctx.tasks}`);
  if (ctx.news && ctx.news.length > 0) {
    const lines = ctx.news
      .map((a, i) => {
        const desc = a.description ? ` — ${a.description}` : "";
        return `${i + 1}. [${a.tier.toUpperCase()}] "${a.title}"${desc} (${a.source}, ${a.published})`;
      })
      .join("\n");
    parts.push(`### Current News Articles (displayed on dashboard)\n${lines}`);
  }
  return parts.join("\n\n");
}
