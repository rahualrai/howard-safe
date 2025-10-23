import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { GoogleMap } from "@/components/GoogleMapComponent";
import { useState, useEffect, useMemo } from "react";
import { Search, Navigation, MapIcon, MapPin, X, ChevronDown } from "lucide-react";
import { HapticFeedback } from "@/utils/haptics";
import { ImpactStyle } from "@capacitor/haptics";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { LocationPermissionPrompt } from "@/components/LocationPermissionPrompt";
import { HOWARD_BUILDINGS, getAllCategories, getAllCampuses, searchBuildings, getCategoryColor, type BuildingCategory, type CampusName } from "@/data/howardBuildingsComplete";

const THE_YARD_CENTER = { lat: 38.9230, lng: -77.0200 };

export default function Map() {
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [mapCenter, setMapCenter] = useState(THE_YARD_CENTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof HOWARD_BUILDINGS>([]);
  const [activeCategories, setActiveCategories] = useState<Set<BuildingCategory>>(new Set(getAllCategories()));
  const [activeCampuses, setActiveCampuses] = useState<Set<CampusName>>(new Set(getAllCampuses()));
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const { permission, getCurrentLocation, location } = useLocationPermission();

  // Check location permission on mount and hide prompt when granted
  useEffect(() => {
    if (permission === 'unknown' || permission === 'prompt') {
      setShowLocationPrompt(true);
    } else if (permission === 'granted') {
      setShowLocationPrompt(false);
      // Get current location and center map
      getCurrentLocation().then((position) => {
        if (position) {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        }
      });
    }
  }, [permission, getCurrentLocation]);

  // Handle search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchBuildings(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Compute markers: filtered buildings
  const mapMarkers = useMemo(() => {
    // Filter buildings by active categories and campuses
    const filtered = HOWARD_BUILDINGS
      .filter(building => activeCategories.has(building.category))
      .filter(building => activeCampuses.has(building.campus))
      .map(building => ({
        position: { lat: building.latitude, lng: building.longitude },
        title: building.name,
        type: building.category,
        details: {
          address: building.address,
          phone: building.phone,
        },
      }));

    return filtered;
  }, [activeCategories, activeCampuses]);

  const handleLocationGranted = (position: GeolocationPosition) => {
    setShowLocationPrompt(false);
    setMapCenter({
      lat: position.coords.latitude,
      lng: position.coords.longitude
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Location Permission Prompt */}
      {showLocationPrompt && (
        <LocationPermissionPrompt
          variant="overlay"
          showCloseButton={true}
          onClose={() => setShowLocationPrompt(false)}
          onPermissionGranted={handleLocationGranted}
        />
      )}
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border sticky top-0 z-40">
        <div className="px-mobile-padding py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-foreground">Campus Map</h1>
            
            {/* Location Status Badge */}
            <Badge 
              variant={permission === 'granted' ? 'default' : 'secondary'}
              className="flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              {permission === 'granted' ? 'Location On' : 'Location Off'}
            </Badge>
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
                    }}
                  >
                    <div className="font-medium text-sm">{building.name}</div>
                    <div className="text-xs text-muted-foreground">{building.campus} • {building.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location Prompt Button */}
          {(permission === 'unknown' || permission === 'prompt' || permission === 'denied') && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => setShowLocationPrompt(true)}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Enable Location for Better Safety
            </Button>
          )}

          {/* Category Filters */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Building Types ({mapMarkers.length})</p>
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
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Campuses</p>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1">
        {/* Google Maps with current location */}
        <GoogleMap 
          center={permission === 'granted' && location ? 
            { lat: location.coords.latitude, lng: location.coords.longitude } : 
            mapCenter
          }
          zoom={permission === 'granted' ? 17 : 16}
          markers={mapMarkers}
        />

        {/* Spacing for bottom navigation */}
        <div className="h-24" />
      </main>

    </div>
  );
}