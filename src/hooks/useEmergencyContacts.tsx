import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export type EmergencyContact = Tables<'emergency_contacts'> & {
  user_id?: string | null; // User-specific contacts have user_id, global contacts have null
};

export interface EmergencyContactCategory {
  category: string;
  icon: any;
  items: EmergencyContact[];
}

// Fallback emergency contacts data (used when database is not available)
const FALLBACK_CONTACTS: EmergencyContact[] = [
  {
    id: '1',
    title: 'Campus Security',
    contact: '(202) 806-HELP (4357)',
    description: '24/7 campus emergency line',
    category: 'emergency-contacts',
    priority: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Metropolitan Police',
    contact: '911',
    description: 'Emergency police response',
    category: 'emergency-contacts',
    priority: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Howard University Hospital',
    contact: '(202) 865-6100',
    description: 'Campus medical emergency',
    category: 'emergency-contacts',
    priority: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Student Health Center',
    contact: '(202) 806-7540',
    description: 'Non-emergency medical care',
    category: 'emergency-contacts',
    priority: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Counseling Services',
    contact: '(202) 806-6870',
    description: 'Mental health support and counseling',
    category: 'support-services',
    priority: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Title IX Office',
    contact: '(202) 806-2550',
    description: 'Sexual harassment and discrimination reporting',
    category: 'support-services',
    priority: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    title: 'Dean of Students',
    contact: '(202) 806-2755',
    description: 'Student affairs and support',
    category: 'support-services',
    priority: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    title: 'Campus Ministry',
    contact: '(202) 806-7280',
    description: 'Spiritual guidance and support',
    category: 'support-services',
    priority: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '9',
    title: 'Safety Escort Service',
    contact: '(202) 806-4357',
    description: 'Free campus escort service (6 PM - 2 AM)',
    category: 'safety-resources',
    priority: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10',
    title: 'Blue Light Phones',
    contact: 'Campus-wide',
    description: 'Emergency phones located throughout campus',
    category: 'safety-resources',
    priority: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11',
    title: 'LiveSafe App',
    contact: 'Download from app store',
    description: 'Campus safety app for reporting and alerts',
    category: 'safety-resources',
    priority: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '12',
    title: 'Safety Training',
    contact: '(202) 806-1919',
    description: 'Personal safety workshops and training',
    category: 'safety-resources',
    priority: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useEmergencyContacts(userId?: string | null) {
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
      
      // Fetch both global contacts (user_id IS NULL) and user-specific contacts
      let query = supabase
        .from('emergency_contacts')
        .select('*')
        .eq('is_active', true);
      
      // If user is logged in, get global contacts + their personal contacts
      if (userId) {
        query = query.or(`user_id.is.null,user_id.eq.${userId}`);
      } else {
        // If not logged in, only get global contacts
        query = query.is('user_id', null);
      }
      
      const { data, error: fetchError } = await query
        .order('priority', { ascending: false })
        .order('title', { ascending: true });

      if (fetchError) {
        // Check if error is because table doesn't exist (PGRST116) or other database error
        if (fetchError.code === 'PGRST116' || fetchError.message.includes('relation') || fetchError.message.includes('does not exist')) {
          // Table doesn't exist - use fallback data
          console.warn('Emergency contacts table not found, using fallback data');
          const now = new Date();
          setContacts(FALLBACK_CONTACTS);
          setLastSyncTime(now);
          saveToCache(FALLBACK_CONTACTS, now);
          setError(null);
          return;
        }
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
      
      // If we have cached data, use it
      if (useCache && contacts.length > 0) {
        toast({
          title: "Using cached data",
          description: "Showing previously loaded emergency contacts.",
          variant: "destructive"
        });
        setError(null);
        return;
      }
      
      // If no cached data and fetch fails, use fallback data
      if (contacts.length === 0) {
        console.warn('No cached data available, using fallback emergency contacts');
        const now = new Date();
        setContacts(FALLBACK_CONTACTS);
        setLastSyncTime(now);
        saveToCache(FALLBACK_CONTACTS, now);
        setError(null);
        toast({
          title: "Using default contacts",
          description: "Database not available. Showing default emergency contacts.",
        });
      } else {
        setError(error instanceof Error ? error.message : 'Failed to fetch contacts');
        toast({
          title: "Unable to load contacts",
          description: "Please check your internet connection and try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedData, saveToCache, toast]);

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

  // Add user-specific contact
  const addUserContact = useCallback(async (contact: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add personal emergency contacts.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('emergency_contacts')
        .insert({
          ...contact,
          user_id: userId,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Refresh contacts
      await fetchContacts(false);
      
      toast({
        title: "Contact added",
        description: `${contact.title} has been added to your emergency contacts.`,
      });

      return data;
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Failed to add contact",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      return null;
    }
  }, [userId, fetchContacts, toast]);

  // Update user-specific contact
  const updateUserContact = useCallback(async (contactId: string, updates: {
    title?: string;
    contact?: string;
    description?: string;
    category?: string;
    priority?: number;
    is_active?: boolean;
  }) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update contacts.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Type assertion to avoid deep type instantiation issue with Supabase types
      const updatePayload: Record<string, unknown> = {
        ...updates,
      };
      // @ts-expect-error - Supabase type inference issue, but runtime works correctly
      const { error: updateError } = await supabase
        .from('emergency_contacts')
        .update(updatePayload)
        .eq('id', contactId)
        .eq('user_id', userId); // Ensure user can only update their own contacts

      if (updateError) throw updateError;

      // Refresh contacts
      await fetchContacts(false);
      
      toast({
        title: "Contact updated",
        description: "Your emergency contact has been updated.",
      });

      return true;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Failed to update contact",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      return false;
    }
  }, [userId, fetchContacts, toast]);

  // Delete user-specific contact
  const deleteUserContact = useCallback(async (contactId: string) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete contacts.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', userId); // Ensure user can only delete their own contacts

      if (deleteError) throw deleteError;

      // Refresh contacts
      await fetchContacts(false);
      
      toast({
        title: "Contact deleted",
        description: "Your emergency contact has been removed.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Failed to delete contact",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
      return false;
    }
  }, [userId, fetchContacts, toast]);

  return {
    contacts,
    groupedContacts,
    loading,
    error,
    lastSyncTime,
    refetch: () => fetchContacts(false),
    isOnline: navigator.onLine,
    addUserContact,
    updateUserContact,
    deleteUserContact,
    // Helper to check if contact is user-specific
    isUserContact: (contact: EmergencyContact) => contact.user_id !== null && contact.user_id !== undefined,
  };
}
