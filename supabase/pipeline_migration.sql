-- Pipeline / CRM Leads table
-- Run this in the Supabase SQL Editor

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  company text not null,
  contact_name text not null,
  contact_email text,
  value numeric(12,2) default 0,
  stage text not null default 'lead' check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost')),
  expected_close date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table leads enable row level security;
create policy "Allow all access to leads" on leads for all using (true) with check (true);

create trigger leads_updated_at before update on leads for each row execute function update_updated_at();

-- Sample data (remove or replace with real leads)
insert into leads (company, contact_name, contact_email, value, stage, expected_close, notes) values
  ('Acme Corp', 'Sarah Chen', 'sarah@acmecorp.com', 45000, 'negotiation', current_date + interval '5 days', 'Final pricing review Friday'),
  ('Meridian Health', 'James Porter', 'jporter@meridian.com', 120000, 'proposal', current_date + interval '12 days', 'Sent proposal March 28'),
  ('TechFlow Inc', 'Priya Sharma', 'priya@techflow.io', 32000, 'qualified', current_date + interval '20 days', 'Demo scheduled next week'),
  ('Northwind Ltd', 'David Kim', 'dkim@northwind.co', 78000, 'negotiation', current_date + interval '3 days', 'Waiting on legal review'),
  ('BlueShift AI', 'Maria Lopez', 'mlopez@blueshift.ai', 95000, 'proposal', current_date + interval '18 days', 'VP wants second demo'),
  ('Summit Partners', 'Alex Rivera', 'arivera@summit.com', 210000, 'lead', current_date + interval '45 days', 'Inbound from webinar'),
  ('GreenScale', 'Tom Wright', 'tom@greenscale.com', 55000, 'closed-won', current_date - interval '2 days', 'Signed! Onboarding next week')
on conflict do nothing;
