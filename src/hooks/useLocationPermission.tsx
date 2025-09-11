import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface LocationPermissionState {
  permission: PermissionState | 'unknown';
  isLoading: boolean;
  error: string | null;
  location: GeolocationPosition | null;
}

export interface UseLocationPermissionReturn extends LocationPermissionState {
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<GeolocationPosition | null>;
  watchLocation: (callback: (position: GeolocationPosition) => void) => number | null;
  clearWatch: (watchId: number) => void;
}

export const useLocationPermission = (): UseLocationPermissionReturn => {
  const [permission, setPermission] = useState<PermissionState | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const { toast } = useToast();

  // Check initial permission status
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(result.state);
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          setPermission(result.state);
        });
      }
    } catch (err) {
      console.warn('Permission API not available:', err);
      setPermission('unknown');
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser');
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermission('granted');
          setLocation(position);
          setIsLoading(false);
          toast({
            title: "Location Access Granted",
            description: "You can now use location-based features for enhanced safety.",
          });
          resolve(true);
        },
        (err) => {
          setIsLoading(false);
          let errorMessage = '';
          let toastTitle = '';
          let toastDescription = '';

          switch (err.code) {
            case err.PERMISSION_DENIED:
              setPermission('denied');
              errorMessage = 'Location access denied by user';
              toastTitle = "Location Access Denied";
              toastDescription = "Please enable location access in your browser settings to use safety features.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              toastTitle = "Location Unavailable";
              toastDescription = "Unable to determine your location. Please try again.";
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out';
              toastTitle = "Location Timeout";
              toastDescription = "Location request took too long. Please try again.";
              break;
            default:
              errorMessage = 'An unknown error occurred';
              toastTitle = "Location Error";
              toastDescription = "Something went wrong while accessing your location.";
              break;
          }

          setError(errorMessage);
          toast({
            title: toastTitle,
            description: toastDescription,
            variant: "destructive",
          });
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, [toast]);

  const getCurrentLocation = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported');
      return null;
    }

    if (permission === 'denied') {
      toast({
        title: "Location Access Required",
        description: "Please enable location access in your browser settings to use this feature.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setIsLoading(false);
          resolve(position);
        },
        (err) => {
          setIsLoading(false);
          setError(err.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, [permission, toast]);

  const watchLocation = useCallback((callback: (position: GeolocationPosition) => void): number | null => {
    if (!('geolocation' in navigator) || permission === 'denied') {
      return null;
    }

    return navigator.geolocation.watchPosition(
      callback,
      (err) => {
        setError(err.message);
        console.error('Location watch error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [permission]);

  const clearWatch = useCallback((watchId: number) => {
    navigator.geolocation.clearWatch(watchId);
  }, []);

  return {
    permission,
    isLoading,
    error,
    location,
    requestPermission,
    getCurrentLocation,
    watchLocation,
    clearWatch,
  };
};