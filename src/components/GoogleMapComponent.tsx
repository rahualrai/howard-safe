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

type MarkerType = 'safe' | 'incident' | 'welllit' | 'friend' | LandmarkCategory;

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
      timestamp?: string;
      friendId?: string;
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
        const isFriend = m.type === 'friend';

        const marker = new google.maps.Marker({
          position: m.position,
          map,
          title: m.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isFriend ? 8 : 6,
            fillColor: isFriend ? '#4285F4' : color, // Use Google blue for friend marker
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
            rotation: 0,
          },
          zIndex: m.type === 'incident' ? 100 : m.type === 'friend' ? 50 : 10,
        });

        // Build info window content - Minimalist & Modern Design
        const createInfoWindowContent = () => {
          // Friend marker info window
          if (m.type === 'friend') {
            const timestamp = m.details?.timestamp 
              ? new Date(m.details.timestamp).toLocaleString()
              : 'Unknown';
            const timeAgo = m.details?.timestamp
              ? (() => {
                  const diff = Math.floor((Date.now() - new Date(m.details.timestamp).getTime()) / 1000 / 60);
                  if (diff < 1) return 'Just now';
                  if (diff < 60) return `${diff}m ago`;
                  return `${Math.floor(diff / 60)}h ago`;
                })()
              : '';
            
            return `
              <style>
                * { box-sizing: border-box; }
                .friend-card {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                  width: 280px;
                  background: #ffffff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                  padding-top: 36px;
                  position: relative;
                }
                .friend-card h3 {
                  margin: 0 0 8px 0;
                  color: #1a1a1a;
                  font-size: 18px;
                  font-weight: 600;
                }
                .friend-card p {
                  margin: 0;
                  color: #6b7280;
                  font-size: 14px;
                }
                .friend-badge {
                  display: inline-block;
                  padding: 6px 12px;
                  background-color: #10b98120;
                  color: #10b981;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 600;
                  margin-top: 12px;
                }
              </style>
              <div class="friend-card">
                <h3>👤 ${m.title}</h3>
                <p>📍 Location shared</p>
                <p style="margin-top: 8px; font-size: 12px; color: #9ca3af;">${timeAgo} • ${timestamp}</p>
                <div class="friend-badge">Friend Location</div>
              </div>
            `;
          }

          // Building marker info window
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${m.position.lat},${m.position.lng}`;

          return `
            <style>
              * { box-sizing: border-box; }
              .building-card {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                width: 320px;
                background: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                padding-top: 36px;
                position: relative;
              }
              .gm-ui-hover-effect {
                background-color: #f3f4f6 !important;
                border-radius: 4px !important;
                opacity: 0.9 !important;
              }
              button[aria-label="Close"] {
                color: #374151 !important;
                filter: invert(0.8) !important;
              }
              .building-card h3 {
                margin: 0 0 12px 0;
                color: #1a1a1a;
                font-size: 18px;
                font-weight: 600;
                line-height: 1.3;
              }
              .building-card p {
                margin: 0 0 12px 0;
                color: #6b7280;
                font-size: 14px;
                line-height: 1.5;
              }
              .building-details {
                margin: 16px 0;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
              }
              .detail-row {
                margin-bottom: 10px;
                font-size: 13px;
                color: #4b5563;
              }
              .detail-label {
                font-weight: 600;
                color: #1a1a1a;
                display: block;
                margin-bottom: 2px;
              }
              .detail-value {
                color: #6b7280;
                word-break: break-word;
              }
              .detail-value a {
                color: #3b82f6;
                text-decoration: none;
              }
              .detail-value a:hover {
                text-decoration: underline;
              }
              .button-group {
                margin-top: 16px;
                display: flex;
                gap: 8px;
              }
              .directions-btn {
                flex: 1;
                padding: 10px 14px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                text-decoration: none;
                display: inline-block;
                text-align: center;
                cursor: pointer;
                transition: background-color 0.2s;
              }
              .directions-btn:hover {
                background: #2563eb;
              }
              .category-badge {
                display: inline-block;
                padding: 6px 12px;
                background-color: ${color}20;
                color: ${color};
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 12px;
              }
            </style>
            <div class="building-card">
              <h3>${m.title}</h3>
              ${m.description ? `<p>${m.description}</p>` : ''}

              ${m.details ? `
                <div class="building-details">
                  ${m.details.address ? `
                    <div class="detail-row">
                      <span class="detail-label">📍 Address</span>
                      <span class="detail-value">${m.details.address}</span>
                    </div>
                  ` : ''}
                  ${m.details.hours ? `
                    <div class="detail-row">
                      <span class="detail-label">🕐 Hours</span>
                      <span class="detail-value">${m.details.hours}</span>
                    </div>
                  ` : ''}
                  ${m.details.phone ? `
                    <div class="detail-row">
                      <span class="detail-label">📞 Phone</span>
                      <span class="detail-value"><a href="tel:${m.details.phone}">${m.details.phone}</a></span>
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              <div class="button-group">
                <a href="${directionsUrl}" target="_blank" class="directions-btn">Get Directions</a>
              </div>

              <div class="category-badge">${getMarkerDescription(m.type)}</div>
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
      friend: '#10b981',         // green for friends
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
    <div className="relative w-full flex-1 md:h-full md:rounded-none">
      <div ref={mapRef} className="absolute inset-0 md:rounded-none rounded-lg" />
      
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