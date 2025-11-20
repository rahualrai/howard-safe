-- Admin System Implementation
-- Adds admin role support and restricts admin operations to admins only

-- Step 1: Add is_admin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Step 2: Update handle_new_user() function to set is_admin = false by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, is_admin)
  VALUES (new.id, new.raw_user_meta_data ->> 'username', false);
  RETURN new;
END;
$$;

-- Step 3: Update RLS policies for emergency_contacts (global contacts - admin only)
DROP POLICY IF EXISTS "emergency_contacts_modify_global" ON public.emergency_contacts;
DROP POLICY IF EXISTS "emergency_contacts_modify_global_admin" ON public.emergency_contacts;

-- Admins can modify global contacts (user_id IS NULL)
CREATE POLICY "emergency_contacts_modify_global_admin"
  ON public.emergency_contacts FOR ALL
  TO authenticated
  USING (
    user_id IS NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    user_id IS NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Step 4: Update RLS policies for events (admin only for mutations)
-- Only update if events table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    DROP POLICY IF EXISTS "events_modify_authenticated" ON public.events;

    -- Public read access
    DROP POLICY IF EXISTS "events_select_public" ON public.events;
    CREATE POLICY "events_select_public"
      ON public.events FOR SELECT
      TO anon, authenticated
      USING (true);

    -- Only admins can insert/update/delete events
    DROP POLICY IF EXISTS "events_modify_admin" ON public.events;
    CREATE POLICY "events_modify_admin"
      ON public.events FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.is_admin = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Step 5: Update RLS policies for services (admin only for mutations)
-- Only update if services table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    DROP POLICY IF EXISTS "services_modify_authenticated" ON public.services;

    -- Public read access
    DROP POLICY IF EXISTS "services_select_public" ON public.services;
    CREATE POLICY "services_select_public"
      ON public.services FOR SELECT
      TO anon, authenticated
      USING (true);

    -- Only admins can insert/update/delete services
    DROP POLICY IF EXISTS "services_modify_admin" ON public.services;
    CREATE POLICY "services_modify_admin"
      ON public.services FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.is_admin = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Step 6: Update RLS policies for changelog_entries (admin only)
DROP POLICY IF EXISTS "changelog_entries_insert_authenticated" ON public.changelog_entries;
DROP POLICY IF EXISTS "changelog_entries_insert_admin" ON public.changelog_entries;
DROP POLICY IF EXISTS "changelog_entries_update_admin" ON public.changelog_entries;
DROP POLICY IF EXISTS "changelog_entries_delete_admin" ON public.changelog_entries;

-- Only admins can insert changelog entries
CREATE POLICY "changelog_entries_insert_admin"
  ON public.changelog_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Only admins can update changelog entries
CREATE POLICY "changelog_entries_update_admin"
  ON public.changelog_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Only admins can delete changelog entries
CREATE POLICY "changelog_entries_delete_admin"
  ON public.changelog_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Step 7: Create default_quick_links table for admin-managed default links
CREATE TABLE IF NOT EXISTS public.default_quick_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.default_quick_links ENABLE ROW LEVEL SECURITY;

-- Public read access for default links
DROP POLICY IF EXISTS "default_quick_links_select_public" ON public.default_quick_links;
CREATE POLICY "default_quick_links_select_public"
  ON public.default_quick_links FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Only admins can modify default links
DROP POLICY IF EXISTS "default_quick_links_modify_admin" ON public.default_quick_links;
CREATE POLICY "default_quick_links_modify_admin"
  ON public.default_quick_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_default_quick_links_order ON public.default_quick_links(order_index);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_default_quick_links_updated_at ON public.default_quick_links;
CREATE TRIGGER update_default_quick_links_updated_at
BEFORE UPDATE ON public.default_quick_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Update incident_reports RLS for admin view (view-only for now)
-- Only update if incident_reports table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incident_reports') THEN
    -- Admins can view all incident reports
    DROP POLICY IF EXISTS "incident_reports_select_admin" ON public.incident_reports;
    CREATE POLICY "incident_reports_select_admin"
      ON public.incident_reports FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Note: To make a user an admin, run:
-- UPDATE public.profiles SET is_admin = true WHERE user_id = '<user-uuid>';

