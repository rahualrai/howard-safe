import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Navigation, MapIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    google: typeof google;
  }
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface GoogleMapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  markers?: Array<{
    position: google.maps.LatLngLiteral;
    title: string;
    type: 'safe' | 'incident' | 'welllit';
  }>;
}

const GoogleMapComponent: React.FC<GoogleMapProps> = ({ center, zoom, markers = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapMarkers, setMapMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          "featureType": "poi",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        }
      ],
    });

    setMap(mapInstance);

    // Add markers
    const newMarkers = markers.map(marker => {
      const mapMarker = new google.maps.Marker({
        position: marker.position,
        map: mapInstance,
        title: marker.title,
        icon: {
          url: marker.type === 'safe' ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMjJjNTVlIi8+Cjwvc3ZnPgo=' :
                  marker.type === 'incident' ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjZWY0NDQ0Ii8+Cjwvc3ZnPgo=' :
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMzY4M2Y2Ii8+Cjwvc3ZnPgo=',
          scaledSize: new google.maps.Size(24, 24),
        },
      });

      return mapMarker;
    });

    setMapMarkers(newMarkers);

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [center, zoom, markers]);

  const handleZoomIn = useCallback(() => {
    if (map) {
      map.setZoom((map.getZoom() || 15) + 1);
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      map.setZoom((map.getZoom() || 15) - 1);
    }
  }, [map]);

  const handleRecenter = useCallback(() => {
    if (map && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(userLocation);
          map.setZoom(17);
        },
        () => {
          // Fallback to Howard University coordinates
          map.setCenter({ lat: 38.9227, lng: -77.0204 });
        }
      );
    }
  }, [map]);

  return (
    <div className="h-96 bg-muted/30 border-b border-border relative overflow-hidden">
      <div ref={mapRef} className="absolute inset-0" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button 
          size="sm" 
          variant="secondary" 
          className="w-10 h-10 p-0 shadow-soft"
          onClick={handleZoomIn}
        >
          <ZoomIn size={16} />
        </Button>
        <Button 
          size="sm" 
          variant="secondary" 
          className="w-10 h-10 p-0 shadow-soft"
          onClick={handleZoomOut}
        >
          <ZoomOut size={16} />
        </Button>
        <Button 
          size="sm" 
          variant="secondary" 
          className="w-10 h-10 p-0 shadow-soft"
          onClick={handleRecenter}
        >
          <Navigation size={16} />
        </Button>
      </div>

      {/* Current Location Indicator */}
      <div className="absolute bottom-4 left-4">
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></div>
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