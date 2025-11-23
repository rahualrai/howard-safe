import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Phone, Navigation, User, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import type { MapMarker } from '@/components/GoogleMapComponent';

interface MarkerDetailsProps {
    marker: MapMarker;
}

export const MarkerDetails: React.FC<MarkerDetailsProps> = ({ marker }) => {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // Reset photo index when marker changes
    React.useEffect(() => {
        setCurrentPhotoIndex(0);
    }, [marker.details?.photos]);

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

    // Incident Content
    if (marker.details?.incidentCategory) {
        const statusColor = marker.details.incidentStatus === 'resolved' ? 'text-green-600 bg-green-100' :
            marker.details.incidentStatus === 'investigating' ? 'text-amber-600 bg-amber-100' : 'text-red-600 bg-red-100';

        const photos = marker.details.photos || [];
        const currentPhoto = photos[currentPhotoIndex];
        const hasMultiplePhotos = photos.length > 1;

        const goToPrevious = () => {
            setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
        };

        const goToNext = () => {
            setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
        };

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

                {photos.length > 0 && currentPhoto && (
                    <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden bg-muted">
                            <img
                                src={currentPhoto.url}
                                alt={currentPhoto.alt}
                                className="w-full h-64 object-cover"
                            />

                            {hasMultiplePhotos && (
                                <>
                                    {/* Navigation Buttons */}
                                    <button
                                        onClick={goToPrevious}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                                        aria-label="Previous photo"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={goToNext}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                                        aria-label="Next photo"
                                    >
                                        <ChevronRight size={20} />
                                    </button>

                                    {/* Photo Counter */}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                        <ImageIcon size={12} />
                                        {currentPhotoIndex + 1} / {photos.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnail Dots Navigation */}
                        {hasMultiplePhotos && (
                            <div className="flex justify-center gap-2">
                                {photos.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPhotoIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                            index === currentPhotoIndex
                                                ? 'bg-primary w-6'
                                                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                        }`}
                                        aria-label={`Go to photo ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
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
