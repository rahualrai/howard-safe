import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMITS = {
  incident_report: {
    maxAttempts: 3,
    windowMinutes: 15,
  },
  global: {
    maxAttempts: 10,
    windowMinutes: 5,
  }
};

interface RateLimitRecord {
  id: string;
  user_id: string | null;
  ip_address: string;
  action_type: string;
  attempts_count: number;
  window_start: string;
  created_at: string;
}

interface IncidentReportData {
  category: string;
  description: string;
  location?: string;
  anonymous: boolean;
  photos?: string[];
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown';
}

async function checkRateLimit(
  supabase: any,
  userId: string | null,
  ipAddress: string,
  actionType: string
): Promise<{ allowed: boolean; remainingAttempts: number; resetTime: Date }> {
  const limits = RATE_LIMITS[actionType as keyof typeof RATE_LIMITS] || RATE_LIMITS.global;
  const windowStart = new Date(Date.now() - limits.windowMinutes * 60 * 1000);

  // Check rate limits by user_id (if authenticated) or IP address
  const identifier = userId || ipAddress;
  const identifierField = userId ? 'user_id' : 'ip_address';

  const { data: existingRecords, error } = await supabase
    .from('rate_limits')
    .select('*')
    .eq(identifierField, identifier)
    .eq('action_type', actionType)
    .gte('window_start', windowStart.toISOString())
    .order('window_start', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Rate limit check error:', error);
    // Fail closed - deny if we can't check rate limits
    return { allowed: false, remainingAttempts: 0, resetTime: new Date() };
  }

  const now = new Date();
  let currentRecord = existingRecords?.[0];

  if (!currentRecord) {
    // First attempt in this window - create new record
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        user_id: userId,
        ip_address: ipAddress,
        action_type: actionType,
        attempts_count: 1,
        window_start: now.toISOString(),
      });

    if (insertError) {
      console.error('Rate limit insert error:', insertError);
      return { allowed: false, remainingAttempts: 0, resetTime: now };
    }

    return {
      allowed: true,
      remainingAttempts: limits.maxAttempts - 1,
      resetTime: new Date(now.getTime() + limits.windowMinutes * 60 * 1000)
    };
  }

  // Check if we're still within the same window
  const recordWindowStart = new Date(currentRecord.window_start);
  const windowEnd = new Date(recordWindowStart.getTime() + limits.windowMinutes * 60 * 1000);

  if (now > windowEnd) {
    // Window expired, start a new one
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        user_id: userId,
        ip_address: ipAddress,
        action_type: actionType,
        attempts_count: 1,
        window_start: now.toISOString(),
      });

    if (insertError) {
      console.error('Rate limit new window error:', insertError);
      return { allowed: false, remainingAttempts: 0, resetTime: now };
    }

    return {
      allowed: true,
      remainingAttempts: limits.maxAttempts - 1,
      resetTime: new Date(now.getTime() + limits.windowMinutes * 60 * 1000)
    };
  }

  // Within the same window - check if limit exceeded
  if (currentRecord.attempts_count >= limits.maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: windowEnd
    };
  }

  // Increment attempt count
  const { error: updateError } = await supabase
    .from('rate_limits')
    .update({ attempts_count: currentRecord.attempts_count + 1 })
    .eq('id', currentRecord.id);

  if (updateError) {
    console.error('Rate limit update error:', updateError);
    return { allowed: false, remainingAttempts: 0, resetTime: windowEnd };
  }

  return {
    allowed: true,
    remainingAttempts: limits.maxAttempts - (currentRecord.attempts_count + 1),
    resetTime: windowEnd
  };
}

function validateIncidentData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.category || typeof data.category !== 'string') {
    errors.push('Category is required');
  } else if (!['Suspicious Activity', 'Theft/Burglary', 'Harassment', 'Safety Hazard', 'Emergency', 'Other'].includes(data.category)) {
    errors.push('Invalid category');
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('Description is required');
  } else if (data.description.length < 10 || data.description.length > 2000) {
    errors.push('Description must be between 10 and 2000 characters');
  }

  if (data.location && (typeof data.location !== 'string' || data.location.length > 255)) {
    errors.push('Location must be a string with maximum 255 characters');
  }

  if (typeof data.anonymous !== 'boolean') {
    errors.push('Anonymous flag must be a boolean');
  }

  if (data.photos && (!Array.isArray(data.photos) || data.photos.length > 5)) {
    errors.push('Photos must be an array with maximum 5 items');
  }

  return { valid: errors.length === 0, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user info from authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | null = null;
    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);

    // Check rate limits
    const rateLimitResult = await checkRateLimit(supabase, userId, clientIP, 'incident_report');

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many incident reports submitted. Please try again later.",
          resetTime: rateLimitResult.resetTime.toISOString()
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000).toString()
          },
          status: 429
        }
      );
    }

    // Parse and validate request body
    let incidentData: IncidentReportData;
    try {
      incidentData = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const validation = validateIncidentData(incidentData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validation.errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Sanitize the input data
    const sanitizedData = {
      user_id: incidentData.anonymous ? null : userId,
      category: incidentData.category.trim(),
      description: incidentData.description.trim(),
      location: incidentData.location?.trim() || null,
      anonymous: incidentData.anonymous,
      photos: incidentData.photos || [],
      status: 'pending',
      priority: 'medium', // Default priority, can be adjusted by admins
      metadata: {
        ip_address: clientIP,
        user_agent: userAgent,
        submitted_at: new Date().toISOString()
      }
    };

    // Insert the incident report
    const { data: insertedReport, error: insertError } = await supabase
      .from('incident_reports')
      .insert([sanitizedData])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: "Failed to submit incident report" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Log the security event
    if (userId) {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: userId,
          event_type: 'incident_report_submitted',
          event_details: {
            report_id: insertedReport.id,
            category: insertedReport.category,
            anonymous: insertedReport.anonymous
          },
          ip_address: clientIP,
          user_agent: userAgent
        });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        reportId: insertedReport.id,
        message: "Incident report submitted successfully",
        remainingAttempts: rateLimitResult.remainingAttempts
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});