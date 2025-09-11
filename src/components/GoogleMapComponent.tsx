import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Navigation, MapIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Array<{
    position: { lat: number; lng: number };
    title: string;
    type: 'safe' | 'incident' | 'welllit';
  }>;
}

const GoogleMapComponent: React.FC<GoogleMapProps> = ({ center, zoom, markers }) => {
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
      });
      setMap(googleMap);
    }
  }, [center, zoom, map]);

  useEffect(() => {
    if (map) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add new markers with improved styling
      markers.forEach(marker => {
        const markerIcon = getMarkerIcon(marker.type);
        
        const googleMarker = new google.maps.Marker({
          position: marker.position,
          map,
          title: marker.title,
          icon: markerIcon,
          animation: marker.type === 'incident' ? google.maps.Animation.BOUNCE : undefined,
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <h3 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">${marker.title}</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">${getMarkerDescription(marker.type)}</p>
              <div style="margin-top: 8px; padding: 4px 8px; background: ${getMarkerColor(marker.type)}; color: white; border-radius: 4px; font-size: 12px; display: inline-block;">
                ${marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}
              </div>
            </div>
          `
        });

        googleMarker.addListener('click', () => {
          infoWindow.open(map, googleMarker);
        });

        markersRef.current.push(googleMarker);
      });
    }
  }, [map, markers]);

  // Helper functions for marker styling
  const getMarkerIcon = (type: string) => {
    const colors = {
      safe: '#22c55e',      // Green
      incident: '#ef4444',  // Red
      welllit: '#3b82f6',   // Blue
    };

    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: colors[type as keyof typeof colors] || '#6b7280',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      strokeOpacity: 1,
    };
  };

  const getMarkerColor = (type: string) => {
    const colors = {
      safe: '#22c55e',
      incident: '#ef4444',
      welllit: '#3b82f6',
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  };

  const getMarkerDescription = (type: string) => {
    const descriptions = {
      safe: 'Safe zone with security presence',
      incident: 'Recent security incident reported',
      welllit: 'Well-lit area for safer walking',
    };
    return descriptions[type as keyof typeof descriptions] || 'Campus location';
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
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
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
          () => {}, // Silently fail if no permission
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
        );
      }
    }
  }, [map, center, zoom]);

  return (
    <div className="relative w-full h-96">
      <div ref={mapRef} className="absolute inset-0 rounded-lg" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
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
      <div className="absolute bottom-4 left-4 z-10">
        <Badge variant="secondary" className="bg-card shadow-soft border-border">
          <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
          Current Location
        </Badge>
      </div>
    </div>
  );
};

const LoadingComponent = () => (
  <div className="h-96 bg-muted/30 border-b border-border relative overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground text-sm">Loading Map...</p>
      </div>
    </div>
  </div>
);

const ErrorComponent = ({ error }: { error: string }) => (
  <div className="h-96 bg-muted/30 border-b border-border relative overflow-hidden">
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