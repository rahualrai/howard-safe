-- Create incident_reports table
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('suspicious_activity', 'safety_hazard', 'medical_emergency', 'theft', 'harassment', 'other')),
  category_custom TEXT,
  location_text TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT NOT NULL,
  incident_time TIMESTAMPTZ,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  client_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incident_photos table
CREATE TABLE incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_incident_reports_user_id ON incident_reports(user_id);
CREATE INDEX idx_incident_reports_category ON incident_reports(category);
CREATE INDEX idx_incident_reports_reported_at ON incident_reports(reported_at DESC);
CREATE INDEX idx_incident_reports_status ON incident_reports(status);
CREATE INDEX idx_incident_reports_coordinates ON incident_reports(latitude, longitude);
CREATE INDEX idx_incident_photos_incident_id ON incident_photos(incident_id);

-- Enable RLS
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view non-anonymous incidents
CREATE POLICY "view_public_incidents"
  ON incident_reports FOR SELECT
  USING (is_anonymous = false);

-- RLS Policy: Users can view their own incidents (anonymous or not)
CREATE POLICY "view_own_incidents"
  ON incident_reports FOR SELECT
  USING (auth.uid() = user_id AND is_anonymous = false);

-- RLS Policy: Users can insert their own incidents
CREATE POLICY "create_own_incidents"
  ON incident_reports FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id) OR
    (is_anonymous = true AND user_id IS NULL)
  );

-- RLS Policy: Users can update their own incidents
CREATE POLICY "update_own_incidents"
  ON incident_reports FOR UPDATE
  USING (auth.uid() = user_id OR (is_anonymous = true AND user_id IS NULL))
  WITH CHECK (auth.uid() = user_id OR (is_anonymous = true AND user_id IS NULL));

-- RLS Policy: View incident photos for public incidents
CREATE POLICY "view_incident_photos"
  ON incident_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM incident_reports
      WHERE incident_reports.id = incident_photos.incident_id
      AND (incident_reports.is_anonymous = false OR auth.uid() = incident_reports.user_id)
    )
  );

-- RLS Policy: Users can upload photos for their incidents
CREATE POLICY "create_incident_photos"
  ON incident_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM incident_reports
      WHERE incident_reports.id = incident_photos.incident_id
      AND (auth.uid() = incident_reports.user_id OR
           (incident_reports.is_anonymous = true AND incident_reports.user_id IS NULL))
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_incident_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER incident_reports_updated_at
BEFORE UPDATE ON incident_reports
FOR EACH ROW
EXECUTE FUNCTION update_incident_reports_updated_at();
