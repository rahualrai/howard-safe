import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export type EmergencyContact = Tables<'emergency_contacts'>;

export interface EmergencyContactCategory {
  category: string;
  icon: any;
  items: EmergencyContact[];
}

export function useEmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Load cached data from localStorage
  const loadCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem('emergency-contacts-cache');
      const cachedSyncTime = localStorage.getItem('emergency-contacts-last-sync');
      
      if (cached) {
        const parsedContacts = JSON.parse(cached);
        setContacts(parsedContacts);
        setLoading(false);
      }
      
      if (cachedSyncTime) {
        setLastSyncTime(new Date(cachedSyncTime));
      }
    } catch (error) {
      console.error('Error loading cached emergency contacts:', error);
    }
  }, []);

  // Save data to localStorage
  const saveToCache = useCallback((data: EmergencyContact[], syncTime: Date) => {
    try {
      localStorage.setItem('emergency-contacts-cache', JSON.stringify(data));
      localStorage.setItem('emergency-contacts-last-sync', syncTime.toISOString());
    } catch (error) {
      console.error('Error saving emergency contacts to cache:', error);
    }
  }, []);

  // Fetch contacts from database
  const fetchContacts = useCallback(async (useCache = true) => {
    // Load cached data first for immediate display
    if (useCache) {
      loadCachedData();
    }

    try {
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('title', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setContacts(data);
        const now = new Date();
        setLastSyncTime(now);
        saveToCache(data, now);
        
        toast({
          title: "Contacts updated",
          description: "Emergency contacts have been refreshed from the server.",
        });
      }
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch contacts');
      
      // If we don't have cached data and fetch fails, show error
      if (!useCache || contacts.length === 0) {
        toast({
          title: "Unable to load contacts",
          description: "Please check your internet connection and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Using cached data",
          description: "Showing previously loaded emergency contacts.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedData, saveToCache, toast, contacts.length]);

  // Initial load
  useEffect(() => {
    fetchContacts(true);
  }, [fetchContacts]);

  // Group contacts by category for UI display
  const groupedContacts = contacts.reduce((acc, contact) => {
    const categoryKey = contact.category;
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(contact);
    return acc;
  }, {} as Record<string, EmergencyContact[]>);

  return {
    contacts,
    groupedContacts,
    loading,
    error,
    lastSyncTime,
    refetch: () => fetchContacts(false),
    isOnline: navigator.onLine,
  };
}
