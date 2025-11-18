import { useEffect, useState } from 'react';
import { GoogleMap } from '@/components/GoogleMapComponent';
import { useIncidents, Incident } from '@/hooks/useIncidents';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, MapIcon } from 'lucide-react';

const HOWARD_CENTER = { lat: 38.9215, lng: -77.0209 }; // Howard University main campus
const DEFAULT_ZOOM = 15;

export interface IncidentMapProps {
  onIncidentClick?: (incidentId: string) => void;
  showOwnReports?: boolean;
  maxDistance?: number; // in km
}

const INCIDENT_CATEGORIES: Record<string, string> = {
  suspicious_activity: 'Suspicious Activity',
  safety_hazard: 'Safety Hazard',
  medical_emergency: 'Medical Emergency',
  theft: 'Theft/Property Crime',
  harassment: 'Harassment',
  other: 'Other Incident',
};

export const IncidentMap = ({
  onIncidentClick,
  showOwnReports = false,
  maxDistance = 5, // 5km radius by default
}: IncidentMapProps) => {
  const [mapCenter, setMapCenter] = useState(HOWARD_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch all public incidents
  const { data: incidents, isLoading, error } = useIncidents({
    includePhotos: false,
  });

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        () => {
          // Silently fail if no permission, use default center
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  // Convert incidents to map markers
  const getIncidentMarkers = () => {
    if (!incidents || incidents.length === 0) {
      return [];
    }

    return incidents
      .filter((incident: Incident) => {
        // Filter out incidents without coordinates
        if (incident.latitude === null || incident.longitude === null) {
          return false;
        }

        // If user location is available, filter by distance
        if (userLocation && maxDistance) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            incident.latitude,
            incident.longitude
          );
          if (distance > maxDistance) {
            return false;
          }
        }

        return true;
      })
      .map((incident: Incident) => ({
        position: {
          lat: incident.latitude!,
          lng: incident.longitude!,
        },
        title: INCIDENT_CATEGORIES[incident.category] || incident.category,
        type: 'incident' as const,
        description: incident.description.substring(0, 100) + (incident.description.length > 100 ? '...' : ''),
        details: {
          address: incident.location_text || undefined,
          timestamp: incident.incident_time || incident.reported_at,
        },
      }));
  };

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="pt-6 flex items-center gap-2">
          <AlertTriangle className="text-destructive flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-destructive">Failed to load incidents</p>
            <p className="text-xs text-destructive/80">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const markers = getIncidentMarkers();

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[500px] rounded-lg overflow-hidden border border-border shadow-sm">
      {isLoading && (
        <div className="absolute inset-0 bg-muted/30 z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground text-sm">Loading incidents...</p>
          </div>
        </div>
      )}

      {!isLoading && markers.length === 0 && (
        <div className="absolute inset-0 bg-muted/30 z-5 flex items-center justify-center">
          <div className="text-center">
            <MapIcon size={40} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No incidents in this area</p>
          </div>
        </div>
      )}

      <GoogleMap center={mapCenter} zoom={mapZoom} markers={markers} />

      {/* Incident count badge */}
      {markers.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-card shadow-soft px-3 py-2 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" size={16} />
            <span className="text-sm font-medium">{markers.length} incident{markers.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Helper function to calculate distance between two coordinates (haversine formula)
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
