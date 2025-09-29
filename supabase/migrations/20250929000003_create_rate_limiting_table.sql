-- Create rate limiting table for server-side rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'incident_report',
    'login_attempt',
    'password_reset',
    'profile_update',
    'global'
  )),
  attempts_count INTEGER NOT NULL DEFAULT 1 CHECK (attempts_count > 0),
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rate limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage rate limits (for security functions)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can view their own rate limit info (for transparency)
CREATE POLICY "Users can view their own rate limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for efficient rate limit checking
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action_type, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_action ON public.rate_limits(ip_address, action_type, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Create cleanup function to remove old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete rate limit records older than 24 hours
  DELETE FROM public.rate_limits
  WHERE window_start < (now() - interval '24 hours');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;

-- Create a function to get user's current rate limit status
CREATE OR REPLACE FUNCTION public.get_user_rate_limit_status(action_type_param TEXT DEFAULT 'incident_report')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_status JSON;
  window_minutes INTEGER;
  max_attempts INTEGER;
BEGIN
  -- Set limits based on action type
  CASE action_type_param
    WHEN 'incident_report' THEN
      window_minutes := 15;
      max_attempts := 3;
    WHEN 'login_attempt' THEN
      window_minutes := 5;
      max_attempts := 5;
    WHEN 'password_reset' THEN
      window_minutes := 60;
      max_attempts := 3;
    ELSE
      window_minutes := 5;
      max_attempts := 10;
  END CASE;

  -- Get the user's current rate limit status
  SELECT json_build_object(
    'action_type', action_type_param,
    'max_attempts', max_attempts,
    'window_minutes', window_minutes,
    'current_attempts', COALESCE(rl.attempts_count, 0),
    'remaining_attempts', GREATEST(0, max_attempts - COALESCE(rl.attempts_count, 0)),
    'window_start', rl.window_start,
    'window_end', rl.window_start + (window_minutes || ' minutes')::interval,
    'is_limited', COALESCE(rl.attempts_count, 0) >= max_attempts AND
                  rl.window_start + (window_minutes || ' minutes')::interval > now()
  ) INTO user_status
  FROM (
    SELECT attempts_count, window_start
    FROM public.rate_limits
    WHERE user_id = auth.uid()
      AND action_type = action_type_param
      AND window_start + (window_minutes || ' minutes')::interval > now()
    ORDER BY window_start DESC
    LIMIT 1
  ) rl;

  RETURN COALESCE(user_status, json_build_object(
    'action_type', action_type_param,
    'max_attempts', max_attempts,
    'window_minutes', window_minutes,
    'current_attempts', 0,
    'remaining_attempts', max_attempts,
    'window_start', null,
    'window_end', null,
    'is_limited', false
  ));
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_rate_limit_status(TEXT) TO authenticated;