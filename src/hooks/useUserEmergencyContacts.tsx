import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserEmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserEmergencyContact {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority?: number;
}

export function useUserEmergencyContacts() {
  const [contacts, setContacts] = useState<UserEmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch user's emergency contacts
  const fetchContacts = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('user_emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setContacts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contacts';
      console.error('Error fetching user emergency contacts:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new emergency contact
  const addContact = useCallback(async (contact: CreateUserEmergencyContact) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('user_emergency_contacts')
        .insert([{
          user_id: user.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          relationship: contact.relationship,
          priority: contact.priority || 0,
          is_active: true
        }])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setContacts(prev => [...prev, data]);
      
      toast({
        title: "Contact added",
        description: `${contact.name} has been added to your emergency contacts.`,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact';
      console.error('Error adding emergency contact:', err);
      
      toast({
        title: "Failed to add contact",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    }
  }, [toast]);

  // Update an existing emergency contact
  const updateContact = useCallback(async (id: string, updates: Partial<CreateUserEmergencyContact>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: updateError } = await supabase
        .from('user_emergency_contacts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setContacts(prev => prev.map(c => c.id === id ? data : c));
      
      toast({
        title: "Contact updated",
        description: "Emergency contact has been updated successfully.",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      console.error('Error updating emergency contact:', err);
      
      toast({
        title: "Failed to update contact",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    }
  }, [toast]);

  // Delete an emergency contact
  const deleteContact = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: deleteError } = await supabase
        .from('user_emergency_contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      setContacts(prev => prev.filter(c => c.id !== id));
      
      toast({
        title: "Contact deleted",
        description: "Emergency contact has been removed.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      console.error('Error deleting emergency contact:', err);
      
      toast({
        title: "Failed to delete contact",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    }
  }, [toast]);

  // Set a contact as primary (priority = 1)
  const setPrimaryContact = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, set all contacts to priority 0
      await supabase
        .from('user_emergency_contacts')
        .update({ priority: 0 })
        .eq('user_id', user.id);

      // Then set the selected contact to priority 1
      await updateContact(id, { priority: 1 });
      
      toast({
        title: "Primary contact set",
        description: "This contact will be notified first in emergencies.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set primary contact';
      console.error('Error setting primary contact:', err);
      
      toast({
        title: "Failed to set primary contact",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    }
  }, [updateContact, toast]);

  // Initial load
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    setPrimaryContact,
    refetch: fetchContacts,
  };
}
