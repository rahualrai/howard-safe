-- Create user_emergency_contacts table for personal emergency contacts
create table if not exists public.user_emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  relationship text not null,
  priority int not null default 0, -- 0 = normal, 1 = primary contact
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for faster queries
create index if not exists idx_user_emergency_contacts_user_id on public.user_emergency_contacts(user_id);
create index if not exists idx_user_emergency_contacts_priority on public.user_emergency_contacts(priority);
create index if not exists idx_user_emergency_contacts_active on public.user_emergency_contacts(is_active);

-- Enable RLS
alter table public.user_emergency_contacts enable row level security;

-- RLS: Users can only view their own emergency contacts
create policy "user_emergency_contacts_select_own"
  on public.user_emergency_contacts for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS: Users can insert their own emergency contacts
create policy "user_emergency_contacts_insert_own"
  on public.user_emergency_contacts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS: Users can update their own emergency contacts
create policy "user_emergency_contacts_update_own"
  on public.user_emergency_contacts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS: Users can delete their own emergency contacts
create policy "user_emergency_contacts_delete_own"
  on public.user_emergency_contacts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
create trigger update_user_emergency_contacts_updated_at
  before update on public.user_emergency_contacts
  for each row
  execute function update_updated_at_column();

-- Create emergency_alerts table to log when quick help is triggered
create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_type text not null default 'quick_help',
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  location_address text,
  message text,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'failed')),
  contacts_notified int not null default 0,
  created_at timestamptz not null default now()
);

-- Create indexes for emergency alerts
create index if not exists idx_emergency_alerts_user_id on public.emergency_alerts(user_id);
create index if not exists idx_emergency_alerts_created_at on public.emergency_alerts(created_at);
create index if not exists idx_emergency_alerts_status on public.emergency_alerts(status);

-- Enable RLS for emergency alerts
alter table public.emergency_alerts enable row level security;

-- RLS: Users can view their own alert history
create policy "emergency_alerts_select_own"
  on public.emergency_alerts for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS: Users can insert their own alerts
create policy "emergency_alerts_insert_own"
  on public.emergency_alerts for insert
  to authenticated
  with check (auth.uid() = user_id);
