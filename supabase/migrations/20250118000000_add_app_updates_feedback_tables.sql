-- F11: App Updates and Feedback - Database Schema

-- Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  device_info JSONB, -- Browser, OS, screen size, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON public.bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports(created_at);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own bug reports
CREATE POLICY "bug_reports_select_own"
  ON public.bug_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Users can insert their own bug reports
CREATE POLICY "bug_reports_insert_own"
  ON public.bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  message TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON public.user_feedback(type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own feedback
CREATE POLICY "user_feedback_select_own"
  ON public.user_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Users can insert their own feedback
CREATE POLICY "user_feedback_insert_own"
  ON public.user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create changelog_entries table
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  release_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for version and date queries
CREATE INDEX IF NOT EXISTS idx_changelog_entries_version ON public.changelog_entries(version);
CREATE INDEX IF NOT EXISTS idx_changelog_entries_release_date ON public.changelog_entries(release_date DESC);

-- Enable RLS
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

-- RLS: Public read access for changelog
CREATE POLICY "changelog_entries_select_public"
  ON public.changelog_entries FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS: Only authenticated users can insert (admin functionality - can restrict later)
CREATE POLICY "changelog_entries_insert_authenticated"
  ON public.changelog_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed initial changelog entries
INSERT INTO public.changelog_entries (version, title, description, release_date) VALUES
  ('1.0.0', 'Initial Release', 'Welcome to Howard Safe! The app is now available with core safety features including emergency contacts, incident reporting, and campus maps.', CURRENT_DATE),
  ('1.1.0', 'Emergency Contacts Update', 'Added personal emergency contacts feature. You can now save your own emergency contacts like family and friends in Profile Settings.', CURRENT_DATE),
  ('1.1.1', 'Offline Support', 'Emergency contacts now work offline! The app automatically caches contacts for offline access and refreshes when you come back online.', CURRENT_DATE);

