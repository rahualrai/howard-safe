-- Create incident_reports table with proper RLS policies
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Suspicious Activity',
    'Theft/Burglary',
    'Harassment',
    'Safety Hazard',
    'Emergency',
    'Other'
  )),
  description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 2000),
  location TEXT CHECK (length(location) <= 255),
  anonymous BOOLEAN NOT NULL DEFAULT false,
  photos TEXT[], -- Array of photo URLs/paths
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}', -- For additional data like IP, user agent, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for incident reports
-- Users can view their own reports
CREATE POLICY "Users can view their own incident reports"
ON public.incident_reports
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  -- Allow viewing anonymous reports if they were created from the same session
  -- (this is a simplified approach - in production you might want session-based tracking)
  (anonymous = true AND user_id IS NULL)
);

-- Users can create incident reports
CREATE POLICY "Users can create incident reports"
ON public.incident_reports
FOR INSERT
TO authenticated
WITH CHECK (
  -- Authenticated users can create reports assigned to them
  (auth.uid() = user_id AND anonymous = false)
  OR
  -- Anonymous reports can be created (user_id should be NULL)
  (anonymous = true AND user_id IS NULL)
);

-- Only the report creator can update their own reports (limited fields)
CREATE POLICY "Users can update their own incident reports"
ON public.incident_reports
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND anonymous = false)
WITH CHECK (
  auth.uid() = user_id
  AND anonymous = false
  -- Only allow updating specific fields, not status/priority
  AND OLD.status = NEW.status
  AND OLD.priority = NEW.priority
);

-- Users can delete their own reports (within reasonable time frame)
CREATE POLICY "Users can delete their own recent incident reports"
ON public.incident_reports
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND anonymous = false
  AND created_at > (now() - interval '24 hours') -- Allow deletion within 24 hours
  AND status = 'pending' -- Only allow deletion of pending reports
);

-- Admin/moderator policy for managing all reports
-- Note: This would require implementing admin roles in your auth system
CREATE POLICY "Admins can manage all incident reports"
ON public.incident_reports
FOR ALL
TO authenticated
USING (
  -- This assumes you have a way to identify admin users
  -- You would need to implement this based on your admin system
  auth.jwt() ->> 'role' = 'admin'
  OR
  auth.jwt() ->> 'role' = 'moderator'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incident_reports_user_id ON public.incident_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON public.incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_priority ON public.incident_reports(priority);
CREATE INDEX IF NOT EXISTS idx_incident_reports_created_at ON public.incident_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_incident_reports_category ON public.incident_reports(category);

-- Create updated_at trigger
CREATE TRIGGER update_incident_reports_updated_at
BEFORE UPDATE ON public.incident_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create map_markers table for campus safety markers
CREATE TABLE IF NOT EXISTS public.map_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_lat DECIMAL(10, 8) NOT NULL,
  position_lng DECIMAL(11, 8) NOT NULL,
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 100),
  type TEXT NOT NULL CHECK (type IN ('safe', 'incident', 'welllit')),
  description TEXT CHECK (length(description) <= 500),
  verified BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on map markers
ALTER TABLE public.map_markers ENABLE ROW LEVEL SECURITY;

-- Map markers are publicly viewable (for safety purposes)
CREATE POLICY "Map markers are publicly viewable"
ON public.map_markers
FOR SELECT
TO anon, authenticated
USING (verified = true); -- Only show verified markers to public

-- Authenticated users can create markers (pending verification)
CREATE POLICY "Authenticated users can create map markers"
ON public.map_markers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND verified = false -- New markers start unverified
);

-- Users can view their own unverified markers
CREATE POLICY "Users can view their own map markers"
ON public.map_markers
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Admins can manage all markers
CREATE POLICY "Admins can manage all map markers"
ON public.map_markers
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR
  auth.jwt() ->> 'role' = 'moderator'
);

-- Create indexes for map markers
CREATE INDEX IF NOT EXISTS idx_map_markers_position ON public.map_markers(position_lat, position_lng);
CREATE INDEX IF NOT EXISTS idx_map_markers_type ON public.map_markers(type);
CREATE INDEX IF NOT EXISTS idx_map_markers_verified ON public.map_markers(verified);
CREATE INDEX IF NOT EXISTS idx_map_markers_created_by ON public.map_markers(created_by);

-- Create updated_at trigger for map markers
CREATE TRIGGER update_map_markers_updated_at
BEFORE UPDATE ON public.map_markers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();