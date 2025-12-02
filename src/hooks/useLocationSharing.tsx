import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocationPermission } from './useLocationPermission';

export interface FriendLocation {
  friend_id: string;
  friend_username: string | null;
  friend_avatar_url: string | null;
  latitude: number;
  longitude: number;
  location_timestamp: string;
  is_sharing: boolean;
}

export interface LocationSharingPreferences {
  share_with_friends: boolean;
  share_with_all: boolean;
}

const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour

export function useLocationSharing(userId: string | undefined) {
  const [friendsLocations, setFriendsLocations] = useState<FriendLocation[]>([]);
  const [sharingPreferences, setSharingPreferences] = useState<LocationSharingPreferences | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const locationIntervalIdRef = useRef<number | null>(null);
  const { toast } = useToast();
  const { permission, getCurrentLocation } = useLocationPermission();

  // Fetch friends' locations
  const fetchFriendsLocations = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase.rpc('get_friends_with_locations', {
        user_uuid: userId,
      });

      if (error) throw error;

      setFriendsLocations(data || []);
    } catch (error) {
      console.error('Error fetching friends locations:', error);
      // Only show toast on initial load or manual refresh, not on background polling to avoid spam
      if (loading) {
        toast({
          title: 'Error',
          description: 'Failed to load friends locations',
          variant: 'destructive',
        });
      }
      setFriendsLocations([]);
    }
  }, [userId, loading, toast]);

  // Fetch location sharing preferences
  const fetchSharingPreferences = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('location_sharing_preferences')
        .select('share_with_friends, share_with_all')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSharingPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs: LocationSharingPreferences = {
          share_with_friends: true,
          share_with_all: false,
        };
        const { error: insertError } = await supabase
          .from('location_sharing_preferences')
          .insert({
            user_id: userId,
            ...defaultPrefs,
          });

        if (!insertError) {
          setSharingPreferences(defaultPrefs);
        }
      }
    } catch (error) {
      console.error('Error fetching sharing preferences:', error);
    }
  }, [userId]);

  // Update location sharing preferences
  const updateSharingPreferences = useCallback(async (prefs: Partial<LocationSharingPreferences>) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('location_sharing_preferences')
        .upsert({
          user_id: userId,
          share_with_friends: prefs.share_with_friends ?? sharingPreferences?.share_with_friends ?? true,
          share_with_all: prefs.share_with_all ?? sharingPreferences?.share_with_all ?? false,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      await fetchSharingPreferences();
      toast({
        title: 'Preferences updated',
        description: 'Location sharing preferences have been updated',
      });
      return true;
    } catch (error: unknown) {
      console.error('Error updating sharing preferences:', error);
      toast({
        title: 'Error',
        description: (error as any).message || 'Failed to update preferences',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, sharingPreferences, toast, fetchSharingPreferences]);

  // Update user's location in database
  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    if (!userId || !sharingPreferences?.share_with_friends) return;

    try {
      // First, deactivate all existing locations for this user
      await supabase
        .from('user_locations')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Insert new active location
      const { error } = await supabase
        .from('user_locations')
        .insert({
          user_id: userId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || null,
          heading: position.coords.heading || null,
          speed: position.coords.speed || null,
          is_active: true,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [userId, sharingPreferences]);

  // Start sharing location
  const startSharingLocation = useCallback(async () => {
    if (!userId || permission !== 'granted') {
      toast({
        title: 'Location permission required',
        description: 'Please enable location access to share your location',
        variant: 'destructive',
      });
      return false;
    }

    // Update preferences to enable sharing
    const success = await updateSharingPreferences({ share_with_friends: true });
    if (!success) return false;

    // Get initial location
    const position = await getCurrentLocation();
    if (position) {
      await updateLocation(position);
    }

    // Start polling location
    // Clear any existing interval first
    if (locationIntervalIdRef.current !== null) {
      window.clearInterval(locationIntervalIdRef.current);
    }

    const intervalId = window.setInterval(async () => {
      const pos = await getCurrentLocation();
      if (pos) {
        updateLocation(pos);
      }
    }, UPDATE_INTERVAL);

    locationIntervalIdRef.current = intervalId;
    setIsSharing(true);
    toast({
      title: 'Location sharing started',
      description: 'Your location will be updated every hour',
    });
    return true;

  }, [userId, permission, toast, updateSharingPreferences, getCurrentLocation, updateLocation]);

  // Stop sharing location
  const stopSharingLocation = useCallback(async () => {
    if (locationIntervalIdRef.current !== null) {
      window.clearInterval(locationIntervalIdRef.current);
      locationIntervalIdRef.current = null;
    }

    // Deactivate all locations
    if (userId) {
      await supabase
        .from('user_locations')
        .update({ is_active: false })
        .eq('user_id', userId);
    }

    setIsSharing(false);
    toast({
      title: 'Location sharing stopped',
      description: 'Your location is no longer being shared',
    });
  }, [userId, toast]);

  // Load data on mount
  useEffect(() => {
    if (userId) {
      setLoading(true);
      Promise.all([fetchFriendsLocations(), fetchSharingPreferences()]).finally(() => {
        setLoading(false);
      });
    }
  }, [userId, fetchFriendsLocations, fetchSharingPreferences]);

  // Auto-start sharing if enabled in preferences
  useEffect(() => {
    if (!loading && sharingPreferences?.share_with_friends && !isSharing && permission === 'granted') {
      startSharingLocation();
    }
  }, [loading, sharingPreferences, isSharing, permission, startSharingLocation]);

  // Set up polling for friends' locations
  useEffect(() => {
    if (!userId) return;

    // Initial fetch is handled by the "Load data on mount" effect

    const intervalId = setInterval(() => {
      fetchFriendsLocations();
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [userId, fetchFriendsLocations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationIntervalIdRef.current !== null) {
        window.clearInterval(locationIntervalIdRef.current);
      }
    };
  }, []);

  return {
    friendsLocations,
    sharingPreferences,
    isSharing,
    loading,
    fetchFriendsLocations,
    updateSharingPreferences,
    startSharingLocation,
    stopSharingLocation,
  };
}
