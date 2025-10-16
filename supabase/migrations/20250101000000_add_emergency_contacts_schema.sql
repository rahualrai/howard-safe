-- Create emergency_contacts table
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  contact text not null,
  description text not null,
  category text not null check (category in ('emergency-contacts', 'support-services', 'safety-resources')),
  priority int not null default 0, -- 0 = normal, 1 = high, 2 = critical
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for faster category filtering
create index if not exists idx_emergency_contacts_category on public.emergency_contacts(category);
create index if not exists idx_emergency_contacts_priority on public.emergency_contacts(priority);
create index if not exists idx_emergency_contacts_active on public.emergency_contacts(is_active);

-- Enable RLS
alter table public.emergency_contacts enable row level security;

-- RLS: allow public read access for emergency contacts
create policy "emergency_contacts_select_public"
  on public.emergency_contacts for select
  to anon, authenticated
  using (is_active = true);

-- RLS: restrict mutations to authenticated users (admin functionality)
create policy "emergency_contacts_modify_authenticated"
  on public.emergency_contacts for all
  to authenticated
  using (true)
  with check (true);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_emergency_contacts_updated_at
  before update on public.emergency_contacts
  for each row
  execute function update_updated_at_column();

-- Insert default emergency contacts data
insert into public.emergency_contacts (title, contact, description, category, priority) values
  ('Campus Security', '(202) 806-HELP (4357)', '24/7 campus emergency line', 'emergency-contacts', 2),
  ('Metropolitan Police', '911', 'Emergency police response', 'emergency-contacts', 2),
  ('Howard University Hospital', '(202) 865-6100', 'Campus medical emergency', 'emergency-contacts', 2),
  ('Student Health Center', '(202) 806-7540', 'Non-emergency medical care', 'emergency-contacts', 1),
  ('Counseling Services', '(202) 806-6870', 'Mental health support and counseling', 'support-services', 1),
  ('Title IX Office', '(202) 806-2550', 'Sexual harassment and discrimination reporting', 'support-services', 1),
  ('Dean of Students', '(202) 806-2755', 'Student affairs and support', 'support-services', 0),
  ('Campus Ministry', '(202) 806-7280', 'Spiritual guidance and support', 'support-services', 0),
  ('Safety Escort Service', '(202) 806-4357', 'Free campus escort service (6 PM - 2 AM)', 'safety-resources', 1),
  ('Blue Light Phones', 'Campus-wide', 'Emergency phones located throughout campus', 'safety-resources', 1),
  ('LiveSafe App', 'Download from app store', 'Campus safety app for reporting and alerts', 'safety-resources', 0),
  ('Safety Training', '(202) 806-1919', 'Personal safety workshops and training', 'safety-resources', 0);
