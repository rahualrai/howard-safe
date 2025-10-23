# Supabase Edge Function Configuration for Google Maps API

This guide explains how to configure and deploy the Supabase Edge Function that securely serves your Google Maps API key to the frontend.

## Overview

The `get-google-maps-key` Edge Function is a Deno-based serverless function that:

1. **Stores the API key securely** on the server side (never exposed in frontend bundle)
2. **Retrieves the key at runtime** when the frontend requests it
3. **Serves the key via a simple JSON endpoint** that the frontend can call

This approach keeps your API key safe while allowing the Maps component to function properly.

---

## Step 1: Add API Key to Supabase Environment Variables

### 1.1 Navigate to Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`howard-safe`)
3. In the left sidebar, click **Settings** (gear icon at the bottom)
4. Click **Environment variables** or **Secrets**

### 1.2 Add Google Maps API Key

1. Click **New variable** or **Add secret**
2. **Name**: `GOOGLE_MAPS_API_KEY`
3. **Value**: Paste your Google Maps API key that you created in the Google Cloud Console
4. Click **Save**

The environment variable is now available to all Edge Functions in your Supabase project.

---

## Step 2: Understand the Edge Function

The existing Edge Function at `supabase/functions/get-google-maps-key/index.ts` does the following:

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Retrieve the API key from environment variables (server-side)
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    // Return the API key as JSON
    return new Response(
      JSON.stringify({ apiKey }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
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
```

**What it does**:
- Listens for HTTP requests to the endpoint
- Handles CORS preflight requests (OPTIONS)
- Retrieves `GOOGLE_MAPS_API_KEY` from environment variables
- Returns the key in JSON format: `{ apiKey: "YOUR_KEY_HERE" }`
- Returns an error if the key is not configured

---

## Step 3: Deploy the Edge Function

### 3.1 Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to the howard-safe directory
cd /home/rahual/rahual-server/howard-safe

# Deploy the specific function
supabase functions deploy get-google-maps-key

# The output will show the function URL and deployment status
```

### 3.2 Using Supabase Dashboard

1. Go to **Edge Functions** in the left sidebar
2. Click on `get-google-maps-key`
3. You should see the function code
4. The environment variable `GOOGLE_MAPS_API_KEY` should be available

If you don't see the function, you may need to create it:

1. Click **Create new function**
2. Name it `get-google-maps-key`
3. Copy the code from `supabase/functions/get-google-maps-key/index.ts`
4. Click **Deploy**

---

## Step 4: Test the Edge Function

### 4.1 Get the Function URL

The function URL will be:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/get-google-maps-key
```

Replace `YOUR_PROJECT_ID` with your Supabase project ID from `.env`:
```
VITE_SUPABASE_PROJECT_ID="cgccjvoedbbsjqzchtmo"  # Example
```

### 4.2 Test with cURL

```bash
curl https://cgccjvoedbbsjqzchtmo.supabase.co/functions/v1/get-google-maps-key
```

**Expected response**:
```json
{
  "apiKey": "YOUR_ACTUAL_API_KEY_HERE"
}
```

### 4.3 Test in Browser

1. Open your browser's developer console (F12)
2. Run:
```javascript
fetch('https://cgccjvoedbbsjqzchtmo.supabase.co/functions/v1/get-google-maps-key')
  .then(r => r.json())
  .then(console.log)
```

You should see the API key returned in the console.

### 4.4 Test in the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open the application in your browser
3. Navigate to any page with the map (e.g., Campus Safety)
4. Check the Network tab in developer tools
5. Look for a request to `/functions/v1/get-google-maps-key`
6. Verify the response contains your API key

---

## Step 5: Understand How the Frontend Uses It

The `GoogleMapComponent.tsx` file calls this function:

```typescript
useEffect(() => {
  const fetchApiKey = async () => {
    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');

      if (error) throw error;
      if (!data?.apiKey) throw new Error('No API key received');

      // Store the key in state
      setApiKey(data.apiKey);
    } catch (err) {
      console.error('Error fetching Google Maps API key:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  fetchApiKey();
}, []);
```

**Flow**:
1. Component mounts
2. Calls the Edge Function via `supabase.functions.invoke()`
3. Receives the API key in the response
4. Passes it to the `@googlemaps/react-wrapper` component
5. The Maps API is initialized with the secure key

---

## Step 6: Redeploy When Changes Are Made

Whenever you need to update the API key:

1. Update the `GOOGLE_MAPS_API_KEY` environment variable in Supabase
2. The Edge Function automatically uses the new value (no redeploy needed)

If you modify the Edge Function code itself:

1. Make changes to `supabase/functions/get-google-maps-key/index.ts`
2. Redeploy:
   ```bash
   supabase functions deploy get-google-maps-key
   ```

---

## Troubleshooting

### "Google Maps API key not configured"

**Problem**: The Edge Function returns an error about missing API key.

**Solution**:
1. Verify the environment variable is set in Supabase:
   - Go to **Settings** > **Environment variables**
   - Look for `GOOGLE_MAPS_API_KEY`
2. Verify it has a value (not empty)
3. Redeploy the function:
   ```bash
   supabase functions deploy get-google-maps-key
   ```

### "Failed to load map" in the UI

**Problem**: The map component shows an error loading the map.

**Solution**:
1. Open browser developer console (F12)
2. Check the Network tab for the `/functions/v1/get-google-maps-key` request
3. Verify it returns `{ apiKey: "..." }` with a valid key
4. Check the Console tab for any JavaScript errors
5. Verify your API key is valid in Google Cloud Console

### CORS errors ("Access to fetch has been blocked by CORS policy")

**Problem**: The browser blocks the request to the Edge Function.

**Solution**:
- The Edge Function includes CORS headers to allow cross-origin requests
- Verify the `corsHeaders` are being sent in the response
- Check that your Supabase project URL is correct in `.env`

### API key works but maps still don't load

**Problem**: Maps API key is valid but maps fail to render.

**Solution**:
1. Verify the Maps JavaScript API is enabled in Google Cloud Console
2. Verify the API key is restricted to the correct domains
3. Check that HTTP referrer restrictions include your current domain
4. Check browser console for specific Google Maps API errors

---

## Security Considerations

### Why This Approach is Secure

✅ **API key never appears in frontend bundle** - It's fetched at runtime from the server

✅ **API key is restricted at Google Cloud level** - Only works for Maps API on authorized domains

✅ **No exposure in Git history** - The key is stored in Supabase environment variables, not in code

### API Key Rotation

If you suspect your API key has been compromised:

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Delete the compromised API key
3. Create a new API key (repeat steps from GOOGLE_API_SETUP.md Step 3)
4. Update `GOOGLE_MAPS_API_KEY` in Supabase environment variables
5. The application automatically uses the new key

---

## Next Steps

1. **Monitor usage**: Check Google Cloud Console > APIs & Services > Dashboard for Maps API usage
2. **Set up billing alerts**: Prevent unexpected charges from unusually high API usage
3. **Plan for scale**: If usage grows significantly, consider caching the key or using a different architecture

---

## Reference

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
