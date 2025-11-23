import { supabase } from '@/integrations/supabase/client';

export interface EmergencyAlertData {
  alertType?: string;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  message?: string;
}

export interface EmergencyAlertResult {
  success: boolean;
  alertId?: string;
  contactsNotified: number;
  error?: string;
}

/**
 * Gets the user's current location using browser Geolocation API
 */
async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return null;
    }

    // Get current position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

/**
 * Reverse geocodes coordinates to get a human-readable address
 * This is a simplified version - you may want to use a real geocoding service
 */
async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    // Using OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'BetterSafe-HowardUniversity'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    // Return coordinates as fallback
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Sends emergency alerts to all user's emergency contacts
 * This creates a record in the database and can trigger notifications via Edge Functions
 */
export async function sendEmergencyAlert(
  data?: EmergencyAlertData
): Promise<EmergencyAlertResult> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('user_emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (contactsError) {
      throw new Error('Failed to fetch emergency contacts');
    }

    if (!contacts || contacts.length === 0) {
      return {
        success: false,
        contactsNotified: 0,
        error: 'No emergency contacts configured'
      };
    }

    // Get current location
    const locationData = {
      lat: data?.locationLat,
      lng: data?.locationLng,
      address: data?.locationAddress
    };

    if (!locationData.lat || !locationData.lng) {
      const location = await getCurrentLocation();
      if (location) {
        locationData.lat = location.lat;
        locationData.lng = location.lng;
        
        // Get address from coordinates
        if (!locationData.address) {
          locationData.address = await getAddressFromCoordinates(location.lat, location.lng);
        }
      }
    }

    // Create the emergency alert record
    const { data: alert, error: alertError } = await supabase
      .from('emergency_alerts')
      .insert([{
        user_id: user.id,
        alert_type: data?.alertType || 'quick_help',
        location_lat: locationData.lat,
        location_lng: locationData.lng,
        location_address: locationData.address,
        message: data?.message || 'Emergency alert triggered',
        status: 'sent',
        contacts_notified: contacts.length
      }])
      .select()
      .single();

    if (alertError) {
      throw new Error('Failed to create emergency alert');
    }

    // TODO: In a production environment, need to call a Supabase Edge Function here
    // that sends SMS/email notifications to all the contacts
    console.log('Emergency alert created:', {
      alertId: alert.id,
      contactsNotified: contacts.length,
      contacts: contacts.map(c => ({ name: c.name, phone: c.phone, email: c.email })),
      location: locationData
    });

    // Invoke Edge Function to send notifications
    const { data: notificationResult, error: notificationError } = await supabase.functions.invoke('send-emergency-notifications', {
      body: {
        alertId: alert.id,
        contacts: contacts,
        location: locationData,
        userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'A user',
        timestamp: new Date().toISOString()
      }
    });

    if (notificationError) {
      console.error('Error sending notifications:', notificationError);
    } else {
      console.log('Notifications sent:', notificationResult);
    }

    return {
      success: true,
      alertId: alert.id,
      contactsNotified: contacts.length
    };
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    return {
      success: false,
      contactsNotified: 0,
      error: error instanceof Error ? error.message : 'Failed to send emergency alert'
    };
  }
}

/**
 * Gets the user's emergency alert history
 */
export async function getEmergencyAlertHistory(limit = 20): Promise<unknown[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching alert history:', error);
    return [];
  }
}
