import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Shield, Phone, Navigation, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmergencyLocation {
  id: string;
  type: 'blue_light' | 'security_office' | 'safe_zone';
  name: string;
  description: string;
  coordinates: { x: number; y: number };
  status: 'active' | 'maintenance' | 'offline';
}

interface IncidentMarker {
  id: string;
  type: 'suspicious' | 'safety_hazard' | 'medical';
  description: string;
  coordinates: { x: number; y: number };
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

const emergencyLocations: EmergencyLocation[] = [
  {
    id: '1',
    type: 'blue_light',
    name: 'Blue Light Station #1',
    description: 'Emergency call box near Founders Library',
    coordinates: { x: 45, y: 35 },
    status: 'active'
  },
  {
    id: '2',
    type: 'blue_light',
    name: 'Blue Light Station #2', 
    description: 'Emergency call box at Blackburn Center',
    coordinates: { x: 65, y: 55 },
    status: 'active'
  },
  {
    id: '3',
    type: 'security_office',
    name: 'Campus Security Office',
    description: 'Main campus security headquarters',
    coordinates: { x: 30, y: 60 },
    status: 'active'
  },
  {
    id: '4',
    type: 'safe_zone',
    name: 'Student Center Safe Zone',
    description: 'Well-lit area with 24/7 security presence',
    coordinates: { x: 55, y: 40 },
    status: 'active'
  },
  {
    id: '5',
    type: 'blue_light',
    name: 'Blue Light Station #3',
    description: 'Emergency call box near Cramton Auditorium',
    coordinates: { x: 75, y: 30 },
    status: 'maintenance'
  }
];

const recentIncidents: IncidentMarker[] = [
  {
    id: '1',
    type: 'suspicious',
    description: 'Suspicious activity reported',
    coordinates: { x: 80, y: 70 },
    timestamp: '2 hours ago',
    severity: 'medium'
  },
  {
    id: '2',
    type: 'safety_hazard',
    description: 'Poor lighting reported',
    coordinates: { x: 25, y: 25 },
    timestamp: '1 day ago',
    severity: 'low'
  }
];

export function HowardMap() {
  const [selectedLocation, setSelectedLocation] = useState<EmergencyLocation | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentMarker | null>(null);
  const [userLocation, setUserLocation] = useState<{ x: number; y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate user location
    setUserLocation({ x: 50, y: 45 });
  }, []);

  const getLocationIcon = (type: string, status: string) => {
    if (type === 'blue_light') {
      return <Zap size={20} className={status === 'active' ? 'text-primary' : 'text-muted-foreground'} />;
    }
    if (type === 'security_office') {
      return <Shield size={20} className="text-destructive" />;
    }
    if (type === 'safe_zone') {
      return <MapPin size={20} className="text-success" />;
    }
    return <MapPin size={20} />;
  };

  const getIncidentColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive bg-destructive/10';
      case 'medium': return 'text-accent bg-accent/10';
      case 'low': return 'text-muted-foreground bg-muted';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-success/5 to-primary/5 rounded-lg overflow-hidden">
      {/* Campus Map Background */}
      <div
        ref={mapRef}
        className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 40%, hsl(var(--primary) / 0.1) 0%, transparent 30%),
            radial-gradient(circle at 70% 60%, hsl(var(--success) / 0.1) 0%, transparent 30%),
            linear-gradient(45deg, transparent 30%, hsl(var(--muted) / 0.1) 31%, hsl(var(--muted) / 0.1) 32%, transparent 33%)
          `,
        }}
      >
        {/* Campus Layout Representation */}
        <div className="absolute inset-4">
          {/* Main Quad */}
          <div 
            className="absolute bg-success/10 border border-success/20 rounded-lg"
            style={{ 
              left: '35%', 
              top: '35%', 
              width: '30%', 
              height: '25%' 
            }}
          />
          
          {/* Buildings */}
          <div 
            className="absolute bg-card border border-border rounded"
            style={{ left: '20%', top: '20%', width: '15%', height: '15%' }}
          />
          <div 
            className="absolute bg-card border border-border rounded"
            style={{ left: '70%', top: '25%', width: '20%', height: '12%' }}
          />
          <div 
            className="absolute bg-card border border-border rounded"
            style={{ left: '15%', top: '55%', width: '18%', height: '20%' }}
          />
        </div>

        {/* Emergency Locations */}
        {emergencyLocations.map((location) => (
          <motion.div
            key={location.id}
            className="absolute cursor-pointer"
            style={{
              left: `${location.coordinates.x}%`,
              top: `${location.coordinates.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedLocation(location)}
          >
            <div className={`
              p-2 rounded-full shadow-primary
              ${location.status === 'active' ? 'bg-card border-2 border-primary' : 'bg-muted border border-border'}
            `}>
              {getLocationIcon(location.type, location.status)}
            </div>
            
            {location.status === 'active' && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>
        ))}

        {/* Incident Markers */}
        {recentIncidents.map((incident) => (
          <motion.div
            key={incident.id}
            className="absolute cursor-pointer"
            style={{
              left: `${incident.coordinates.x}%`,
              top: `${incident.coordinates.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedIncident(incident)}
          >
            <div className={`p-1.5 rounded-full shadow-sm ${getIncidentColor(incident.severity)}`}>
              <div className="w-3 h-3 rounded-full bg-current" />
            </div>
          </motion.div>
        ))}

        {/* User Location */}
        {userLocation && (
          <motion.div
            className="absolute"
            style={{
              left: `${userLocation.x}%`,
              top: `${userLocation.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-4 h-4 bg-accent rounded-full shadow-lg border-2 border-white" />
            <div className="absolute inset-0 w-4 h-4 bg-accent/30 rounded-full animate-ping" />
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <Card className="absolute top-4 right-4 shadow-primary">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Zap size={14} className="text-primary" />
            <span>Blue Light</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Shield size={14} className="text-destructive" />
            <span>Security</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <MapPin size={14} className="text-success" />
            <span>Safe Zone</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-accent rounded-full" />
            <span>You</span>
          </div>
        </CardContent>
      </Card>

      {/* Location Details Modal */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <Card className="shadow-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getLocationIcon(selectedLocation.type, selectedLocation.status)}
                  <h3 className="font-semibold">{selectedLocation.name}</h3>
                </div>
                <Badge variant={selectedLocation.status === 'active' ? 'default' : 'secondary'}>
                  {selectedLocation.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedLocation.description}
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Navigation size={14} className="mr-1" />
                  Get Directions
                </Button>
                {selectedLocation.type === 'blue_light' && selectedLocation.status === 'active' && (
                  <Button size="sm" variant="destructive">
                    <Phone size={14} className="mr-1" />
                    Call Security
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedLocation(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Incident Details Modal */}
      {selectedIncident && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <Card className="shadow-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">Reported Incident</h3>
                <Badge className={getIncidentColor(selectedIncident.severity)}>
                  {selectedIncident.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {selectedIncident.description}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {selectedIncident.timestamp}
              </p>
              <Button size="sm" variant="outline" onClick={() => setSelectedIncident(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}