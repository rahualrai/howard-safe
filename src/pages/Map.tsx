import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";
import { motion } from "framer-motion";
import { HowardMap } from "@/components/HowardMap";
import { useState } from "react";
import { Search, Navigation, Phone, MapIcon, Shield, AlertTriangle, ZoomIn, ZoomOut } from "lucide-react";
import { HapticFeedback } from "@/utils/haptics";
import { ImpactStyle } from "@capacitor/haptics";

export default function Map() {
  const mapIncidents = [
    { id: 1, type: "Safe Route", location: "Main Quad to Library", status: "active" },
    { id: 2, type: "Well-lit Area", location: "Georgia Ave Corridor", status: "verified" },
    { id: 3, type: "Incident Report", location: "Near Cramton Auditorium", time: "2 hours ago" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border sticky top-0 z-40">
        <div className="px-mobile-padding py-4">
          <h1 className="text-xl font-semibold text-foreground text-center">Campus Map</h1>
          
          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search locations..."
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1">
        {/* Map Area - Placeholder */}
        <div className="h-96 bg-muted/30 border-b border-border relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapIcon size={48} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Interactive Campus Map</p>
              <p className="text-xs text-muted-foreground mt-1">Howard University Layout</p>
            </div>
          </div>
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="sm" variant="secondary" className="w-10 h-10 p-0 shadow-soft">
              <ZoomIn size={16} />
            </Button>
            <Button size="sm" variant="secondary" className="w-10 h-10 p-0 shadow-soft">
              <ZoomOut size={16} />
            </Button>
            <Button size="sm" variant="secondary" className="w-10 h-10 p-0 shadow-soft">
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

      <BottomNavigation />
    </div>
  );
}