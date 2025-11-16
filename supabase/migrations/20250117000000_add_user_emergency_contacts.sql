-- Add user_id column to emergency_contacts table to support user-specific contacts
-- If user_id is NULL, the contact is a global/default contact available to all users
-- If user_id is set, the contact is specific to that user

-- First, add user_id column (nullable) to existing emergency_contacts table
ALTER TABLE public.emergency_contacts 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

-- Update RLS policies to support both global and user-specific contacts
-- Drop existing policies first
DROP POLICY IF EXISTS "emergency_contacts_select_public" ON public.emergency_contacts;
DROP POLICY IF EXISTS "emergency_contacts_modify_authenticated" ON public.emergency_contacts;

-- Policy: Users can view global contacts (user_id IS NULL) and their own contacts
CREATE POLICY "emergency_contacts_select_public_and_own"
  ON public.emergency_contacts FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true AND 
    (user_id IS NULL OR user_id = auth.uid())
  );

-- Policy: Authenticated users can insert their own contacts
CREATE POLICY "emergency_contacts_insert_own"
  ON public.emergency_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    user_id IS NOT NULL
  );

-- Policy: Users can update their own contacts
CREATE POLICY "emergency_contacts_update_own"
  ON public.emergency_contacts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own contacts
CREATE POLICY "emergency_contacts_delete_own"
  ON public.emergency_contacts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Only admins can modify global contacts (user_id IS NULL)
-- For now, we'll restrict this - you can add admin role check later
CREATE POLICY "emergency_contacts_modify_global"
  ON public.emergency_contacts FOR ALL
  TO authenticated
  USING (user_id IS NULL AND false) -- Disabled for now, enable when you have admin role
  WITH CHECK (user_id IS NULL AND false);

-- Update existing default contacts to be global (user_id = NULL)
UPDATE public.emergency_contacts 
SET user_id = NULL 
WHERE user_id IS NULL;

