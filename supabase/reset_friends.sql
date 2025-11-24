-- Clear all friend requests and friendships
TRUNCATE TABLE public.friend_requests CASCADE;
TRUNCATE TABLE public.friendships CASCADE;

-- Optional: Reset location sharing preferences if you want a completely clean slate
-- TRUNCATE TABLE public.location_sharing_preferences CASCADE;
