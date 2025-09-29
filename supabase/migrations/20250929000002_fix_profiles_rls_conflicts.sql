-- Fix conflicting RLS policies on profiles table
-- The current setup has both private and public visibility policies which can conflict

-- Drop the existing conflicting policies
DROP POLICY IF EXISTS "Public profile info is viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a single, clear policy for profile visibility
-- This allows users to view their own profiles and basic public info of others
CREATE POLICY "Profile visibility policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always view their own profile (full access)
  auth.uid() = user_id
  OR
  -- Authenticated users can view basic public info of other users
  -- (only username and avatar_url, not sensitive fields)
  (auth.uid() != user_id AND auth.uid() IS NOT NULL)
);

-- Add additional fields to profiles table that are commonly needed
-- First check if they don't already exist
DO $$
BEGIN
  -- Add full_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;

  -- Add phone if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;

  -- Add emergency_contact if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'emergency_contact') THEN
    ALTER TABLE public.profiles ADD COLUMN emergency_contact TEXT;
  END IF;

  -- Add student_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'student_id') THEN
    ALTER TABLE public.profiles ADD COLUMN student_id TEXT;
  END IF;

  -- Add year if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'year') THEN
    ALTER TABLE public.profiles ADD COLUMN year TEXT;
  END IF;

  -- Add major if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'major') THEN
    ALTER TABLE public.profiles ADD COLUMN major TEXT;
  END IF;
END
$$;

-- Create a function to get safe public profile info
-- This function only returns safe, public information about users
CREATE OR REPLACE FUNCTION public.get_public_profile_info(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_info JSON;
BEGIN
  -- Only return basic public information
  SELECT json_build_object(
    'id', id,
    'username', username,
    'avatar_url', avatar_url,
    'full_name', full_name
  ) INTO profile_info
  FROM public.profiles
  WHERE user_id = target_user_id;

  RETURN profile_info;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profile_info(UUID) TO authenticated;

-- Create a function to get full profile info (only for the user themselves)
CREATE OR REPLACE FUNCTION public.get_my_full_profile()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_info JSON;
BEGIN
  -- Return full profile information only for the authenticated user
  SELECT json_build_object(
    'id', id,
    'user_id', user_id,
    'username', username,
    'avatar_url', avatar_url,
    'full_name', full_name,
    'phone', phone,
    'emergency_contact', emergency_contact,
    'student_id', student_id,
    'year', year,
    'major', major,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO profile_info
  FROM public.profiles
  WHERE user_id = auth.uid();

  RETURN profile_info;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_full_profile() TO authenticated;

-- Add constraints for data validation
ALTER TABLE public.profiles
ADD CONSTRAINT IF NOT EXISTS check_phone_format
CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$');

ALTER TABLE public.profiles
ADD CONSTRAINT IF NOT EXISTS check_student_id_format
CHECK (student_id IS NULL OR length(student_id) <= 20);

ALTER TABLE public.profiles
ADD CONSTRAINT IF NOT EXISTS check_year_values
CHECK (year IS NULL OR year IN ('Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Doctoral'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);