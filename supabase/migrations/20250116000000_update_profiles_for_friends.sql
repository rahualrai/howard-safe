-- Migration: Update profiles to be searchable for friends feature
-- This ensures profiles are created on signup and can be searched by other users

-- ============================================
-- UPDATE PROFILE POLICIES FOR FRIEND SEARCH
-- ============================================

-- Drop the restrictive policy that only allows viewing own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a policy that allows authenticated users to search/view profiles for friend requests
-- This allows users to see basic profile info (username, avatar) to send friend requests
CREATE POLICY "Authenticated users can view profiles for friend search"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Ensure the profile creation trigger is working
-- Update the handle_new_user function to ensure profile is always created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (user_id, username)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data ->> 'username',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CREATE FUNCTION TO ENSURE PROFILE EXISTS
-- ============================================

-- Function to ensure a profile exists for a user (can be called on signin)
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  SELECT 
    user_uuid,
    COALESCE(
      (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = user_uuid),
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_uuid),
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = user_uuid),
      (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = user_uuid),
      'User'
    )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

