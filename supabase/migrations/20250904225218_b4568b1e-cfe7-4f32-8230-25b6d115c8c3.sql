-- Drop the existing function first to change its return type
DROP FUNCTION IF EXISTS public.validate_password_strength(text);

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