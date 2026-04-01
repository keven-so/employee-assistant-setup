import Anthropic from "@anthropic-ai/sdk";
import { getTasks, addTask, completeTaskByText } from "./tasks";
import { getTodayEvents } from "./google-calendar";
import { getServerSupabase } from "./supabase";
import { getPipeline } from "./pipeline";

export const tools: Anthropic.Messages.Tool[] = [
  {
    name: "get_calendar",
    description: "Get today's calendar events",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_tasks",
    description: "Get the current task list",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "add_task",
    description: "Add a new task",
    input_schema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "The task text" },
        section: {
          type: "string",
          enum: ["now", "this-week", "backlog"],
          description: "Which section to add it to",
        },
      },
      required: ["text", "section"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as completed",
    input_schema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "The exact task text to mark as done" },
      },
      required: ["text"],
    },
  },
  {
    name: "save_memory",
    description: "Save a piece of information to long-term memory (key-value pair)",
    input_schema: {
      type: "object" as const,
      properties: {
        key: { type: "string", description: "A short label for this memory (e.g. 'preferred_meeting_time')" },
        value: { type: "string", description: "The value to remember" },
      },
      required: ["key", "value"],
    },
  },
  {
    name: "recall_memory",
    description: "Recall all saved memories",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_pipeline",
    description: "Get active deals from the CRM pipeline, sorted by soonest expected close date",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "draft_email",
    description: "Create a Gmail draft email",
    input_schema: {
      type: "object" as const,
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject line" },
        body: { type: "string", description: "Email body text" },
      },
      required: ["to", "subject", "body"],
    },
  },
];

export async function executeTool(name: string, input: Record<string, string>): Promise<string> {
  switch (name) {
    case "get_calendar": {
      try {
        const events = await getTodayEvents();
        if (events.length === 0) return "No events scheduled for today.";
        return events
          .map((e) => `- ${new Date(e.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}: ${e.summary}`)
          .join("\n");
      } catch {
        return "Calendar is not connected. Set GOOGLE_CREDENTIALS_JSON and GOOGLE_TOKEN_JSON env vars to enable.";
      }
    }

    case "get_tasks": {
      try {
        const data = await getTasks();
        const lines: string[] = [];
        for (const section of data.sections) {
          if (section.tasks.length === 0) continue;
          lines.push(`**${section.name}:**`);
          for (const task of section.tasks) {
            lines.push(`- [${task.done ? "x" : " "}] ${task.text}`);
          }
        }
        return lines.length > 0 ? lines.join("\n") : "No tasks yet.";
      } catch {
        return "Could not load tasks. Check Supabase configuration.";
      }
    }

    case "add_task": {
      try {
        await addTask(input.text, input.section);
        return `Added "${input.text}" to ${input.section} tasks.`;
      } catch (e) {
        return `Failed to add task: ${e instanceof Error ? e.message : "unknown error"}`;
      }
    }

    case "complete_task": {
      try {
        await completeTaskByText(input.text);
        return `Marked "${input.text}" as complete.`;
      } catch (e) {
        return `Failed to complete task: ${e instanceof Error ? e.message : "unknown error"}`;
      }
    }

    case "get_pipeline": {
      try {
        const pipeline = await getPipeline();
        if (pipeline.leads.length === 0) return "No active deals in the pipeline.";
        const lines = pipeline.leads.map((l) => {
          const closeStr = l.expected_close
            ? new Date(l.expected_close).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "no date";
          return `- ${l.company} (${l.contact_name}) — $${Number(l.value).toLocaleString()} — ${l.stage} — closes ${closeStr}${l.notes ? ` — ${l.notes}` : ""}`;
        });
        return `${pipeline.stats.activeDeals} active deals, $${Number(pipeline.stats.totalValue).toLocaleString()} total pipeline:\n${lines.join("\n")}`;
      } catch {
        return "Could not load pipeline. Check Supabase configuration.";
      }
    }

    case "save_memory": {
      try {
        const supabase = getServerSupabase();
        const { error } = await supabase
          .from("memory")
          .upsert({ key: input.key, value: input.value }, { onConflict: "key" });
        if (error) throw error;
        return `Saved: ${input.key} = "${input.value}"`;
      } catch (e) {
        return `Failed to save memory: ${e instanceof Error ? e.message : "unknown error"}`;
      }
    }

    case "recall_memory": {
      try {
        const supabase = getServerSupabase();
        const { data, error } = await supabase
          .from("memory")
          .select("key, value")
          .order("key");
        if (error) throw error;
        if (!data || data.length === 0) return "No memories saved yet.";
        return data
          .filter((row) => row.value && row.value.trim())
          .map((row) => `- ${row.key}: ${row.value}`)
          .join("\n");
      } catch {
        return "Could not recall memories. Check Supabase configuration.";
      }
    }

    case "draft_email": {
      try {
        const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
        const tokenJson = process.env.GOOGLE_TOKEN_JSON;
        if (!credentialsJson || !tokenJson) {
          return "Gmail is not connected. Set GOOGLE_CREDENTIALS_JSON and GOOGLE_TOKEN_JSON env vars to enable.";
        }
        const { google } = await import("googleapis");
        const credentials = JSON.parse(credentialsJson);
        const token = JSON.parse(tokenJson);
        const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
        const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);
        auth.setCredentials(token);
        const gmail = google.gmail({ version: "v1", auth });
        const raw = Buffer.from(
          `To: ${input.to}\r\nSubject: ${input.subject}\r\n\r\n${input.body}`
        ).toString("base64url");
        await gmail.users.drafts.create({
          userId: "me",
          requestBody: { message: { raw } },
        });
        return `Draft created — to: ${input.to}, subject: "${input.subject}"`;
      } catch {
        return "Failed to create email draft. Check Google credentials.";
      }
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
