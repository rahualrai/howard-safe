import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { GoogleMap } from "@/components/GoogleMapComponent";
import { useState, useEffect } from "react";
import { Search, Navigation, Phone, MapIcon, Shield, AlertTriangle, ZoomIn, ZoomOut, MapPin } from "lucide-react";
import { HapticFeedback } from "@/utils/haptics";
import { ImpactStyle } from "@capacitor/haptics";
import { useLocationPermission } from "@/hooks/useLocationPermission";
import { LocationPermissionPrompt } from "@/components/LocationPermissionPrompt";

export default function Map() {
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 38.9227, lng: -77.0204 });
  const { permission, getCurrentLocation, location } = useLocationPermission();
  
  const mapIncidents = [
    { id: 1, type: "Safe Route", location: "Main Quad to Library", status: "active" },
    { id: 2, type: "Well-lit Area", location: "Georgia Ave Corridor", status: "verified" },
    { id: 3, type: "Incident Report", location: "Near Cramton Auditorium", time: "2 hours ago" },
  ];

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

  // Howard University coordinates (fallback - not used but kept for reference)
  
  // Enhanced markers with better pins
  const mapMarkers = [
    { position: { lat: 38.9227, lng: -77.0204 }, title: "Howard University Main Campus", type: "safe" as const },
    { position: { lat: 38.9240, lng: -77.0190 }, title: "Founders Library - Safe Route", type: "safe" as const },
    { position: { lat: 38.9210, lng: -77.0220 }, title: "Well-lit Walkway - Georgia Ave", type: "welllit" as const },
    { position: { lat: 38.9250, lng: -77.0180 }, title: "Recent Security Incident", type: "incident" as const },
    { position: { lat: 38.9235, lng: -77.0195 }, title: "Blue Light Emergency Station", type: "safe" as const },
    { position: { lat: 38.9220, lng: -77.0210 }, title: "Campus Security Office", type: "safe" as const },
  ];

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
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search locations..."
              className="pl-10 bg-muted/50 border-border"
            />
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

        {/* Map Legend & Information */}
        <div className="px-mobile-padding py-4 pb-24">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Map Information</h2>
            
            <div className="grid grid-cols-1 gap-3">
              {mapIncidents.map((item) => (
                <Card key={item.id} className="shadow-soft border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.type === "Safe Route" && (
                          <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                            <Shield className="text-success" size={16} />
                          </div>
                        )}
                        {item.type === "Well-lit Area" && (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Shield className="text-primary" size={16} />
                          </div>
                        )}
                        {item.type === "Incident Report" && (
                          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="text-accent" size={16} />
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.type}</p>
                          <p className="text-xs text-muted-foreground">{item.location}</p>
                          {item.time && (
                            <p className="text-xs text-muted-foreground">{item.time}</p>
                          )}
                        </div>
                      </div>
                      
                      {item.status && (
                        <Badge 
                          variant={item.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}