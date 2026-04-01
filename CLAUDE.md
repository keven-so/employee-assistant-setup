# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on http://localhost:3001
npm run build        # Production build
npm run lint         # ESLint
npm start            # Production server on port 3001
bash scripts/setup.sh  # Interactive setup wizard (generates .env.local)
```

No test framework is configured.

## Architecture

This is a **Next.js 14 App Router** single-tenant AI executive assistant dashboard. Each deployment serves one employee.

### Request Flow

```
Browser → middleware.ts (auth gate) → /api/chat/route.ts
  → lib/claude.ts (builds system prompt with live dashboard data)
  → Claude Sonnet 4 API with tool-use loop
  → lib/tool-executor.ts (executes tools against Supabase/Google APIs)
  → SSE response back to ChatPanel
```

### AI Tool-Use Loop (`lib/claude.ts`)

The chat uses a **synchronous agentic loop**: calls Claude, checks for `tool_use` stop_reason, executes all tool calls via `lib/tool-executor.ts`, feeds results back as `tool_result` messages, repeats until Claude returns a final text response. The full response is then sent as a single SSE event (not token-streamed).

### Available Claude Tools (defined in `lib/tool-executor.ts`)

`get_calendar`, `get_tasks`, `add_task`, `complete_task`, `save_memory`, `recall_memory`, `draft_email`

Adding a new tool requires: (1) adding the tool schema to the `tools` array, (2) adding the execution case to `executeTool()`.

### Data Layer

- **Supabase** — Three tables: `tasks`, `memory` (key-value store for Claude's persistent context), `conversations`. Schema in `supabase/migration.sql`.
- **Two Supabase clients** (`lib/supabase.ts`): `getSupabase()` uses the anon key (client-side), `getServerSupabase()` uses the service role key (server-side API routes and tool execution).
- **RLS policies** are `using (true)` — access control is handled by NextAuth middleware, not Supabase.

### Auth

NextAuth v5 (beta) with Google provider. `ALLOWED_EMAILS` env var restricts login to a comma-separated email allowlist. Middleware redirects unauthenticated users to `/signin`.

### Design System

Glassmorphism theme defined entirely in CSS custom properties in `app/globals.css`. Key class: `.glass-card` (frosted glass effect with backdrop blur). All colors reference CSS variables (`--purple`, `--teal`, `--text-1`, etc.).

### News Feed

`lib/news-fetcher.ts` aggregates RSS (Anthropic, OpenAI, TechCrunch) and Hacker News API. Results are cached in-memory for 30 minutes. News data is injected into Claude's system prompt so it can discuss current articles.

### Voice

Browser-native Web Speech API via `hooks/useSpeechRecognition.ts` (input) and `hooks/useSpeechSynthesis.ts` (output). Claude's responses are auto-spoken unless muted. The system prompt instructs Claude to avoid markdown in spoken responses.

## Key Conventions

- Claude model is hardcoded to `claude-sonnet-4-20250514` in `lib/claude.ts`
- Employee identity comes from env vars (`EMPLOYEE_NAME`, `EMPLOYEE_ROLE`, `COMPANY_NAME`), falling back to the Google session name
- Chat history persists in localStorage (24h expiry) on the client, not in Supabase's `conversations` table
- All dashboard API routes (`/api/tasks`, `/api/calendar`, `/api/news`) are server-side and auth-gated
- Google Calendar/Gmail require `GOOGLE_CREDENTIALS_JSON` and `GOOGLE_TOKEN_JSON` env vars (full JSON blobs, not file paths)
