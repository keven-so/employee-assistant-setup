import { getServerSupabase } from "./supabase";

/**
 * Loads employee context from env vars + Supabase memory table.
 * No filesystem access — fully Vercel-compatible.
 */
export async function loadContext(): Promise<string> {
  const parts: string[] = [];

  // 1. Load from env vars (set per Vercel deployment)
  const envName = process.env.EMPLOYEE_NAME || "";
  const envRole = process.env.EMPLOYEE_ROLE || "";
  const envCompany = process.env.COMPANY_NAME || "";
  const envContext = process.env.EMPLOYEE_CONTEXT || "";

  if (envName || envRole || envCompany) {
    parts.push(
      `## Employee Profile\n- Name: ${envName}\n- Role: ${envRole}\n- Company: ${envCompany}`
    );
  }

  if (envContext) {
    parts.push(`## Additional Context\n${envContext}`);
  }

  // 2. Load from Supabase memory table (overrides/supplements env vars)
  try {
    const supabase = getServerSupabase();
    const { data } = await supabase
      .from("memory")
      .select("key, value")
      .order("key");

    if (data && data.length > 0) {
      const memoryLines = data
        .filter((row) => row.value && row.value.trim())
        .map((row) => `- ${row.key}: ${row.value}`);

      if (memoryLines.length > 0) {
        parts.push(`## Stored Memory\n${memoryLines.join("\n")}`);
      }
    }
  } catch {
    // Supabase not configured yet — that's fine
  }

  return parts.join("\n\n---\n\n");
}
