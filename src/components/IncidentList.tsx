import { useState } from 'react';
import { useIncidents } from '@/hooks/useIncidents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPin, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export interface IncidentListProps {
  limit?: number;
  showFilters?: boolean;
  onIncidentClick?: (incidentId: string) => void;
}

const INCIDENT_CATEGORIES: Record<string, { label: string; color: string }> = {
  suspicious_activity: { label: 'Suspicious Activity', color: 'bg-yellow-100 text-yellow-800' },
  safety_hazard: { label: 'Safety Hazard', color: 'bg-orange-100 text-orange-800' },
  medical_emergency: { label: 'Medical Emergency', color: 'bg-red-100 text-red-800' },
  theft: { label: 'Theft/Property Crime', color: 'bg-red-100 text-red-800' },
  harassment: { label: 'Harassment', color: 'bg-purple-100 text-purple-800' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800' },
};

export const IncidentList = ({
  limit = 10,
  showFilters = true,
  onIncidentClick,
}: IncidentListProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();

  const { data: incidents, isLoading, error } = useIncidents({
    category: selectedCategory,
    status: selectedStatus,
    limit,
    includePhotos: true,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryInfo = (category: string) => {
    return INCIDENT_CATEGORIES[category] || { label: category, color: 'bg-gray-100 text-gray-800' };
  };

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Failed to load incidents. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {showFilters && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Select value={selectedCategory || ''} onValueChange={(v) => setSelectedCategory(v || undefined)}>
            <SelectTrigger className="w-48 flex-shrink-0">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {Object.entries(INCIDENT_CATEGORIES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus || ''} onValueChange={(v) => setSelectedStatus(v || undefined)}>
            <SelectTrigger className="w-48 flex-shrink-0">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : incidents && incidents.length > 0 ? (
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {incidents.map((incident, index) => {
            const categoryInfo = getCategoryInfo(incident.category);
            return (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onIncidentClick?.(incident.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <AlertTriangle className="text-destructive mt-1 flex-shrink-0" size={20} />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base line-clamp-2">{incident.description.substring(0, 60)}...</CardTitle>
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${categoryInfo.color}`}>
                            {categoryInfo.label}
                          </span>
                        </div>
                      </div>
                      {incident.status && (
                        <span className="text-xs font-medium px-2 py-1 bg-muted rounded flex-shrink-0">
                          {incident.status}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {incident.location_text && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={16} className="flex-shrink-0" />
                        <span className="line-clamp-1">{incident.location_text}</span>
                      </div>
                    )}

                    {incident.incident_time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={16} className="flex-shrink-0" />
                        <span>{formatDate(incident.incident_time)}</span>
                      </div>
                    )}

                    {!incident.is_anonymous && incident.user_id && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User size={16} className="flex-shrink-0" />
                        <span>Reported by registered user</span>
                      </div>
                    )}

                    {incident.is_anonymous && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User size={16} className="flex-shrink-0" />
                        <span>Anonymous report</span>
                      </div>
                    )}

                    {incident.incident_photos && incident.incident_photos.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        📸 {incident.incident_photos.length} photo{incident.incident_photos.length !== 1 ? 's' : ''} attached
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Reported {formatDate(incident.reported_at)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No incidents to display</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
