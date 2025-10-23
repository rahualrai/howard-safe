# Google API Quick Start Checklist

Use this checklist to quickly set up Google APIs for Howard Safe.

## Phase 1: Google Cloud Project Setup

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create a new project named `howard-safe`
- [ ] Enable billing on the project
- [ ] Enable **Maps JavaScript API**
- [ ] Enable **Google Calendar API**

## Phase 2: Create Google Maps API Key

- [ ] In **Credentials**, create a new **API Key**
- [ ] Copy and save the API key
- [ ] Configure **HTTP referrer restrictions**:
  - [ ] Add `http://localhost:*` (for local development)
  - [ ] Add `https://safe.rahual.com/*` (for production)
- [ ] Configure **API restrictions** to only allow **Maps JavaScript API**

## Phase 3: Create Google Calendar OAuth Credentials

### OAuth Consent Screen
- [ ] Go to **OAuth consent screen**
- [ ] Select **External** as user type
- [ ] Fill in:
  - [ ] App name: `Howard Safe`
  - [ ] User support email
  - [ ] Developer contact email
- [ ] Add scope: `https://www.googleapis.com/auth/calendar.events`
- [ ] Add yourself as a test user

### OAuth 2.0 Client ID
- [ ] In **Credentials**, create **OAuth 2.0 Client ID** (Web application)
- [ ] Set **Name**: `howard-safe-calendar`
- [ ] Add **Authorized JavaScript origins**:
  - [ ] `http://localhost:3050`
  - [ ] `http://localhost:5173`
  - [ ] `https://safe.rahual.com`
- [ ] Add **Authorized redirect URIs**:
  - [ ] `http://localhost:3050/oauth2callback`
  - [ ] `http://localhost:5173/oauth2callback`
  - [ ] `https://safe.rahual.com/oauth2callback`
- [ ] Copy and save the **Client ID** (you don't need the Client Secret for frontend)

## Phase 4: Configure Your Local Environment

- [ ] Open `howard-safe/.env`
- [ ] Update `VITE_GOOGLE_CLIENT_ID` with your new OAuth Client ID
- [ ] Keep other environment variables unchanged

Example:
```env
VITE_GOOGLE_CLIENT_ID="1234567890-xxxxxxxxxxxxx.apps.googleusercontent.com"
```

## Phase 5: Configure Supabase Edge Function

- [ ] Go to [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Select your project
- [ ] Go to **Settings** > **Environment variables**
- [ ] Click **New variable**
  - [ ] Name: `GOOGLE_MAPS_API_KEY`
  - [ ] Value: Your Google Maps API key from Phase 2
- [ ] Click **Save**

## Phase 6: Verify Everything Works

### Test Maps
- [ ] Run `npm run dev` in the howard-safe directory
- [ ] Open http://localhost:5173
- [ ] Navigate to any page with a map
- [ ] Verify the map loads without errors
- [ ] Check browser console for error messages

### Test Calendar OAuth
- [ ] Find the "Calendar Sync" card
- [ ] Click **Connect Google**
- [ ] Verify you're asked for calendar permissions
- [ ] Verify connection succeeds

## Phase 7: Production Deployment

- [ ] In Google Cloud Console, verify referrer restrictions include `https://safe.rahual.com`
- [ ] In OAuth 2.0 Client ID, verify `https://safe.rahual.com` is in authorized origins and redirect URIs
- [ ] Deploy the application to production
- [ ] Test maps and calendar on production URL

---

## Quick Reference: Where Are My Credentials?

| Credential | Location | Visibility | Security |
|------------|----------|-----------|----------|
| **Google Maps API Key** | Supabase Edge Function env var | Server-side only | ✅ Secure |
| **Google Calendar Client ID** | Local `.env` file | Frontend | ✅ Safe (public credential) |
| **Google Calendar Client Secret** | Google Cloud Console | Not used in frontend | ✅ Keep secret |

---

## Troubleshooting: Common Issues

| Issue | Solution |
|-------|----------|
| "Maps API key not configured" | Check Supabase env var `GOOGLE_MAPS_API_KEY` is set |
| "This IP is not authorized" | Add `http://localhost:*` or your domain to Maps API key HTTP referrer restrictions |
| "Client ID not found" in Calendar OAuth | Update `VITE_GOOGLE_CLIENT_ID` in `.env` and restart dev server |
| "Redirect URI not whitelisted" | Add your current domain to OAuth Client ID authorized redirect URIs |
| Maps still won't load | Check browser console for specific Google Maps errors |

---

## Full Documentation

For detailed explanations, see:
- **GOOGLE_API_SETUP.md** - Complete step-by-step Google Cloud setup
- **SUPABASE_EDGE_FUNCTION_SETUP.md** - How the secure API key delivery works
