
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Navigation, MapIcon } from 'lucide-react';
import { LandmarkCategory } from '@/data/howardLandmarks';
import type { BuildingCategory } from '@/data/howardBuildingsComplete';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: typeof google;
  }
}

export type IncidentCategory = 'theft' | 'harassment' | 'suspicious_activity' | 'safety_hazard' | 'medical_emergency' | 'other';
export type MarkerType = 'safe' | 'incident' | 'welllit' | 'friend' | LandmarkCategory | IncidentCategory | BuildingCategory;

export interface MapMarker {
  position: { lat: number; lng: number };
  title: string;
  type: MarkerType;
  description?: string;
  details?: {
    hours?: string;
    phone?: string;
    address?: string;
    timestamp?: string;
    friendId?: string;
    // Incident-specific details
    incidentCategory?: string;
    incidentStatus?: string;
    incidentTime?: string;
    reportedTime?: string;
    photos?: Array<{
      url: string;
      alt: string;
    }>;
  };
}

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
}

const GoogleMapComponent: React.FC<GoogleMapProps> = ({ center, zoom, markers, onMarkerClick }) => {
  const [map, setMap] = useState<google.maps.Map>();
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userLocationMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (mapRef.current && !map) {
      const googleMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false, // Disable default zoom control
      });
      setMap(googleMap);
    }
  }, [center, zoom, map]);

  useEffect(() => {
    if (map) {
      // Clear existing markers
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];

      // Add new markers with standard markers
      markers.forEach((m) => {
        const color = getMarkerColor(m.type);
        const isFriend = m.type === 'friend';

        const marker = new google.maps.Marker({
          position: m.position,
          map,
          title: m.title,
          icon: {
            path: isFriend
              ? "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" // Person icon
              : google.maps.SymbolPath.CIRCLE,
            scale: isFriend ? 1.5 : 6, // Adjusted scale for the pin path
            fillColor: isFriend ? '#4285F4' : color, // Use Google blue for friend marker
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: isFriend ? 1 : 3,
            rotation: 0,
            anchor: isFriend ? new google.maps.Point(12, 12) : undefined, // Anchor at center
          },
          zIndex: (m.type === 'incident' || ['theft', 'harassment', 'suspicious_activity', 'safety_hazard', 'medical_emergency', 'other'].includes(m.type)) ? 100 : m.type === 'friend' ? 50 : 10,
        });

        marker.addListener('click', () => {
          if (onMarkerClick) {
            onMarkerClick(m);
          }
          // Center map on marker when clicked
          map.panTo(marker.getPosition() as google.maps.LatLng);
        });

        markersRef.current.push(marker);
      });
    }
  }, [map, markers, onMarkerClick]);

  // Helper functions for marker styling
  const getMarkerColor = (type: string) => {
    const colors: Record<string, string> = {
      safe: '#22c55e',
      incident: '#ef4444',
      welllit: '#f59e0b',
      friend: '#3b82f6',
      // Landmark categories (lowercase)
      academic: '#3b82f6',
      dining: '#f59e0b',
      safety: '#ef4444',
      residential: '#8b5cf6',
      // Building categories (Capitalized)
      Academic: '#3b82f6',
      Residential: '#8b5cf6',
      Dining: '#f59e0b',
      Administrative: '#10b981',
      Athletic: '#ef4444',
      Medical: '#ec4899',
      Safety: '#f59e0b',
      Parking: '#6b7280',
      Utility: '#8b5cf6',
      Research: '#06b6d4',
      Library: '#0ea5e9',
      Other: '#6b7280',
      // Incident category types
      theft: '#ef4444',           // red
      harassment: '#a855f7',      // purple
      suspicious_activity: '#f97316', // orange
      safety_hazard: '#eab308',   // yellow
      medical_emergency: '#ec4899', // pink
      other: '#6b7280',           // gray
    };
    return colors[type] || '#6b7280';
  };

  const getMarkerDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      // Legacy types
      safe: 'Safe zone',
      incident: 'Incident reported',
      welllit: 'Well-lit area',
      // Building categories
      Academic: 'Academic Building',
      Residential: 'Residential Hall',
      Dining: 'Dining Facility',
      Administrative: 'Administrative',
      Athletic: 'Athletic Facility',
      Medical: 'Medical Facility',
      Safety: 'Safety & Security',
      Parking: 'Parking',
      Utility: 'Utility Building',
      Research: 'Research Center',
      Library: 'Library',
      Other: 'Building',
      // Incident categories
      theft: 'Theft/Property Crime',
      harassment: 'Harassment',
      suspicious_activity: 'Suspicious Activity',
      safety_hazard: 'Safety Hazard',
      medical_emergency: 'Medical Emergency',
    };
    return descriptions[type] || 'Campus location';
  };

  const zoomIn = useCallback(() => {
    if (map) {
      map.setZoom((map.getZoom() || 15) + 1);
    }
  }, [map]);

  const zoomOut = useCallback(() => {
    if (map) {
      map.setZoom((map.getZoom() || 15) - 1);
    }
  }, [map]);

  const recenterToUserLocation = useCallback(() => {
    if (map && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(userLocation);
          map.setZoom(18);

          // Add or update user location marker
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.setPosition(userLocation);
          } else {
            userLocationMarkerRef.current = new google.maps.Marker({
              position: userLocation,
              map,
              title: "Your Current Location",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 4,
              },
              zIndex: 1000,
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [map]);

  // Update map center when props change
  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);

      // Auto-add user location marker if we have location permission
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            // Only add user marker if it doesn't exist
            if (!userLocationMarkerRef.current) {
              userLocationMarkerRef.current = new google.maps.Marker({
                position: userLocation,
                map,
                title: "Your Current Location",
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 4,
                },
                zIndex: 1000,
              });
            } else {
              userLocationMarkerRef.current.setPosition(userLocation);
            }
          },
          () => { }, // Silently fail if no permission
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
      }
    }
  }, [map, center, zoom]);

  return (
    <div className="relative w-full flex-1 md:h-full md:rounded-none">
      <div ref={mapRef} className="absolute inset-0 md:rounded-none rounded-lg" />

      {/* Map Controls */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
        <Button
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-card shadow-soft"
          onClick={zoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-card shadow-soft"
          onClick={zoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-card shadow-soft"
          onClick={recenterToUserLocation}
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      {/* Current Location Indicator */}
      <div className="absolute bottom-24 left-4 z-10 md:bottom-4">
        <Badge variant="secondary" className="bg-card shadow-soft border-border">
          <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
          Current Location
        </Badge>
      </div>
    </div>
  );
};

const LoadingComponent = () => (
  <div className="flex-1 md:h-full bg-muted/30 border-b border-border relative overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground text-sm">Loading Map...</p>
      </div>
    </div>
  </div>
);

const ErrorComponent = ({ error }: { error: string }) => (
  <div className="flex-1 md:h-full bg-muted/30 border-b border-border relative overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <MapIcon size={48} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">Failed to load map</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    </div>
  </div>
);

export const GoogleMap: React.FC<Omit<GoogleMapProps, 'apiKey'>> = (props) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');

        if (error) throw error;
        if (!data?.apiKey) throw new Error('No API key received');

        setApiKey(data.apiKey);
      } catch (err) {
        console.error('Error fetching Google Maps API key:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  if (loading) return <LoadingComponent />;
  if (error || !apiKey) return <ErrorComponent error={error || 'No API key'} />;

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <LoadingComponent />;
      case Status.FAILURE:
        return <ErrorComponent error="Failed to load Google Maps" />;
      case Status.SUCCESS:
        return <GoogleMapComponent {...props} />;
    }
  };

  return (
    <Wrapper apiKey={apiKey} render={render} />
  );
};