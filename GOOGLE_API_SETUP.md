# Google Cloud API Setup Guide for Howard Safe

This guide will help you set up a Google Cloud Project and configure the necessary APIs for the Howard Safe application.

## Overview

Howard Safe uses two Google APIs:

1. **Google Maps JavaScript API** - For displaying the campus map with markers for safe zones, incidents, and well-lit areas
2. **Google Calendar API** - For adding campus events to users' Google Calendars

### Current Architecture

- **Google Maps API Key**: Stored securely in Supabase Edge Function environment variable (server-side only)
- **Google Calendar OAuth Client ID**: Stored in local `.env` file (standard practice, safe to expose)

---

## Step 1: Create a Google Cloud Project

### 1.1 Sign in to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. If you have multiple organizations, ensure you're in the correct one

### 1.2 Create a New Project

1. Click the **Project selector** dropdown at the top (currently shows a project name or "Select a project")
2. Click **New Project**
3. In the dialog that appears:
   - **Project name**: Enter `howard-safe` or your preferred name
   - **Organization**: Select your organization (if applicable)
   - **Location**: Leave as default
4. Click **Create**
5. Wait for the project to be created (this may take a minute)

### 1.3 Enable Billing (Required)

⚠️ **Google Cloud APIs require billing to be enabled**, but both Maps and Calendar have generous free tiers.

1. In the left sidebar, click **Billing**
2. Click **Link a Billing Account**
3. If you don't have a billing account, click **Create a Billing Account**
   - Enter your payment information (you won't be charged for free tier usage)
   - Accept the terms and click **Create Account**
4. Link the billing account to your project

---

## Step 2: Enable Required APIs

### 2.1 Enable Maps JavaScript API

1. Go to **APIs & Services** > **Library** (left sidebar)
2. Search for `Maps JavaScript API`
3. Click on **Maps JavaScript API**
4. Click **Enable**
5. Wait for the API to be enabled (you'll see a blue checkmark)

### 2.2 Enable Google Calendar API

1. Go back to **APIs & Services** > **Library**
2. Search for `Google Calendar API`
3. Click on **Google Calendar API**
4. Click **Enable**

### 2.3 Verify APIs are Enabled

1. Go to **APIs & Services** > **Enabled APIs & services**
2. You should see both:
   - Maps JavaScript API
   - Google Calendar API

---

## Step 3: Create API Key for Google Maps

### 3.1 Create the API Key

1. Go to **APIs & Services** > **Credentials** (left sidebar)
2. Click **Create Credentials** (top button)
3. Select **API Key**
4. A dialog will appear showing your new API key
5. Click **Copy** to copy the key
6. **Save this key** - you'll need it in the next steps
7. Click **Close**

### 3.2 Configure API Key Restrictions (Important for Security)

⚠️ **Without restrictions, anyone with your API key can make unlimited requests and accumulate charges**

1. In the **Credentials** page, find your newly created API key
2. Click on it to open the details
3. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Click **Add an item**
   - Enter your domain(s):
     - For local development: `http://localhost:*`
     - For production (Cloudflare Tunnel): `https://safe.rahual.com/*`
     - For any other domains you plan to use, add them similarly
     - **Pattern examples**:
       - `http://localhost:*` - matches any port on localhost
       - `https://safe.rahual.com/*` - matches safe.rahual.com and all subpaths
       - `https://*.rahual.com/*` - matches all subdomains

4. Under **API restrictions**:
   - Select **Restrict key**
   - Click **Select APIs**
   - Search for and select **Maps JavaScript API**
   - Click **Select**

5. Click **Save** at the bottom

Your API key is now restricted to your domains and can only be used with the Maps JavaScript API.

---

## Step 4: Create OAuth 2.0 Credentials for Google Calendar

### 4.1 Create OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen** (left sidebar)
2. Select **External** (recommended for testing) or **Internal** (if available in your org)
3. Click **Create**
4. Fill in the form:

   **User type**: External

   **Basic Information**:
   - **App name**: `Howard Safe`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address

5. Click **Save and Continue**

### 4.2 Define Scopes

1. In the **Scopes** tab, click **Add or Remove Scopes**
2. Search for and select: `https://www.googleapis.com/auth/calendar.events`
3. Click **Update**
4. Click **Save and Continue**

### 4.3 Add Test Users (if External)

1. In the **Test users** tab, click **Add Users**
2. Enter your email address(es) - these users can authenticate with the app
3. Click **Save and Continue**
4. Review the information and click **Back to Dashboard**

### 4.4 Create OAuth Client ID

1. Go to **APIs & Services** > **Credentials** (left sidebar)
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Under **Name**, enter `howard-safe-calendar` or similar
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3050` (local development)
   - `http://localhost:5173` (Vite dev server)
   - `https://safe.rahual.com` (production)

6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3050/oauth2callback`
   - `http://localhost:5173/oauth2callback`
   - `https://safe.rahual.com/oauth2callback`

7. Click **Create**
8. A dialog will appear showing:
   - **Client ID** (looks like `740778288759-xxxxx.apps.googleusercontent.com`)
   - **Client Secret** (keep this secret!)
9. Click **Copy** next to the Client ID and save it
10. Click **OK**

⚠️ **IMPORTANT**: The Client Secret should NOT be used in frontend code. It's only for backend server-to-server authentication. The Client ID can safely be in your frontend `.env` file since it's meant to be public.

---

## Step 5: Update Your Environment Configuration

### 5.1 Update `.env` File

Open `/home/rahual/rahual-server/howard-safe/.env` and update:

```env
# Existing Supabase configuration
VITE_SUPABASE_PROJECT_ID="cgccjvoedbbsjqzchtmo"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnY2Nqdm9lZGJic2pxemNodG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTA5MzMsImV4cCI6MjA3MjU4NjkzM30.ccdSAioLunlGaeQkZ0_WkxJ0_YhRXWOSUPGz2s8p434"
VITE_SUPABASE_URL="https://cgccjvoedbbsjqzchtmo.supabase.co"
VITE_SUPABASE_AVATAR_BUCKET=avatars

# Update the Google Calendar Client ID with your new OAuth Client ID
VITE_GOOGLE_CLIENT_ID="YOUR_NEW_OAUTH_CLIENT_ID"
```

Replace `YOUR_NEW_OAUTH_CLIENT_ID` with the Client ID you created in Step 4.4.

### 5.2 Update Supabase Edge Function

You need to add the Google Maps API key to your Supabase project's environment variables:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`howard-safe`)
3. Go to **Settings** > **Environment variables** (in left sidebar)
4. Click **New variable**
5. **Name**: `GOOGLE_MAPS_API_KEY`
6. **Value**: Paste your Google Maps API key from Step 3.1
7. Click **Save**
8. The Edge Function will automatically have access to this variable

---

## Step 6: Verify Setup

### 6.1 Test Google Maps

1. Start the Howard Safe development server:
   ```bash
   cd /home/rahual/rahual-server/howard-safe
   npm run dev
   ```

2. Open `http://localhost:5173` in your browser
3. Navigate to any page with the map component (e.g., Campus Safety page)
4. Verify the map loads without errors
5. Check browser console for any API errors

### 6.2 Test Google Calendar OAuth

1. On the same page, find the "Calendar Sync" card
2. Click **Connect Google**
3. A popup window should open to Google's OAuth consent screen
4. Verify you're being asked for `calendar.events` scope
5. Click **Allow** (if External consent screen) or authenticate
6. Verify the connection succeeds and shows "Google connected"

### 6.3 Check Error Messages

If you see errors:

- **Maps API errors**:
  - Check that `GOOGLE_MAPS_API_KEY` is set in Supabase Edge Function environment variables
  - Verify the API key is restricted to your domain
  - Check browser console for specific error messages

- **Calendar OAuth errors**:
  - Verify the Client ID is correct in your `.env` file
  - Check that your current domain is in the authorized redirect URIs
  - Verify the Calendar API is enabled in GCP

---

## Security Best Practices

### API Key Security

✅ **What you're doing right**:
- Google Maps API key is stored server-side in Supabase Edge Function
- API key is restricted to HTTP referrers (domain restrictions)
- API key is restricted to only the Maps JavaScript API

⚠️ **What to watch out for**:
- Never commit API keys to Git (use `.env` files)
- Regularly rotate API keys if compromised
- Monitor your GCP billing for unusual API usage

### OAuth Security

✅ **What's good**:
- Client ID is safe to expose (it's public)
- Client Secret is NOT used in frontend code
- OAuth flow uses standard popup authentication

⚠️ **What to improve**:
- Currently using OAuth implicit flow (sufficient for calendar read/write)
- For production, consider using the authorization code flow with a backend server
- Store access tokens securely (current localStorage approach is acceptable for calendar events)

---

## Troubleshooting

### Maps API shows "API key not configured"

**Solution**:
- Ensure `GOOGLE_MAPS_API_KEY` is set in Supabase Edge Function environment variables
- Restart the Supabase Edge Function (redeploy the function)

```bash
supabase functions deploy get-google-maps-key
```

### Maps API shows "This IP, browser or Android app is not authorized"

**Solution**:
- Your API key restrictions are too strict
- Add your current IP/domain to the HTTP referrer restrictions
- If testing locally, ensure `http://localhost:*` is in the allowed referrers

### Calendar OAuth shows "Client ID not found" or "The redirect URI is not whitelisted"

**Solution**:
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly in `.env`
- Ensure your current domain (or `localhost:5173` for dev) is in the authorized JavaScript origins AND redirect URIs

### "Invalid scope" error in Calendar OAuth

**Solution**:
- Verify you requested the correct scope: `https://www.googleapis.com/auth/calendar.events`
- This scope is configured in the OAuth consent screen

---

## Next Steps

1. **Set up for production**:
   - Update authorized URIs to use your Cloudflare Tunnel domain (`https://safe.rahual.com`)
   - Consider moving to authorization code flow for better security

2. **Monitor API usage**:
   - Go to **APIs & Services** > **Dashboard** to see usage
   - Set up billing alerts in GCP

3. **Document credentials**:
   - Keep your API key and Client ID safe
   - Store Client ID (public) and Client Secret (if using server-side auth) securely

---

## Reference

- [Google Cloud Console](https://console.cloud.google.com/)
- [Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
