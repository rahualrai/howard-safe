import React from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Phone, Navigation, User, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { MapMarker } from '@/components/GoogleMapComponent';

interface MapBottomSheetProps {
    marker: MapMarker | null;
    onClose: () => void;
}

export const MapBottomSheet: React.FC<MapBottomSheetProps> = ({ marker, onClose }) => {
    if (!marker) return null;

    const isOpen = !!marker;

    const getCategoryColor = (type: string) => {
        const colors: Record<string, string> = {
            safe: 'bg-green-500',
            incident: 'bg-red-500',
            welllit: 'bg-blue-500',
            friend: 'bg-emerald-500',
            academic: 'bg-blue-500',
            dining: 'bg-amber-500',
            safety: 'bg-red-500',
            residential: 'bg-purple-500',
            theft: 'bg-red-500',
            harassment: 'bg-purple-500',
            suspicious_activity: 'bg-orange-500',
            safety_hazard: 'bg-yellow-500',
            medical_emergency: 'bg-pink-500',
            other: 'bg-gray-500',
        };
        return colors[type.toLowerCase()] || 'bg-gray-500';
    };

    const getCategoryLabel = (type: string) => {
        const labels: Record<string, string> = {
            safe: 'Safe Zone',
            incident: 'Incident',
            welllit: 'Well-Lit Area',
            friend: 'Friend',
            academic: 'Academic',
            dining: 'Dining',
            safety: 'Safety',
            residential: 'Residential',
            theft: 'Theft',
            harassment: 'Harassment',
            suspicious_activity: 'Suspicious',
            safety_hazard: 'Hazard',
            medical_emergency: 'Medical',
            other: 'Other',
        };
        return labels[type.toLowerCase()] || type;
    };

    const renderContent = () => {
        // Incident Content
        if (marker.details?.incidentCategory) {
            const statusColor = marker.details.incidentStatus === 'resolved' ? 'text-green-600 bg-green-100' :
                marker.details.incidentStatus === 'investigating' ? 'text-amber-600 bg-amber-100' : 'text-red-600 bg-red-100';

            return (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Badge className={`${getCategoryColor(marker.type)} text-white border-none`}>
                            {getCategoryLabel(marker.type)}
                        </Badge>
                        <Badge variant="outline" className={`${statusColor} border-none`}>
                            {marker.details.incidentStatus?.toUpperCase()}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">{marker.title}</h2>
                        <p className="text-muted-foreground text-sm">{marker.description}</p>
                    </div>

                    {marker.details.photos && marker.details.photos.length > 0 && (
                        <div className="rounded-lg overflow-hidden bg-muted">
                            <img
                                src={marker.details.photos[0].url}
                                alt={marker.details.photos[0].alt}
                                className="w-full h-48 object-cover"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-muted-foreground text-xs mb-1">Occurred</p>
                            <p className="font-medium">
                                {marker.details.incidentTime ? new Date(marker.details.incidentTime).toLocaleString() : 'Unknown'}
                            </p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-muted-foreground text-xs mb-1">Reported</p>
                            <p className="font-medium">
                                {marker.details.reportedTime ? new Date(marker.details.reportedTime).toLocaleString() : 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // Friend Content
        if (marker.type === 'friend') {
            return (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{marker.title}</h2>
                            <p className="text-sm text-muted-foreground">Sharing Location</p>
                        </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
                        <Clock size={16} className="text-muted-foreground" />
                        <span className="text-sm">
                            Last updated: {marker.details?.timestamp ? new Date(marker.details.timestamp).toLocaleString() : 'Unknown'}
                        </span>
                    </div>
                </div>
            );
        }

        // Building/Default Content
        return (
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <Badge className={`${getCategoryColor(marker.type)} text-white border-none mb-2`}>
                            {getCategoryLabel(marker.type)}
                        </Badge>
                        <h2 className="text-2xl font-bold">{marker.title}</h2>
                        {marker.description && <p className="text-muted-foreground mt-1">{marker.description}</p>}
                    </div>
                </div>

                <div className="space-y-3">
                    {marker.details?.address && (
                        <div className="flex items-start gap-3 text-sm">
                            <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                            <span>{marker.details.address}</span>
                        </div>
                    )}
                    {marker.details?.hours && (
                        <div className="flex items-start gap-3 text-sm">
                            <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                            <span>{marker.details.hours}</span>
                        </div>
                    )}
                    {marker.details?.phone && (
                        <div className="flex items-start gap-3 text-sm">
                            <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                            <a href={`tel:${marker.details.phone}`} className="text-blue-600 hover:underline">
                                {marker.details.phone}
                            </a>
                        </div>
                    )}
                </div>

                <Button className="w-full" onClick={() => {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${marker.position.lat},${marker.position.lng}`, '_blank');
                }}>
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                </Button>
            </div>
        );
    };

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
                    <div className="p-4 bg-background rounded-t-[10px] flex-1 overflow-y-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-8" />
                        {renderContent()}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};
