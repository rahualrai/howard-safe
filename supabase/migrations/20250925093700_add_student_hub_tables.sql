-- Create quick_links table for per-user quick links
create table if not exists public.quick_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  href text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.quick_links enable row level security;

-- RLS: users can manage only their own links
create policy "quick_links_select_own"
  on public.quick_links for select
  to authenticated
  using (auth.uid() = user_id);

create policy "quick_links_insert_own"
  on public.quick_links for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "quick_links_update_own"
  on public.quick_links for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "quick_links_delete_own"
  on public.quick_links for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create events table for campus events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  category text not null check (category in ('academic','social','career','cultural')),
  location text not null,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- RLS: allow public read; restrict mutations to authenticated (can further restrict later)
create policy "events_select_public"
  on public.events for select
  to anon, authenticated
  using (true);

create policy "events_modify_authenticated"
  on public.events for all
  to authenticated
  using (true)
  with check (true);

-- Create services table for dining and campus services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('dining','service')),
  is_open boolean not null default false,
  hours text,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "services_select_public"
  on public.services for select
  to anon, authenticated
  using (true);

create policy "services_modify_authenticated"
  on public.services for all
  to authenticated
  using (true)
  with check (true);
