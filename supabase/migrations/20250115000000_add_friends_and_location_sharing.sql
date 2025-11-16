-- Migration: Add friends system and location sharing
-- This migration creates tables for friend requests, friendships, location sharing, and 2FA

-- ============================================
-- FRIENDS SYSTEM
-- ============================================

-- Friend requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Friendships table (bidirectional relationship)
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- ============================================
-- LOCATION SHARING
-- ============================================

-- User locations table for real-time location sharing
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Location sharing preferences (who can see your location)
CREATE TABLE IF NOT EXISTS public.location_sharing_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  share_with_friends BOOLEAN NOT NULL DEFAULT true,
  share_with_all BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 2FA SUPPORT
-- ============================================

-- Two-factor authentication secrets
CREATE TABLE IF NOT EXISTS public.user_2fa_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  secret TEXT NOT NULL,
  backup_codes TEXT[],
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Friend requests indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON public.friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_addressee ON public.friend_requests(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

-- Friendships indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);

-- Location indexes
CREATE INDEX IF NOT EXISTS idx_user_locations_user ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_timestamp ON public.user_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_locations_active ON public.user_locations(user_id, is_active) WHERE is_active = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_sharing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_secrets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FRIEND REQUESTS POLICIES
-- ============================================

-- Users can view friend requests they sent or received
CREATE POLICY "Users can view their friend requests"
ON public.friend_requests
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests"
ON public.friend_requests
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Users can update friend requests they received (accept/reject)
CREATE POLICY "Users can update received friend requests"
ON public.friend_requests
FOR UPDATE
USING (auth.uid() = addressee_id)
WITH CHECK (auth.uid() = addressee_id);

-- Users can cancel friend requests they sent
CREATE POLICY "Users can cancel sent friend requests"
ON public.friend_requests
FOR UPDATE
USING (auth.uid() = requester_id AND status = 'pending')
WITH CHECK (auth.uid() = requester_id);

-- ============================================
-- FRIENDSHIPS POLICIES
-- ============================================

-- Users can view their friendships
CREATE POLICY "Users can view their friendships"
ON public.friendships
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can create friendships (when accepting a request)
CREATE POLICY "Users can create friendships"
ON public.friendships
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete their friendships
CREATE POLICY "Users can delete their friendships"
ON public.friendships
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- LOCATION POLICIES
-- ============================================

-- Users can view their own location
CREATE POLICY "Users can view their own location"
ON public.user_locations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view friends' locations if sharing is enabled
CREATE POLICY "Users can view friends' locations"
ON public.user_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (f.user_id = auth.uid() AND f.friend_id = user_locations.user_id)
       OR (f.friend_id = auth.uid() AND f.user_id = user_locations.user_id)
  )
  AND EXISTS (
    SELECT 1 FROM public.location_sharing_preferences lsp
    WHERE lsp.user_id = user_locations.user_id
    AND lsp.share_with_friends = true
  )
  AND is_active = true
);

-- Users can insert their own location
CREATE POLICY "Users can insert their own location"
ON public.user_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own location
CREATE POLICY "Users can update their own location"
ON public.user_locations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Location sharing preferences policies
CREATE POLICY "Users can view their own sharing preferences"
ON public.location_sharing_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view friends' sharing preferences (to know if they're sharing)
CREATE POLICY "Users can view friends' sharing preferences"
ON public.location_sharing_preferences
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (f.user_id = auth.uid() AND f.friend_id = location_sharing_preferences.user_id)
       OR (f.friend_id = auth.uid() AND f.user_id = location_sharing_preferences.user_id)
  )
);

-- Users can update their own sharing preferences
CREATE POLICY "Users can update their own sharing preferences"
ON public.location_sharing_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can insert their own sharing preferences
CREATE POLICY "Users can insert their own sharing preferences"
ON public.location_sharing_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2FA POLICIES
-- ============================================

-- Users can only view their own 2FA secrets
CREATE POLICY "Users can view their own 2FA secrets"
ON public.user_2fa_secrets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own 2FA secrets
CREATE POLICY "Users can insert their own 2FA secrets"
ON public.user_2fa_secrets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own 2FA secrets
CREATE POLICY "Users can update their own 2FA secrets"
ON public.user_2fa_secrets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create bidirectional friendship when request is accepted
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Create bidirectional friendship
    INSERT INTO public.friendships (user_id, friend_id)
    VALUES (NEW.requester_id, NEW.addressee_id)
    ON CONFLICT (user_id, friend_id) DO NOTHING;
    
    INSERT INTO public.friendships (user_id, friend_id)
    VALUES (NEW.addressee_id, NEW.requester_id)
    ON CONFLICT (user_id, friend_id) DO NOTHING;
    
    -- Create default location sharing preferences if they don't exist
    INSERT INTO public.location_sharing_preferences (user_id, share_with_friends)
    VALUES (NEW.requester_id, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.location_sharing_preferences (user_id, share_with_friends)
    VALUES (NEW.addressee_id, true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for friend request acceptance
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_friend_request_accepted();

-- Function to update location sharing preferences timestamp
CREATE OR REPLACE FUNCTION public.update_location_sharing_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for location sharing preferences
CREATE TRIGGER update_location_sharing_updated_at
  BEFORE UPDATE ON public.location_sharing_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_location_sharing_updated_at();

-- Function to update 2FA updated_at
CREATE OR REPLACE FUNCTION public.update_2fa_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for 2FA secrets
CREATE TRIGGER update_2fa_updated_at
  BEFORE UPDATE ON public.user_2fa_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_2fa_updated_at();

-- Function to get user's friends with their latest location
CREATE OR REPLACE FUNCTION public.get_friends_with_locations(user_uuid UUID)
RETURNS TABLE (
  friend_id UUID,
  friend_username TEXT,
  friend_avatar_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_timestamp TIMESTAMP WITH TIME ZONE,
  is_sharing BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.friend_id,
    p.username,
    p.avatar_url,
    ul.latitude,
    ul.longitude,
    ul.timestamp,
    COALESCE(lsp.share_with_friends, false) as is_sharing
  FROM public.friendships f
  LEFT JOIN public.profiles p ON p.user_id = f.friend_id
  LEFT JOIN public.user_locations ul ON ul.user_id = f.friend_id AND ul.is_active = true
  LEFT JOIN public.location_sharing_preferences lsp ON lsp.user_id = f.friend_id
  WHERE f.user_id = user_uuid
  ORDER BY ul.timestamp DESC NULLS LAST;
END;
$$;


