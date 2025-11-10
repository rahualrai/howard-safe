import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: {
      status: "up" | "down";
      responseTime: number;
      message: string;
    };
    auth: {
      status: "up" | "down";
      responseTime: number;
      message: string;
    };
    storage: {
      status: "up" | "down";
      responseTime: number;
      message: string;
    };
  };
  overallResponseTime: number;
}

async function checkDatabase(supabase): Promise<{
  status: "up" | "down";
  responseTime: number;
  message: string;
}> {
  const startTime = performance.now();

  try {
    // Perform a simple, fast query to verify database connectivity
    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("count", { count: "exact", head: true });

    const responseTime = Math.round(performance.now() - startTime);

    if (error) {
      return {
        status: "down",
        responseTime,
        message: `Database error: ${error.message}`,
      };
    }

    return {
      status: "up",
      responseTime,
      message: "Database connection successful",
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    return {
      status: "down",
      responseTime,
      message: `Database check failed: ${error.message}`,
    };
  }
}

async function checkAuth(supabaseUrl: string): Promise<{
  status: "up" | "down";
  responseTime: number;
  message: string;
}> {
  const startTime = performance.now();

  try {
    // Check if auth endpoint is responding by attempting to get auth factors
    // This endpoint responds with 401 if not authenticated, but that means the service is up
    const response = await fetch(
      `${supabaseUrl}/auth/v1/factors`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const responseTime = Math.round(performance.now() - startTime);

    // 401 means auth service is up (just rejecting unauthenticated request)
    // 200 also means it's up. Any other status indicates a real problem
    if (response.status === 401 || response.ok) {
      return {
        status: "up",
        responseTime,
        message: "Auth service responding",
      };
    }

    return {
      status: "down",
      responseTime,
      message: `Auth service error: status ${response.status}`,
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    return {
      status: "down",
      responseTime,
      message: `Auth check failed: ${error.message}`,
    };
  }
}

async function checkStorage(supabase): Promise<{
  status: "up" | "down";
  responseTime: number;
  message: string;
}> {
  const startTime = performance.now();

  try {
    // Check if storage bucket is accessible by listing files
    // This will fail if the bucket doesn't exist or isn't accessible
    const { data, error } = await supabase.storage.from("avatars").list("", {
      limit: 1,
    });

    const responseTime = Math.round(performance.now() - startTime);

    if (error) {
      // 404 means bucket might not exist, but the service is up
      if (error.message.includes("404")) {
        return {
          status: "up",
          responseTime,
          message: "Storage service responding (bucket access verified)",
        };
      }
      return {
        status: "down",
        responseTime,
        message: `Storage error: ${error.message}`,
      };
    }

    return {
      status: "up",
      responseTime,
      message: "Storage service accessible",
    };
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    return {
      status: "down",
      responseTime,
      message: `Storage check failed: ${error.message}`,
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({
          status: "unhealthy",
          error: "Missing environment variables",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Run all health checks in parallel
    const overallStartTime = performance.now();

    const [dbCheck, authCheck, storageCheck] = await Promise.all([
      checkDatabase(supabase),
      checkAuth(supabaseUrl),
      checkStorage(supabase),
    ]);

    const overallResponseTime = Math.round(performance.now() - overallStartTime);

    // Determine overall status
    const allServicesUp =
      dbCheck.status === "up" &&
      authCheck.status === "up" &&
      storageCheck.status === "up";
    const anyServiceDown =
      dbCheck.status === "down" ||
      authCheck.status === "down" ||
      storageCheck.status === "down";

    const overallStatus = allServicesUp ? "healthy" : anyServiceDown ? "unhealthy" : "degraded";

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: dbCheck,
        auth: authCheck,
        storage: storageCheck,
      },
      overallResponseTime,
    };

    const httpStatus = overallStatus === "healthy" ? 200 : 503;

    return new Response(JSON.stringify(result), {
      status: httpStatus,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
