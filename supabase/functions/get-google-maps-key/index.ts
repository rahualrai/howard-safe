import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: Max 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);

  if (!clientData) {
    rateLimitMap.set(clientIP, { count: 1, timestamp: now });
    return true;
  }

  // Reset window if expired
  if (now - clientData.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(clientIP, { count: 1, timestamp: now });
    return true;
  }

  // Check if within limit
  if (clientData.count >= RATE_LIMIT) {
    return false;
  }

  // Increment count
  clientData.count++;
  return true;
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for') ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

function isValidOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  // Allow localhost for development
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://your-production-domain.com' // Replace with actual domain
  ];

  return allowedOrigins.some(allowed =>
    origin?.startsWith(allowed) || referer?.startsWith(allowed)
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429
        }
      );
    }

    // Origin validation (optional - enable in production)
    // if (!isValidOrigin(req)) {
    //   return new Response(
    //     JSON.stringify({ error: "Unauthorized origin" }),
    //     {
    //       headers: { ...corsHeaders, "Content-Type": "application/json" },
    //       status: 403
    //     }
    //   );
    // }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    // Log the request for monitoring
    console.log(`API key requested from IP: ${clientIP} at ${new Date().toISOString()}`);

    return new Response(
      JSON.stringify({ apiKey }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=300" // Cache for 5 minutes
        }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error in get-google-maps-key function: ${errorMessage}`);

    return new Response(
      JSON.stringify({ error: "Internal server error" }), // Don't expose internal error details
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      }
    );
  }
});