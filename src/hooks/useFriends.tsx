import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Friend {
  id: string;
  friend_id: string;
  username: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  requester?: {
    username: string | null;
    email: string;
    avatar_url: string | null;
  };
  addressee?: {
    username: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface UserSearchResult {
  user_id: string;
  username: string | null;
  email: string;
  avatar_url: string | null;
}

export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const { toast } = useToast();

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('id, friend_id, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        return;
      }

      const friendIds = friendships.map((friendship: unknown) => friendship.friend_id);

      const profilesMap = new Map<string, unknown>();

      if (friendIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', friendIds);

        if (profilesError) throw profilesError;

        profiles?.forEach((profile: unknown) => {
          profilesMap.set(profile.user_id, profile);
        });
      }

      // Map friends data from fetched profiles
      const friendsWithProfiles = friendships.map((friendship: unknown) => {
        const profile = profilesMap.get(friendship.friend_id);
        return {
          id: friendship.id,
          friend_id: friendship.friend_id,
          username: profile?.username || null,
          email: '', // Email not available from client-side queries
          avatar_url: profile?.avatar_url || null,
          created_at: friendship.created_at,
        };
      });

      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: 'Error',
        description: 'Failed to load friends',
        variant: 'destructive',
      });
    }
  }, [userId, toast]);

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async () => {
    if (!userId) return;

    try {
      // Get requests where user is requester or addressee
      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!requests || requests.length === 0) {
        setFriendRequests([]);
        return;
      }

      const userIds = Array.from(
        new Set(
          requests.flatMap((request: unknown) => [request.requester_id, request.addressee_id])
        )
      );

      const profilesMap = new Map<string, unknown>();

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        profiles?.forEach((profile: unknown) => {
          profilesMap.set(profile.user_id, profile);
        });
      }

      const enrichedRequests: FriendRequest[] = requests.map((request: unknown) => ({
        ...request,
        requester: profilesMap.get(request.requester_id) || undefined,
        addressee: profilesMap.get(request.addressee_id) || undefined,
      }));

      setFriendRequests(enrichedRequests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }, [userId]);

  // Search users by email or username
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !userId) {
      setSearchResults([]);
      return;
    }

    try {
      // Search profiles by username
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('user_id', userId)
        .limit(10);

      if (profileError) throw profileError;

      // For each profile, try to get email (we'll use a workaround since we can't directly query auth.users)
      // We'll show username and let users search by email too
      const results: UserSearchResult[] = (profiles || []).map((profile: unknown) => ({
        user_id: profile.user_id,
        username: profile.username,
        email: '', // We'll populate this if needed
        avatar_url: profile.avatar_url,
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    }
  }, [userId, toast]);

  // Send friend request
  const sendFriendRequest = useCallback(async (addresseeId: string) => {
    if (!userId) return false;

    try {
      // Check if already friends
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', userId)
        .eq('friend_id', addresseeId)
        .maybeSingle();

      if (existingFriendship) {
        toast({
          title: 'Already friends',
          description: 'You are already friends with this user',
          variant: 'default',
        });
        return false;
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${userId})`)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast({
            title: 'Request pending',
            description: 'A friend request already exists',
            variant: 'default',
          });
          return false;
        }
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: userId,
          addressee_id: addresseeId,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Friend request sent',
        description: 'Your friend request has been sent',
      });

      await fetchFriendRequests();
      return true;
    } catch (error: unknown) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send friend request',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, toast, fetchFriendRequests]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('addressee_id', userId);

      if (error) throw error;

      toast({
        title: 'Friend request accepted',
        description: 'You are now friends!',
      });

      await Promise.all([fetchFriends(), fetchFriendRequests()]);
      return true;
    } catch (error: unknown) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept friend request',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, toast, fetchFriends, fetchFriendRequests]);

  // Reject friend request
  const rejectFriendRequest = useCallback(async (requestId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('addressee_id', userId);

      if (error) throw error;

      toast({
        title: 'Friend request rejected',
      });

      await fetchFriendRequests();
      return true;
    } catch (error: unknown) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject friend request',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, toast, fetchFriendRequests]);

  // Cancel friend request
  const cancelFriendRequest = useCallback(async (requestId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('requester_id', userId);

      if (error) throw error;

      toast({
        title: 'Friend request cancelled',
      });

      await fetchFriendRequests();
      return true;
    } catch (error: unknown) {
      console.error('Error cancelling friend request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel friend request',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, toast, fetchFriendRequests]);

  // Remove friend
  const removeFriend = useCallback(async (friendId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', friendId);

      if (error) throw error;

      toast({
        title: 'Friend removed',
        description: 'Friend has been removed',
      });

      await fetchFriends();
      return true;
    } catch (error: unknown) {
      console.error('Error removing friend:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove friend',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, toast, fetchFriends]);

  // Load data on mount and when userId changes
  useEffect(() => {
    if (userId) {
      setLoading(true);
      Promise.all([fetchFriends(), fetchFriendRequests()]).finally(() => {
        setLoading(false);
      });
    }
  }, [userId, fetchFriends, fetchFriendRequests]);

  return {
    friends,
    friendRequests,
    searchResults,
    loading,
    fetchFriends,
    fetchFriendRequests,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
  };
}

