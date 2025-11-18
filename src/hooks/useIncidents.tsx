import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Incident {
  id: string;
  user_id: string | null;
  category: string;
  category_custom: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string;
  incident_time: string | null;
  reported_at: string;
  is_anonymous: boolean;
  status: string;
  client_info: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentWithPhotos extends Incident {
  incident_photos?: Array<{
    id: string;
    incident_id: string;
    storage_path: string;
    file_size: number | null;
    created_at: string;
  }>;
}

/**
 * Hook to fetch incidents from the database
 * Optionally filter by status, category, or recent incidents
 */
export const useIncidents = (options?: {
  status?: string;
  category?: string;
  limit?: number;
  includePhotos?: boolean;
  onlyRecent?: boolean;
}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['incidents', options?.status, options?.category, options?.limit],
    queryFn: async () => {
      try {
        let query = supabase
          .from('incident_reports')
          .select(
            options?.includePhotos
              ? '*, incident_photos(*)'
              : '*'
          )
          .eq('is_anonymous', false); // Only fetch public incidents

        // Filter by status if provided
        if (options?.status) {
          query = query.eq('status', options.status);
        }

        // Filter by category if provided
        if (options?.category) {
          query = query.eq('category', options.category);
        }

        // Order by most recent
        query = query.order('reported_at', { ascending: false });

        // Limit results
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch incidents: ${error.message}`);
        }

        return (data || []) as IncidentWithPhotos[];
      } catch (error) {
        console.error('Error fetching incidents:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
  });

  return query;
};

/**
 * Hook to fetch a single incident with its photos
 */
export const useIncident = (incidentId: string | null) => {
  return useQuery({
    queryKey: ['incident', incidentId],
    queryFn: async () => {
      if (!incidentId) return null;

      try {
        const { data, error } = await supabase
          .from('incident_reports')
          .select('*, incident_photos(*)')
          .eq('id', incidentId)
          .eq('is_anonymous', false)
          .single();

        if (error) {
          throw new Error(`Failed to fetch incident: ${error.message}`);
        }

        return data as IncidentWithPhotos;
      } catch (error) {
        console.error('Error fetching incident:', error);
        throw error;
      }
    },
    enabled: !!incidentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to fetch incidents within a geographic area
 */
export const useIncidentsNearby = (
  latitude: number | null,
  longitude: number | null,
  radiusKm: number = 5
) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['incidents-nearby', latitude, longitude, radiusKm],
    queryFn: async () => {
      if (latitude === null || longitude === null) return [];

      try {
        // Fetch all public incidents and filter by distance
        const { data, error } = await supabase
          .from('incident_reports')
          .select('*')
          .eq('is_anonymous', false)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('reported_at', { ascending: false })
          .limit(50);

        if (error) {
          throw new Error(`Failed to fetch incidents: ${error.message}`);
        }

        // Filter by distance
        const incidents = (data || []) as Incident[];
        return incidents.filter((incident) => {
          if (incident.latitude === null || incident.longitude === null) {
            return false;
          }

          const distance = calculateDistance(
            latitude,
            longitude,
            incident.latitude,
            incident.longitude
          );

          return distance <= radiusKm;
        });
      } catch (error) {
        console.error('Error fetching nearby incidents:', error);
        throw error;
      }
    },
    enabled: latitude !== null && longitude !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Helper function to calculate distance between two coordinates (haversine formula)
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Hook to watch for new incidents in real-time using Supabase subscriptions
 */
export const useIncidentStream = () => {
  const queryClient = useQueryClient();

  // Subscribe to incident changes
  const subscription = supabase
    .channel('incidents')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'incident_reports' },
      (payload) => {
        // Invalidate and refetch incidents when changes occur
        queryClient.invalidateQueries({ queryKey: ['incidents'] });
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
