-- Employee Assistant — Supabase Schema
-- Run this in the Supabase SQL Editor for each new project/deployment

-- Tasks table
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  done boolean default false,
  section text not null default 'now' check (section in ('now', 'this-week', 'backlog')),
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Employee context/memory table
create table if not exists memory (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text not null,
  updated_at timestamptz default now()
);

-- Conversation history (optional — for persistence across sessions)
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  messages jsonb not null default '[]',
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert default employee context (update these per deployment)
insert into memory (key, value) values
  ('employee_name', ''),
  ('employee_role', ''),
  ('company_name', ''),
  ('custom_context', '')
on conflict (key) do nothing;

-- Enable Row Level Security (for future multi-tenancy)
alter table tasks enable row level security;
alter table memory enable row level security;
alter table conversations enable row level security;

-- For now, allow all access (single-tenant per deployment)
-- Replace these with user-scoped policies when adding multi-tenancy
create policy "Allow all access to tasks" on tasks for all using (true) with check (true);
create policy "Allow all access to memory" on memory for all using (true) with check (true);
create policy "Allow all access to conversations" on conversations for all using (true) with check (true);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at before update on tasks for each row execute function update_updated_at();
create trigger memory_updated_at before update on memory for each row execute function update_updated_at();
create trigger conversations_updated_at before update on conversations for each row execute function update_updated_at();
