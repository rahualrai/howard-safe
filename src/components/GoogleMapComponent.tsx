import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Navigation, MapIcon, Directions } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { LandmarkCategory } from '@/data/howardLandmarks';

declare global {
  interface Window {
    google: typeof google;
  }
}

type MarkerType = 'safe' | 'incident' | 'welllit' | LandmarkCategory;

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Array<{
    position: { lat: number; lng: number };
    title: string;
    type: MarkerType;
    description?: string;
    details?: {
      hours?: string;
      phone?: string;
      address?: string;
    };
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
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];

      // Add new markers with standard markers
      markers.forEach((m) => {
        const color = getMarkerColor(m.type);

        const marker = new google.maps.Marker({
          position: m.position,
          map,
          title: m.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
          zIndex: m.type === 'incident' ? 100 : 10,
        });

        // Build info window content
        const createInfoWindowContent = () => {
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${m.position.lat},${m.position.lng}`;

          return `
            <style>
              .landmark-info {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: 280px;
                max-width: 320px;
              }
              .landmark-info h3 {
                margin: 0 0 8px 0;
                color: #1a1a1a;
                font-size: 16px;
                font-weight: 600;
              }
              .landmark-info p {
                margin: 0 0 8px 0;
                color: #666;
                font-size: 14px;
                line-height: 1.4;
              }
              .landmark-details {
                margin: 8px 0;
                font-size: 13px;
                color: #555;
              }
              .detail-item {
                margin: 4px 0;
                padding: 4px 0;
              }
              .detail-label {
                font-weight: 600;
                color: #333;
              }
              .landmark-badge {
                display: inline-block;
                margin: 8px 0 0 0;
                padding: 4px 8px;
                background: ${color};
                color: white;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
              }
              .directions-button {
                display: inline-block;
                margin-top: 8px;
                padding: 8px 12px;
                background: #4285F4;
                color: white;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                text-decoration: none;
                cursor: pointer;
                margin-right: 4px;
              }
              .directions-button:hover {
                background: #3367D6;
              }
            </style>
            <div class="landmark-info">
              <h3>${m.title}</h3>
              ${m.description ? `<p>${m.description}</p>` : ''}
              ${m.details ? `
                <div class="landmark-details">
                  ${m.details.address ? `<div class="detail-item"><span class="detail-label">Address:</span><br>${m.details.address}</div>` : ''}
                  ${m.details.hours ? `<div class="detail-item"><span class="detail-label">Hours:</span><br>${m.details.hours}</div>` : ''}
                  ${m.details.phone ? `<div class="detail-item"><span class="detail-label">Phone:</span><br><a href="tel:${m.details.phone}">${m.details.phone}</a></div>` : ''}
                </div>
              ` : ''}
              <div>
                <a href="${directionsUrl}" target="_blank" class="directions-button">Get Directions →</a>
              </div>
              <div class="landmark-badge">${getMarkerDescription(m.type)}</div>
            </div>
          `;
        };

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(),
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        markersRef.current.push(marker);
      });
    }
  }, [map, markers]);

  // Helper functions for marker styling
  const getMarkerColor = (type: string) => {
    const colors: Record<string, string> = {
      // Legacy types
      safe: '#22c55e',
      incident: '#ef4444',
      welllit: '#3b82f6',
      // Landmark types
      academic: '#3b82f6',      // blue
      dining: '#f59e0b',         // amber
      safety: '#ef4444',         // red
      residential: '#8b5cf6',    // purple
    };
    return colors[type] || '#6b7280';
  };

  const getMarkerDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      // Legacy types
      safe: 'Safe zone with security presence',
      incident: 'Recent security incident reported',
      welllit: 'Well-lit area for safer walking',
      // Landmark types
      academic: 'Academic Building',
      dining: 'Dining & Food',
      safety: 'Safety & Security',
      residential: 'Residential Hall',
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