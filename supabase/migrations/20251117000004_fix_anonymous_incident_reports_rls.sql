-- Fix RLS policy to properly allow anonymous incident reports
-- Issue: Original policy mixed NULL comparisons with boolean checks, causing evaluation ambiguity
-- Solution: Split into two separate, explicit policies

-- Drop the ambiguous combined policy
DROP POLICY IF EXISTS "create_own_incidents" ON incident_reports;

-- Policy 1: Authenticated users can create their own non-anonymous reports
CREATE POLICY "authenticated_users_create_own_reports"
  ON incident_reports FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND is_anonymous = false
  );

-- Policy 2: Anyone (authenticated or not) can create anonymous reports
-- This policy doesn't reference auth.uid() to avoid NULL comparison ambiguity
CREATE POLICY "anyone_can_create_anonymous_reports"
  ON incident_reports FOR INSERT
  WITH CHECK (
    is_anonymous = true AND user_id IS NULL
  );
