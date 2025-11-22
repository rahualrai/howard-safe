import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { GoogleMap, type MapMarker } from "@/components/GoogleMapComponent";
import { useState, useEffect, useMemo } from "react";
import { Search, Navigation, MapIcon, MapPin, X, ChevronDown, Menu, Plus, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapBottomSheet } from "@/components/Map/MapBottomSheet";
import { HapticFeedback } from "@/utils/haptics";
import { ImpactStyle } from "@capacitor/haptics";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { LocationPermissionPrompt } from "@/components/LocationPermissionPrompt";
import { HOWARD_BUILDINGS, getAllCategories, getAllCampuses, searchBuildings, getCategoryColor, type BuildingCategory, type CampusName } from "@/data/howardBuildingsComplete";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";
import { useIncidents } from "@/hooks/useIncidents";
import { IncidentPhotoService } from "@/services/incidentPhotoService";

const THE_YARD_CENTER = { lat: 38.9230, lng: -77.0200 };

type IncidentCategory = 'theft' | 'harassment' | 'suspicious_activity' | 'safety_hazard' | 'medical_emergency' | 'other';
type IncidentStatus = 'pending' | 'investigating' | 'resolved';
type TimeRange = '24h' | '7d' | '30d' | 'all';

const INCIDENT_COLORS: Record<IncidentCategory, string> = {
  theft: '#ef4444',
  harassment: '#a855f7',
  suspicious_activity: '#f97316',
  safety_hazard: '#eab308',
  medical_emergency: '#ec4899',
  other: '#6b7280',
};

const INCIDENT_LABELS: Record<IncidentCategory, string> = {
  theft: 'Theft',
  harassment: 'Harassment',
  suspicious_activity: 'Suspicious',
  safety_hazard: 'Hazard',
  medical_emergency: 'Medical',
  other: 'Other',
};

export default function Map() {
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [mapCenter, setMapCenter] = useState(THE_YARD_CENTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof HOWARD_BUILDINGS>([]);
  const [activeCategories, setActiveCategories] = useState<Set<BuildingCategory>>(new Set(['Administrative', 'Safety'] as BuildingCategory[]));
  const [activeCampuses, setActiveCampuses] = useState<Set<CampusName>>(new Set(['Main'] as CampusName[]));
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const navigate = useNavigate();

  // Incident filters
  const [activeIncidentCategories, setActiveIncidentCategories] = useState<Set<IncidentCategory>>(new Set());
  const [activeIncidentStatuses, setActiveIncidentStatuses] = useState<Set<IncidentStatus>>(new Set(['pending', 'investigating']));
  const [incidentTimeRange, setIncidentTimeRange] = useState<TimeRange>('7d');

  const { permission, getCurrentLocation, location } = useLocationPermission();

  // Get current user for friends location
  const { user } = useSecurityValidation({ requireAuth: false });
  const { friendsLocations } = useLocationSharing(user?.id);

  // Fetch incidents
  const { data: allIncidents = [] } = useIncidents({ includePhotos: true });

  // Check location permission on mount and hide prompt when granted
  useEffect(() => {
    if (permission === 'unknown' || permission === 'prompt') {
      setShowLocationPrompt(true);
    } else if (permission === 'granted') {
      setShowLocationPrompt(false);
      // Don't auto-zoom to user location - just show the marker on the map
    }
  }, [permission]);

  // Handle search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchBuildings(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Helper function to get cutoff date based on time range
  const getCutoffDate = (range: TimeRange): Date => {
    const now = new Date();
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return new Date(0);
    }
  };

  // Compute markers: filtered buildings + friends locations + incidents
  const mapMarkers = useMemo(() => {
    // Filter buildings by active categories and campuses
    const buildingMarkers = HOWARD_BUILDINGS
      .filter(building => activeCategories.has(building.category) && activeCampuses.has(building.campus))
      .map(building => ({
        position: { lat: building.latitude, lng: building.longitude },
        title: building.name,
        type: building.category,
        details: {
          address: building.address,
          phone: building.phone,
        },
      }));

    // Add friends location markers
    const friendMarkers = friendsLocations
      .filter(loc => loc.is_sharing && loc.latitude && loc.longitude)
      .map(loc => ({
        position: { lat: loc.latitude, lng: loc.longitude },
        title: loc.friend_username || 'Friend',
        type: 'friend' as const,
        details: {
          timestamp: loc.location_timestamp,
          friendId: loc.friend_id,
        },
      }));

    // Helper to get public URL for incident photos (bucket is public)
    const getPhotoUrl = (storagePath: string) => {
      // storage_path format: "user-id/incident-id/timestamp.jpg"
      // Public URL format: https://project.supabase.co/storage/v1/object/public/incident-photos/path
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      return `${supabaseUrl}/storage/v1/object/public/incident-photos/${storagePath}`;
    };

    // Filter and add incident markers
    const cutoffDate = getCutoffDate(incidentTimeRange);
    const incidentMarkers = allIncidents
      .filter(incident => {
        // Filter by status
        if (!activeIncidentStatuses.has(incident.status as IncidentStatus)) {
          return false;
        }
        // Filter by time range
        if (new Date(incident.reported_at) < cutoffDate) {
          return false;
        }
        // Filter by category if any are selected
        if (activeIncidentCategories.size > 0 && !activeIncidentCategories.has(incident.category as IncidentCategory)) {
          return false;
        }
        // Only show incidents with valid coordinates
        return incident.latitude && incident.longitude;
      })
      .map(incident => {
        const incidentCategory = (incident.category || 'other') as IncidentCategory;
        return {
          position: { lat: incident.latitude!, lng: incident.longitude! },
          title: `${INCIDENT_LABELS[incidentCategory] || incident.category} - ${incident.description.substring(0, 30)}...`,
          type: incidentCategory,
          description: incident.description,
          details: {
            incidentCategory: INCIDENT_LABELS[incidentCategory] || incident.category,
            incidentStatus: incident.status,
            incidentTime: incident.incident_time,
            reportedTime: incident.reported_at,
            photos: incident.incident_photos?.map(photo => ({
              url: getPhotoUrl(photo.storage_path),
              alt: `Incident photo for ${incidentCategory}`,
            })) || [],
          },
        };
      });

    return [...buildingMarkers, ...friendMarkers, ...incidentMarkers];
  }, [activeCategories, activeCampuses, friendsLocations, allIncidents, activeIncidentCategories, activeIncidentStatuses, incidentTimeRange]);

  const handleLocationGranted = (position: GeolocationPosition) => {
    setShowLocationPrompt(false);
    // Don't change map center - location marker will show on the map automatically
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Location Permission Prompt */}
      {showLocationPrompt && (
        <LocationPermissionPrompt
          variant="overlay"
          showCloseButton={true}
          onClose={() => setShowLocationPrompt(false)}
          onPermissionGranted={handleLocationGranted}
        />
      )}

      {/* DESKTOP SIDEBAR - Hidden on Mobile */}
      <aside className="hidden md:flex md:flex-col md:w-80 md:border-r md:border-border md:bg-card md:overflow-y-auto md:shadow-soft z-20">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campus Map</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mapMarkers.filter(m => m.type !== 'friend').length} buildings, {friendsLocations.filter(loc => loc.is_sharing && loc.latitude && loc.longitude).length} friends
            </p>
          </div>

          {/* Search Bar with Autocomplete */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search buildings..."
              className="pl-10 bg-muted/50 border-border"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(e.target.value.length > 0);
              }}
              onFocus={() => searchQuery.length > 0 && setShowSearchDropdown(true)}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            )}

            {/* Search Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.slice(0, 8).map((building) => (
                  <button
                    key={building.id}
                    className="w-full text-left px-4 py-2 hover:bg-muted border-b border-border last:border-b-0 transition-colors"
                    onClick={() => {
                      setMapCenter({ lat: building.latitude, lng: building.longitude });
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                      // Also select as marker
                      const marker = mapMarkers.find(m => m.title === building.name);
                      if (marker) setSelectedMarker(marker);
                    }}
                  >
                    <div className="font-medium text-sm">{building.name}</div>
                    <div className="text-xs text-muted-foreground">{building.campus} • {building.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Button */}
          {(permission === 'unknown' || permission === 'prompt' || permission === 'denied') && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowLocationPrompt(true)}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Enable Location
            </Button>
          )}

          {/* Category Filters */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Building Types</p>
            <div className="flex flex-wrap gap-2">
              {getAllCategories().map((category) => (
                <Button
                  key={category}
                  variant={activeCategories.has(category) ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const newCategories = new Set(activeCategories);
                    if (newCategories.has(category)) {
                      newCategories.delete(category);
                    } else {
                      newCategories.add(category);
                    }
                    setActiveCategories(newCategories);
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Campus Filters */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Campuses</p>
            <div className="flex flex-wrap gap-2">
              {getAllCampuses().map((campus) => (
                <Button
                  key={campus}
                  variant={activeCampuses.has(campus) ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const newCampuses = new Set(activeCampuses);
                    if (newCampuses.has(campus)) {
                      newCampuses.delete(campus);
                    } else {
                      newCampuses.add(campus);
                    }
                    setActiveCampuses(newCampuses);
                  }}
                >
                  {campus}
                </Button>
              ))}
            </div>
          </div>

          {/* Incidents Section */}
          <div className="pt-6 border-t border-border">
            <p className="text-sm font-semibold text-foreground mb-3">Incidents</p>

            {/* Incident Categories */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(INCIDENT_LABELS) as IncidentCategory[]).map((category) => (
                  <Button
                    key={category}
                    variant={activeIncidentCategories.has(category) ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    style={{
                      backgroundColor: activeIncidentCategories.has(category) ? INCIDENT_COLORS[category] : 'transparent',
                      color: activeIncidentCategories.has(category) ? '#fff' : INCIDENT_COLORS[category],
                      borderColor: INCIDENT_COLORS[category],
                    }}
                    onClick={() => {
                      const newCategories = new Set(activeIncidentCategories);
                      if (newCategories.has(category)) {
                        newCategories.delete(category);
                      } else {
                        newCategories.add(category);
                      }
                      setActiveIncidentCategories(newCategories);
                    }}
                  >
                    {INCIDENT_LABELS[category]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Incident Status */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'investigating', 'resolved'] as IncidentStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={activeIncidentStatuses.has(status) ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const newStatuses = new Set(activeIncidentStatuses);
                      if (newStatuses.has(status)) {
                        newStatuses.delete(status);
                      } else {
                        newStatuses.add(status);
                      }
                      setActiveIncidentStatuses(newStatuses);
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Time Range</p>
              <select
                value={incidentTimeRange}
                onChange={(e) => setIncidentTimeRange(e.target.value as TimeRange)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col h-screen">
        {/* Floating Search Bar (Mobile) */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-10 flex gap-2">
          <div className="flex-1 relative shadow-lg rounded-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Search Howard..."
              className="pl-12 pr-4 h-12 rounded-full bg-background border-0 shadow-none text-base"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(e.target.value.length > 0);
              }}
              onFocus={() => searchQuery.length > 0 && setShowSearchDropdown(true)}
            />
          </div>
          <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full shadow-lg bg-background" onClick={() => {
            // Toggle sidebar or show filters
            // For now, maybe just a placeholder or open a filter modal
          }}>
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* Search Dropdown (Mobile) */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="md:hidden absolute top-20 left-4 right-4 bg-background rounded-xl shadow-xl z-20 max-h-[50vh] overflow-y-auto">
            {searchResults.slice(0, 8).map((building) => (
              <button
                key={building.id}
                className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border last:border-b-0 transition-colors flex items-center gap-3"
                onClick={() => {
                  setMapCenter({ lat: building.latitude, lng: building.longitude });
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                  const marker = mapMarkers.find(m => m.title === building.name);
                  if (marker) setSelectedMarker(marker);
                }}
              >
                <div className="bg-muted p-2 rounded-full">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="font-medium text-sm">{building.name}</div>
                  <div className="text-xs text-muted-foreground">{building.campus} • {building.category}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Google Maps */}
        <GoogleMap
          center={mapCenter}
          zoom={16}
          markers={mapMarkers}
          onMarkerClick={setSelectedMarker}
        />

        {/* Floating Action Buttons (Mobile) */}
        <div className="md:hidden absolute bottom-8 right-4 z-10 flex flex-col gap-3 pb-safe">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-xl bg-background text-foreground hover:bg-muted"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                  setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                });
              }
            }}
          >
            <Target className="w-6 h-6" />
          </Button>

          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground"
            onClick={() => navigate('/report')}
          >
            <Plus className="w-8 h-8" />
          </Button>
        </div>

        {/* Bottom Sheet */}
        <MapBottomSheet
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
        />
      </main>
    </div>
  );
}