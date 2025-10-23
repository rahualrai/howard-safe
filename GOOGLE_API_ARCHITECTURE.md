# Google API Architecture for Howard Safe

## Overview

This document explains how Google APIs are integrated into Howard Safe and why the architecture is designed this way.

---

## Components

### 1. Google Maps JavaScript API

**What it does**: Displays an interactive map with markers for safe zones, incidents, and well-lit areas on the campus.

**How it's used**:
- Component: `src/components/GoogleMapComponent.tsx`
- Wrapper: `src/components/GoogleMap.tsx` (exports the component)
- Visual library: `@googlemaps/react-wrapper` npm package

**Current Architecture**:

```
User opens app
    ↓
React component mounts (GoogleMap.tsx)
    ↓
Calls Supabase Edge Function
    ↓
Edge Function retrieves API key from Supabase env vars
    ↓
Returns API key securely to frontend
    ↓
Frontend receives key and initializes Google Maps
    ↓
Map renders with markers
```

**Why this design?**
- ✅ API key is never exposed in frontend code
- ✅ API key is never committed to Git
- ✅ API key can be changed without redeploying the app
- ✅ Follows Google's recommendation for web applications
- ✅ Keeps the key server-side, reducing exposure

---

### 2. Google Calendar API

**What it does**: Allows users to add campus events to their Google Calendar.

**How it's used**:
- Component: `src/components/CalendarSync.tsx`
- OAuth redirect handler: `src/pages/OAuth2Callback.tsx`
- Authentication method: OAuth 2.0 Implicit Flow

**Current Architecture**:

```
User clicks "Connect Google"
    ↓
Popup opens to Google OAuth consent screen
    ↓
Google asks user for calendar.events permission
    ↓
User approves
    ↓
Google redirects back to app with access token
    ↓
Frontend stores token in localStorage
    ↓
Frontend can now call Google Calendar API directly
    ↓
(Currently only creates calendar.google.com links, not API calls)
```

**Currently Supported**:
- OAuth login/authorization
- Creating calendar event links that open in Google Calendar

**Potential Future Features**:
- Direct API calls to create events programmatically
- Fetching user's calendar events
- Real-time event synchronization

**Why this design?**
- ✅ Client ID can safely be in frontend code (it's public)
- ✅ OAuth flow handles authentication securely
- ✅ Tokens are stored only on user's device (localStorage)
- ✅ Simple to implement and maintain

---

## Data Flow Diagram

### Maps API Key Retrieval

```
┌─────────────────────────────────────────────────────────────┐
│ User's Browser (Frontend)                                   │
│                                                              │
│  ┌──────────────────────────┐                               │
│  │ GoogleMap Component      │                               │
│  │ - Needs API key          │                               │
│  │ - Calls Edge Function    │                               │
│  └────────────┬─────────────┘                               │
│               │                                              │
└───────────────┼──────────────────────────────────────────────┘
                │ HTTP Request
                │ /functions/v1/get-google-maps-key
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Supabase Cloud (Backend)                                    │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │ Edge Function: get-google-maps-key       │               │
│  │ - Receives request                       │               │
│  │ - Reads GOOGLE_MAPS_API_KEY from env    │               │
│  │ - Returns { apiKey: "..." }              │               │
│  └────────────┬─────────────────────────────┘               │
│               │                                              │
└───────────────┼──────────────────────────────────────────────┘
                │ JSON Response
                │ { apiKey: "YOUR_KEY_HERE" }
                ↓
┌─────────────────────────────────────────────────────────────┐
│ User's Browser (Frontend) - Receives Response               │
│                                                              │
│  ┌──────────────────────────┐                               │
│  │ GoogleMap Component      │                               │
│  │ - Receives API key       │                               │
│  │ - Initializes Maps API   │                               │
│  │ - Renders map            │                               │
│  └──────────────────────────┘                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Google Calendar OAuth Flow

```
┌──────────────────────────────────────────┐
│ User's Browser (Frontend)                │
│                                          │
│  Click "Connect Google"                  │
│         ↓                                │
│  Open popup to Google OAuth              │
│  (using VITE_GOOGLE_CLIENT_ID)           │
│         ↓                                │
└──────────┼───────────────────────────────┘
           │
           │ Popup opens
           ↓
┌──────────────────────────────────────────┐
│ Google OAuth Server                      │
│                                          │
│  - Ask user for calendar.events scope    │
│  - User approves                         │
│  - Generate access token                 │
│  - Redirect back to app                  │
│         ↓                                │
└──────────┼───────────────────────────────┘
           │
           │ Redirect with token
           ↓
┌──────────────────────────────────────────┐
│ User's Browser (Frontend)                │
│                                          │
│  OAuth2Callback.tsx receives token       │
│         ↓                                │
│  Store token in localStorage             │
│         ↓                                │
│  CalendarSync component shows "Connected"│
│         ↓                                │
│  Token available for API calls           │
│                                          │
└──────────────────────────────────────────┘
```

---

## Environment Variables

### Required Variables

These must be set for the app to function:

| Variable | Source | Type | Used By |
|----------|--------|------|---------|
| `VITE_SUPABASE_PROJECT_ID` | Supabase Dashboard | Public | Frontend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard | Public | Frontend |
| `VITE_SUPABASE_URL` | Supabase Dashboard | Public | Frontend |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console | Public | Frontend |
| `VITE_SUPABASE_AVATAR_BUCKET` | Custom | Public | Frontend |

### Supabase Edge Function Environment Variables

These are set in Supabase dashboard and used by the Edge Function:

| Variable | Source | Type | Used By |
|----------|--------|------|---------|
| `GOOGLE_MAPS_API_KEY` | Google Cloud Console | Secret | Edge Function |

**Note**: Only the Edge Function can access variables set in Supabase. The frontend cannot directly access them.

---

## Security Analysis

### Maps API Key

**Threats**:
- ❌ Accidentally committed to Git
- ❌ Exposed in frontend bundle
- ❌ Used by unauthorized domains
- ❌ Used for unauthorized APIs

**Mitigations**:
- ✅ Stored in Supabase environment variables (not in Git)
- ✅ Retrieved at runtime via Edge Function
- ✅ Domain-restricted to authorized domains only
- ✅ API-restricted to Maps JavaScript API only
- ✅ Can be rotated without code changes

**Risk Level**: 🟢 **LOW**

### Calendar Client ID

**Threats**:
- ❌ Used by malicious apps to request calendar access (minor - only client ID, not secret)

**Mitigations**:
- ✅ Client ID is public by design (it's meant to be)
- ✅ Client Secret is NOT exposed in frontend
- ✅ OAuth flow requires user approval
- ✅ Tokens are stored locally on user's device only
- ✅ Scope is limited to calendar.events

**Risk Level**: 🟢 **LOW**

### OAuth Access Tokens

**Threats**:
- ❌ Token stored in localStorage (accessible to XSS attacks)
- ❌ Token expires but not actively refreshed

**Mitigations**:
- ✅ Token scoped to calendar.events only
- ✅ User can disconnect and revoke token anytime
- ✅ Token has expiration
- ✅ Stored locally, not transmitted to app server

**Risk Level**: 🟡 **MEDIUM** (acceptable for calendar operations)

---

## Comparison: Why Not Other Approaches?

### ❌ Approach 1: Put Maps API Key in Frontend Code

```env
VITE_GOOGLE_MAPS_API_KEY="YOUR_KEY_HERE"  // ❌ BAD
```

**Problems**:
- Key is exposed in the frontend bundle
- Key appears in Git history
- Anyone can inspect network traffic and see the key
- Key is visible in page source

### ❌ Approach 2: Backend Proxy with Custom Server

```
Frontend → Custom Backend API → Google Maps API
```

**Problems**:
- Requires maintaining a separate backend server
- Additional complexity and deployment overhead
- More infrastructure to manage

### ✅ Approach 3: Supabase Edge Function (Current)

```
Frontend → Supabase Edge Function → Google Maps API
```

**Benefits**:
- Key is stored server-side only
- No custom backend needed
- Automatic deployment and scaling
- Already using Supabase, so no new services
- Key can be rotated without code changes

---

## Performance Considerations

### Edge Function Latency

The Edge Function adds minimal latency:
- Network latency: ~50-200ms depending on location
- Function execution: ~5-20ms
- Total: ~100-300ms

This is acceptable since the Maps API key is fetched once per page load.

### Caching Strategy

**Current**: Maps key is fetched every time the component mounts

**Potential Optimization**: Cache the key in localStorage with a TTL
- Reduces calls to Edge Function
- Faster subsequent page loads
- Still allows key rotation by invalidating cache

---

## Future Improvements

### 1. Implement Authorization Code Flow for Calendar

**Current**: Implicit flow (access token in URL)
**Better**: Authorization code flow (code exchanged for token on backend)

**Benefits**:
- More secure (token never exposed in URL)
- Allows refresh tokens
- Better support for server-side operations

### 2. Direct Calendar API Integration

**Current**: Only creates calendar.google.com links
**Future**: Direct API calls for:
- Fetching user's calendar events
- Creating events programmatically
- Real-time synchronization
- Event reminders

### 3. API Key Caching

**Current**: Fetches from Edge Function on every load
**Future**: Cache in localStorage with TTL

### 4. Service Account for Server-to-Server

If you need to create calendar events without user interaction:
- Use Google Service Account with credentials.json
- No user authentication needed
- Direct API access for backend operations

---

## Monitoring and Maintenance

### Check API Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Dashboard**
3. Check usage graphs for Maps and Calendar APIs
4. Set up alerts for unusual spikes

### Rotate API Keys

If you suspect the key is compromised:

1. Create a new API key in Google Cloud Console
2. Update `GOOGLE_MAPS_API_KEY` in Supabase
3. Delete the old key
4. Monitor usage to ensure no lingering requests

### Check Quota and Billing

1. Go to **APIs & Services** > **Quotas**
2. Verify Maps and Calendar APIs have sufficient quota
3. Go to **Billing** to review charges and set budgets

---

## Troubleshooting

### Maps show but are blank

- Check browser console for Google Maps API errors
- Verify API key is valid
- Verify domain restrictions are correct
- Check quotas haven't been exceeded

### Edge Function returns error

- Verify `GOOGLE_MAPS_API_KEY` is set in Supabase
- Check Supabase function logs
- Try redeploying the function

### Calendar OAuth fails

- Verify `VITE_GOOGLE_CLIENT_ID` is correct
- Check that your domain is in authorized origins/redirect URIs
- Clear browser cache and try again

---

## Summary

Howard Safe uses a secure, scalable architecture for Google APIs:

- **Maps API**: Delivered via Supabase Edge Function (server-side storage)
- **Calendar API**: OAuth 2.0 with Client ID (user-approved access)

This design balances security, simplicity, and maintainability while keeping sensitive credentials protected.
