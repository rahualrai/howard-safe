-- CRITICAL SECURITY FIX: Remove the conflicting profile policy that exposes all user data
DROP POLICY IF EXISTS "Public profile info is viewable by authenticated users" ON public.profiles;

-- Fix security audit log RLS policies to enable proper logging
-- Allow authenticated users to insert their own security events
CREATE POLICY "Allow authenticated users to log security events" 
ON public.security_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Users can log events for themselves, or system events (null user_id)
  auth.uid() = user_id OR user_id IS NULL
);

-- Prevent any modifications to existing audit logs to maintain integrity
CREATE POLICY "Prevent modifications to audit logs" 
ON public.security_audit_log 
FOR UPDATE 
TO authenticated
USING (false);

CREATE POLICY "Prevent deletion of audit logs" 
ON public.security_audit_log 
FOR DELETE 
TO authenticated
USING (false);

-- Create a security definer function for system-level logging
CREATE OR REPLACE FUNCTION public.log_system_security_event(
  event_type text,
  event_details jsonb DEFAULT NULL,
  target_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    event_details,
    user_id,
    user_agent,
    ip_address
  )
  VALUES (
    event_type,
    event_details,
    target_user_id,
    'system',
    NULL
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Enhanced password validation function with more security checks
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  score integer := 0;
  has_min_length boolean := false;
  has_number boolean := false;
  has_letter boolean := false;
  has_special boolean := false;
  has_upper boolean := false;
  has_lower boolean := false;
BEGIN
  -- Check minimum length (8 characters)
  has_min_length := length(password) >= 8;
  IF has_min_length THEN score := score + 1; END IF;
  
  -- Check for numbers
  has_number := password ~ '[0-9]';
  IF has_number THEN score := score + 1; END IF;
  
  -- Check for letters
  has_letter := password ~ '[a-zA-Z]';
  IF has_letter THEN score := score + 1; END IF;
  
  -- Check for special characters
  has_special := password ~ '[!@#$%^&*()_+\-=\[\]{};'':"\\|,.<>\/?]';
  IF has_special THEN score := score + 1; END IF;
  
  -- Check for uppercase
  has_upper := password ~ '[A-Z]';
  IF has_upper THEN score := score + 1; END IF;
  
  -- Check for lowercase  
  has_lower := password ~ '[a-z]';
  IF has_lower THEN score := score + 1; END IF;
  
  -- Build result
  result := jsonb_build_object(
    'is_valid', (has_min_length AND has_number AND has_letter),
    'score', score,
    'max_score', 6,
    'requirements', jsonb_build_object(
      'min_length', has_min_length,
      'has_number', has_number,
      'has_letter', has_letter,
      'has_special', has_special,
      'has_upper', has_upper,
      'has_lower', has_lower
    )
  );
  
  RETURN result;
END;
$$;