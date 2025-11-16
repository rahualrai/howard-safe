-- Create digital_ids table for storing student ID information
create table if not exists public.digital_ids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  student_id text not null,
  program text not null,
  class_year text not null,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for faster user lookups
create index if not exists digital_ids_user_id_idx on public.digital_ids(user_id);

-- Enable Row Level Security
alter table public.digital_ids enable row level security;

-- RLS Policy: Users can only view their own digital ID
create policy "digital_ids_select_own"
  on public.digital_ids for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Users can insert their own digital ID (only if they don't have one)
create policy "digital_ids_insert_own"
  on public.digital_ids for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Users can update their own digital ID
create policy "digital_ids_update_own"
  on public.digital_ids for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Users can delete their own digital ID
create policy "digital_ids_delete_own"
  on public.digital_ids for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to auto-update updated_at
create trigger digital_ids_updated_at
  before update on public.digital_ids
  for each row
  execute function public.handle_updated_at();

-- Comment on table for documentation
comment on table public.digital_ids is 'Stores student digital ID information for Howard Safe app';
comment on column public.digital_ids.photo_url is 'Storage path to ID photo in Supabase Storage';
