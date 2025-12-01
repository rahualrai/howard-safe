# Incident Reporting Feature - Complete Implementation Guide

## Overview

The incident reporting feature has been fully implemented with real database integration, GPS location capture, photo uploads, and public incident viewing. This guide walks you through the remaining setup steps and usage.

## What's Been Implemented

### ✅ Completed Features

1. **Database Schema** (`20251117000003_add_incident_reports_schema.sql`)
   - `incident_reports` table with fields for category, location, GPS coordinates, description, incident time, and status
   - `incident_photos` table for linking photos to incidents
   - RLS policies for privacy and security
   - Indexes for performance optimization
   - Auto-updating `updated_at` timestamp

2. **Frontend Components**
   - **ReportIncident.tsx**: Enhanced form with:
     - GPS location capture (live geolocation)
     - Incident time picker (when did this happen?)
     - Real Supabase database integration
     - Photo upload support
     - Rate limiting (3 reports per 5 minutes)
     - Input sanitization and validation

3. **Services & Utilities**
   - **incidentPhotoService.ts**: Photo upload/download service
     - Upload single or batch photos
     - Delete photos
     - Generate signed URLs
     - File validation

4. **Data Fetching**
   - **useIncidents.tsx**: React Query hook for fetching incidents
     - Supports filtering by status, category, limit
     - Real-time subscriptions for new incidents
     - Geographic proximity filtering

5. **UI Components**
   - **IncidentList.tsx**: Display incidents in card format with filters
   - **IncidentMap.tsx**: Map overlay showing incident locations with markers

## Remaining Setup Steps

### 1. Push Database Migration

If not already applied, push the database migration:

```bash
export SUPABASE_ACCESS_TOKEN="your_token_here"
npx supabase db push
```

### 2. Create Supabase Storage Bucket

Create a storage bucket for incident photos:

```bash
# Via Supabase Dashboard:
1. Go to Storage → Buckets
2. Click "New bucket"
3. Name: "incident-photos"
4. Make it PUBLIC (important for photo access)
5. Click Create

# Via CLI (alternative):
curl -X POST 'https://YOUR_PROJECT.supabase.co/storage/v1/bucket' \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "incident-photos", "public": true}'
```

### 3. Configure Storage Policies

In Supabase Dashboard, set upload policy:

```sql
-- Allow authenticated users and anonymous users to upload
CREATE POLICY "Allow authenticated and anonymous uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'incident-photos' AND
  (auth.role() = 'authenticated' OR auth.uid() IS NULL)
);

-- Allow public read access
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'incident-photos');
```

### 4. Update Environment Variables

Ensure your `.env` file has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## Using the Incident Reporting Feature

### For Users - Reporting an Incident

1. **Navigate to Report Incident** page from bottom navigation
2. **Select Category**: Choose from predefined categories
3. **Capture Location**: Click "Capture Current Location" to add GPS coordinates
4. **Describe Incident**: Write detailed description (10-2000 characters)
5. **Set Time**: Indicate when the incident occurred
6. **Add Photos**: Capture up to 3 photos as evidence
7. **Anonymous Option**: Check if you want to report anonymously
8. **Submit**: Click "Submit Report"

### For Developers - Viewing Incidents

#### In the Map Component

```tsx
import { IncidentMap } from '@/components/IncidentMap';

export function MapPage() {
  return (
    <IncidentMap
      maxDistance={5} // 5km radius
      onIncidentClick={(incidentId) => {
        // Handle incident click
        console.log('Incident clicked:', incidentId);
      }}
    />
  );
}
```

#### In a List Component

```tsx
import { IncidentList } from '@/components/IncidentList';

export function IncidentsPage() {
  return (
    <IncidentList
      limit={20}
      showFilters={true}
      onIncidentClick={(incidentId) => {
        // Navigate to detail page
      }}
    />
  );
}
```

#### Using the Hook Directly

```tsx
import { useIncidents } from '@/hooks/useIncidents';

export function MyComponent() {
  const { data: incidents, isLoading, error } = useIncidents({
    category: 'theft',
    status: 'pending',
    limit: 10,
    includePhotos: true
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {incidents?.map(incident => (
        <div key={incident.id}>
          {incident.description}
          {incident.incident_photos?.map(photo => (
            <img key={photo.id} src={photo.storage_path} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Database Schema Details

### incident_reports Table

```sql
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  category TEXT NOT NULL, -- suspicious_activity, safety_hazard, medical_emergency, theft, harassment, other
  category_custom TEXT, -- Custom category if "other" selected
  location_text TEXT, -- User-entered location name
  latitude DECIMAL(10, 8), -- GPS latitude
  longitude DECIMAL(11, 8), -- GPS longitude
  description TEXT NOT NULL, -- Incident details
  incident_time TIMESTAMPTZ, -- When the incident occurred
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When reported
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending', -- pending, investigating, resolved, dismissed
  client_info JSONB, -- Browser info, IP, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### incident_photos Table

```sql
CREATE TABLE incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Features

1. **RLS Policies**: Users can only view their own incidents or public (non-anonymous) incidents
2. **Rate Limiting**: 3 reports per 5 minutes per user
3. **Input Sanitization**: All text inputs are sanitized to prevent XSS
4. **Anonymous Reporting**: Users can report without revealing identity
5. **GPS Privacy**: Coordinates only captured with user permission
6. **File Validation**: Photos are validated for type and size (5MB max)

## API Integration Points

### Photo Upload

```typescript
import { IncidentPhotoService } from '@/services/incidentPhotoService';

const result = await IncidentPhotoService.uploadPhoto(
  file,           // File object
  incidentId,     // UUID of incident
  userId          // Optional user ID
);

if (result.success) {
  console.log('Photo uploaded:', result.url);
}
```

### Incident Submission

The form automatically:
1. Creates incident record in `incident_reports`
2. Uploads photos to `incident-photos` bucket
3. Creates photo-incident links in `incident_photos`
4. Logs security events
5. Provides user feedback

## Testing the Feature

### Test Incident Submission

1. Go to Report Incident page
2. Fill in all required fields
3. Click "Capture Current Location"
4. Add at least one photo
5. Submit

Check Supabase:
- Incident appears in `incident_reports`
- Photos uploaded to `incident-photos` bucket
- Photo records created in `incident_photos` table

### Test Incident Viewing

1. Go to Map page - incidents should appear as red markers
2. Click markers to see incident details
3. Use filters in IncidentList to filter by category/status

### Test Privacy

1. Submit incident anonymously
2. Check Supabase - `user_id` should be NULL
3. Public incidents are visible, anonymous ones are not

## Future Enhancements

- [ ] Admin dashboard for managing incidents
- [ ] Status updates and notifications
- [ ] Export reports to PDF
- [ ] Incident heatmaps
- [ ] Automated alerts for emergency situations
- [ ] Integration with campus security system
- [ ] Real-time notifications for new nearby incidents
- [ ] Photo evidence gallery with thumbnails
- [ ] Incident clustering on map for dense areas

## Troubleshooting

### Photos not uploading

1. Check Supabase Storage bucket "incident-photos" exists
2. Verify bucket is PUBLIC
3. Check file size < 5MB
4. Verify auth is working (check console for errors)

### Location not capturing

1. Check browser geolocation permissions
2. Ensure HTTPS in production (required for geolocation)
3. Check device location services are enabled

### Incidents not appearing on map

1. Verify incidents exist in database with latitude/longitude
2. Check coordinates are valid (lat: -90 to 90, lng: -180 to 180)
3. Verify incident is not anonymous
4. Check map is loading (no API key errors)

### RLS errors when submitting

1. Check user is authenticated or form sets `is_anonymous: true`
2. Verify RLS policies allow inserts for authenticated users
3. Check browser console for specific error message

## Files Created/Modified

### New Files
- `/src/services/incidentPhotoService.ts` - Photo upload service
- `/src/hooks/useIncidents.tsx` - Data fetching hook
- `/src/components/IncidentList.tsx` - Incident list component
- `/src/components/IncidentMap.tsx` - Map with incident markers
- `supabase/migrations/20251117000003_add_incident_reports_schema.sql` - Database schema

### Modified Files
- `/src/pages/ReportIncident.tsx` - Added GPS, time picker, real submission

## Support

For issues or questions about the incident reporting feature, check:
1. Supabase logs for database errors
2. Browser console for client-side errors
3. Network tab for API failures
4. RLS policy restrictions
