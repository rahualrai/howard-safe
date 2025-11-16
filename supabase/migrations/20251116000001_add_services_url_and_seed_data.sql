-- Add URL column to services table for dining location menu links
alter table public.services add column if not exists url text;

-- Add structured time columns for automatic open/closed detection
alter table public.services add column if not exists open_time time;
alter table public.services add column if not exists close_time time;
alter table public.services add column if not exists days_open text[]; -- Array of days: ['monday', 'tuesday', etc.]
alter table public.services add column if not exists is_closed boolean default false; -- For temporary/permanent closures

-- Drop is_open column since we'll compute it dynamically
alter table public.services drop column if exists is_open;

-- Drop existing policies if they exist (safe to run multiple times)
drop policy if exists "services_select_public" on public.services;
drop policy if exists "services_modify_authenticated" on public.services;

-- Recreate policies
create policy "services_select_public"
  on public.services for select
  to anon, authenticated
  using (true);

create policy "services_modify_authenticated"
  on public.services for all
  to authenticated
  using (true)
  with check (true);

-- Create function to check if a service is currently open
create or replace function public.is_service_open(
  p_open_time time,
  p_close_time time,
  p_days_open text[],
  p_is_closed boolean
)
returns boolean
language plpgsql
as $$
declare
  current_time_local time;
  current_day_local text;
begin
  -- Return false if service is marked as closed
  if p_is_closed or p_open_time is null or p_close_time is null then
    return false;
  end if;

  -- Get current time in EST/EDT (Howard University timezone)
  current_time_local := (now() at time zone 'America/New_York')::time;
  current_day_local := lower(to_char(now() at time zone 'America/New_York', 'Day'));
  current_day_local := trim(current_day_local); -- Remove trailing spaces

  -- Check if today is in the days_open array
  if p_days_open is not null and not (current_day_local = any(p_days_open)) then
    return false;
  end if;

  -- Check if current time is within operating hours
  return current_time_local >= p_open_time and current_time_local < p_close_time;
end;
$$;

-- Delete old data to prevent duplicates
delete from public.services;

-- Seed dining services data with structured hours
-- Note: Most dining locations are closed on weekends (Saturday & Sunday)
insert into public.services (name, category, open_time, close_time, days_open, hours, url, is_closed) values
  ('1867 Café', 'dining', '08:00', '16:00', array['monday','tuesday','wednesday','thursday','friday'], '8:00 AM – 4:00 PM (Mon-Fri)', 'https://howard.campusdish.com/LocationsAndMenus/1867Cafe', false),
  ('Bethune Annex Café', 'dining', '16:00', '22:00', array['monday','tuesday','wednesday','thursday','friday'], '4:00 PM – 10:00 PM (Mon-Fri)', 'https://howard.campusdish.com/LocationsAndMenus/BethuneAnnexCafe', false),
  ('Bison Brew', 'dining', '08:00', '20:00', array['monday','tuesday','wednesday','thursday','friday'], '8:00 AM – 8:00 PM (Mon-Fri)', 'https://howard.campusdish.com/LocationsAndMenus/BisonBrew', false),
  ('Blackburn Café', 'dining', '16:00', '21:00', array['monday','tuesday','wednesday','thursday','friday'], '4:00 PM – 9:00 PM (Mon-Fri)', 'https://howard.campusdish.com/LocationsAndMenus/BlackburnCafe', false),
  ('Chick-fil-A', 'dining', '08:30', '20:00', array['monday','tuesday','wednesday','thursday','friday'], '8:30 AM – 8:00 PM (Mon-Fri)', 'https://howard.campusdish.com/LocationsAndMenus/ChickfilA', false),
  ('Everbowl', 'dining', '11:00', '22:00', array['monday','tuesday','wednesday','thursday','friday'], '11:00 AM – 10:00 PM (Mon-Fri)', 'https://howard.campusdish.com/LocationsAndMenus/Everbowl', false),
  ('202 Market', 'dining', '09:00', '20:00', array['monday','tuesday','wednesday','thursday','friday'], '9:00 AM – 8:00 PM (Mon-Fri)', 'https://howard.campusdish.com/LocationsAndMenus/202Market', false),
  ('The Halal Shack', 'dining', '11:00', '22:00', array['monday','tuesday','wednesday','thursday','friday'], '11:00 AM – 10:00 PM (Mon-Fri)', 'https://howard.campusdish.com/LocationsAndMenus/TheHalalShack', false),
  ('Jack''s Burrito', 'dining', '11:00', '22:00', array['monday','tuesday','wednesday','thursday','friday'], '11:00 AM – 10:00 PM (Mon-Fri)', 'https://howard.campusdish.com/LocationsAndMenus/JacksBurrito', false)
on conflict (id) do nothing;

-- Seed campus services data
insert into public.services (name, category, open_time, close_time, days_open, hours, is_closed) values
  ('Founders Library', 'service', '08:00', '22:00', array['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], '8:00 AM – 10:00 PM', false),
  ('Campus Gym', 'service', '09:00', '21:00', array['monday','tuesday','wednesday','thursday','friday'], '9:00 AM – 9:00 PM', false),
  ('Student Health Center', 'service', '09:00', '17:00', array['monday','tuesday','wednesday','thursday','friday'], '9:00 AM – 5:00 PM', false),
  ('Advising Office', 'service', '10:00', '16:00', array['monday','tuesday','wednesday','thursday','friday'], '10:00 AM – 4:00 PM', false)
on conflict (id) do nothing;
