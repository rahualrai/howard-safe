# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Howard Safe is a comprehensive campus safety application designed for the Howard University community. It's a React 18 + TypeScript application built with Vite, featuring mobile capabilities via Capacitor, secure authentication via Supabase, and interactive campus maps.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC compilation
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS 3 with custom HSL theming for light/dark modes
- **Authentication**: Supabase Auth with 2FA support
- **State Management**: React Query (@tanstack/react-query) for server state, React Context for auth
- **Routing**: React Router v6 with lazy-loaded pages for code splitting
- **Mobile**: Capacitor 7 for iOS/Android with camera and haptics support
- **Maps**: Google Maps API integration
- **Deployment**: Multi-stage Docker build (Node.js builder + nginx runtime)

## Project Structure

```
src/
├── components/           # Feature components (not shadcn/ui)
│   ├── ui/              # shadcn/ui components (auto-generated, don't edit)
│   ├── ProtectedRoute.tsx
│   ├── BottomNavigation.tsx
│   ├── GoogleMapComponent.tsx
│   └── [other components]
├── pages/               # Route-level page components (lazy-loaded)
│   ├── Home.tsx
│   ├── Map.tsx
│   ├── Auth.tsx
│   ├── Profile.tsx
│   ├── ReportIncident.tsx
│   ├── Tips.tsx
│   └── Calendar.tsx
├── hooks/               # Custom React hooks
│   ├── useLocationPermission.tsx
│   ├── useSecurityValidation.tsx
│   ├── usePreloadRoute.tsx
│   ├── useEmergencyContacts.tsx
│   └── [other hooks]
├── services/            # Business logic and external APIs
│   └── incidentPhotoService.ts
├── integrations/        # Third-party integrations
│   └── supabase/        # Supabase client and auto-generated types
├── lib/                 # Utilities and constants
│   └── utils.ts
├── utils/               # Helper functions
├── data/                # Static data files
├── assets/              # Images and static assets
├── App.tsx              # Main router configuration
├── main.tsx             # React entry point
├── index.css            # Base Tailwind and design tokens
└── vite-env.d.ts        # Vite environment types
```

## Common Development Commands

```bash
# Start development server (port 8080 as configured in vite.config.ts)
npm run dev

# Build for production
npm run build

# Build in development mode (with source maps)
npm run build:dev

# Preview production build locally
npm run preview

# Lint code with ESLint
npm run lint

# Install dependencies
npm install
```

## Development Workflow

### Running Locally

1. **Setup environment variables:**
   ```bash
   # Create .env file with required variables
   VITE_SUPABASE_URL=https://cgccjvoedbbsjqzchtmo.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
   ```

2. **Install and start:**
   ```bash
   npm install
   npm run dev
   ```
   Access at `http://localhost:8080`

3. **In development, Supabase client is exposed on `window.supabase` for debugging** (see `/integrations/supabase/client.ts`)

### Key Development Patterns

**Lazy-Loaded Pages:**
All pages are lazy-loaded in `App.tsx` using `React.lazy()` for better initial load performance:
```tsx
const Home = lazy(() => import("./pages/Home"));
// Pages are wrapped in <Suspense> via <RouteTransition>
```

**Protected Routes:**
Use `<ProtectedRoute>` wrapper to require authentication:
```tsx
<Route
  path="/"
  element={
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  }
/>
```

**React Query Configuration:**
Configured in `App.tsx` with sensible defaults:
- 5-minute cache time (`staleTime`)
- 10-minute garbage collection time (`gcTime`)
- 2 retries on failed requests
- Refetch on reconnect (but not on window focus for better UX)

**Component Organization:**
- `src/components/` - Feature components (reusable UI elements)
- `src/components/ui/` - shadcn/ui generated components (don't edit these directly)
- To add new UI components: use `npx shadcn-ui@latest add [component-name]`

## Design System & Styling

### Color Tokens (HSL)
All colors use HSL format for consistency and theming. Defined in `src/index.css`:

**Light Mode:**
- Primary: Blue (`214 84% 42%`) - trustworthy, safety-focused
- Accent: Orange (`25 95% 53%`) - emergency actions
- Success: Green (`142 71% 45%`) - positive states
- Destructive: Red (`0 84% 58%`) - alerts and errors

**Dark Mode:**
Automatically inverted for better contrast (see `.dark` selector in `index.css`)

### Tailwind Configuration
- **Custom spacing**: `--spacing-xs` through `--spacing-2xl` and `--mobile-padding`
- **Custom gradients**: `gradient-primary`, `gradient-accent`, `gradient-emergency`
- **Custom shadows**: `shadow-soft`, `shadow-primary`, `shadow-emergency`
- **Animations**: `fade-in`, `slide-up`, `scale-in` (duration: 200-300ms)
- **Border radius**: Configured via `--radius` CSS variable

### Theme Switching
Uses `next-themes` library (configured in `App.tsx`):
```tsx
<ThemeProvider
  attribute="class"      // Uses HTML class attribute
  defaultTheme="system"  // Respects system preference
  enableSystem
  disableTransitionOnChange
/>
```

## Authentication & Security

### Supabase Integration
- **Client**: `src/integrations/supabase/client.ts` (auto-generated)
- **Types**: `src/integrations/supabase/types.ts` (auto-generated from Supabase schema)
- **Session Management**: Persistent sessions via localStorage, auto-refresh tokens

### Security Features
- **Input Sanitization**: `Auth.tsx` implements basic HTML sanitization
- **Two-Factor Authentication**: Optional 2FA setup in auth flow
- **Protected Routes**: Components requiring auth wrapped with `<ProtectedRoute>`
- **Security Audit Logging**: `useSecurityValidation.tsx` hook validates sensitive operations

### Authentication Flow
1. User enters email/password on `/auth`
2. Supabase returns session
3. If 2FA enabled, redirect to 2FA input
4. On successful auth, redirect to home
5. `ProtectedRoute` ensures only authenticated users access protected pages

## Photo Uploads & Media Handling

### Incident Photo Service
`src/services/incidentPhotoService.ts` handles photo uploads:
- **Storage**: Supabase Storage bucket named `incident-photos`
- **Size Limit**: 5MB per photo
- **Path Format**: `{userId}/{incidentId}/{timestamp}.jpg`
- **Methods**:
  - `uploadPhoto()` - Upload single photo, returns signed URL
  - `uploadPhotos()` - Batch upload with error handling
  - `deletePhoto()` / `deletePhotos()` - Remove photos from storage
  - `getSignedUrl()` - Generate time-limited access URLs (3600s default)

**Usage in components:**
```tsx
import { IncidentPhotoService } from '@/services/incidentPhotoService';

const result = await IncidentPhotoService.uploadPhoto(photo, incidentId);
if (result.success) {
  // Use result.url for display
}
```

## Mobile Development with Capacitor

Capacitor plugins configured in `package.json`:
- `@capacitor/camera` - Photo capture
- `@capacitor/haptics` - Device vibration
- `@capacitor/core` - Base Capacitor functionality
- `@capacitor/ios` & `@capacitor/android` - Platform support

For mobile-specific code, use `use-mobile` hook:
```tsx
import { useIsMobile } from '@/hooks/use-mobile';
const isMobile = useIsMobile();
```

## Maps Integration

### Google Maps Component
`src/components/GoogleMapComponent.tsx`:
- Requires `VITE_GOOGLE_MAPS_API_KEY` environment variable
- Displays campus map with incident markers and safe zones
- Interactive features: zoom, pan, marker click handling

### HowardMap Component
`src/components/HowardMap.tsx`:
- Custom map UI wrapper with navigation controls
- Integrates with GoogleMapComponent for actual map rendering

## State Management

### Authentication State
- Managed via Supabase auth session
- Retrieved in `App.tsx` and propagated through `ProtectedRoute`
- Auth state changes trigger navigation updates

### Server State (React Query)
- API calls wrapped in React Query for caching and synchronization
- Default stale time: 5 minutes
- Automatic refetching on reconnect

### UI State
- Local component state via `useState`
- Can use Zustand or Context for complex UI state if needed

## Code Quality & Linting

### ESLint Configuration
File: `eslint.config.js`
- Base: TypeScript ESLint recommended rules
- Plugins:
  - `react-hooks` - Enforces Hook rules of hooks
  - `react-refresh` - Ensures Fast Refresh compatibility
- Rules disabled: `@typescript-eslint/no-unused-vars` (too strict during development)

**Run linting:**
```bash
npm run lint
```

### TypeScript
- **Strict Mode**: Not fully enabled (see `tsconfig.json`)
- **Base URL**: Configured to use `@/*` alias for src imports
- **Skip Lib Check**: Enabled for faster compilation
- **Null Checks**: Disabled for development flexibility

## Docker & Deployment

### Build Process
1. **Builder stage**: Node.js 20 Alpine - installs deps and builds with Vite
2. **Runtime stage**: nginx:alpine - serves built SPA
3. **Output port**: 80 (mapped to 3050 in docker-compose)

### nginx Configuration
File: `nginx.conf`
- **Gzip compression** enabled for text/JS/CSS assets
- **SPA routing**: All requests route to `index.html` (React Router)
- **Caching**: Static assets cached for 1 year
- **Security headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Hidden file access**: Denied (`.` files)

### Building Docker Image
```bash
# From repository root
docker-compose build howard-safe
docker-compose up -d howard-safe
```

## Capacitor Mobile Builds

**iOS Build:**
```bash
# Install iOS platform
npx cap add ios

# Sync web assets and native code
npx cap sync

# Open Xcode
npx cap open ios
```

**Android Build:**
```bash
# Install Android platform
npx cap add android

# Sync web assets and native code
npx cap sync

# Open Android Studio
npx cap open android
```

## Troubleshooting

### Common Issues

**Port 8080 already in use:**
```bash
# Find and kill process using port
lsof -i :8080
kill -9 <PID>

# Or use different port
PORT=8081 npm run dev
```

**Supabase authentication errors:**
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure auth policies allow anonymous access
- Check browser console for detailed auth errors

**Maps not loading:**
- Verify `VITE_GOOGLE_MAPS_API_KEY` is set
- Check Google Cloud console for API key restrictions
- Ensure Maps JavaScript API is enabled in Google Cloud project

**Photo upload failures:**
- Check Supabase Storage bucket `incident-photos` exists
- Verify bucket policies allow authenticated uploads
- Check file size doesn't exceed 5MB
- Ensure user is authenticated

**Dark mode not working:**
- Verify `next-themes` provider wraps entire app in `App.tsx`
- Check browser DevTools for `data-theme` attribute on `<html>` element
- Clear localStorage and retry: `localStorage.removeItem('theme')`

**Build failures:**
- Clear `node_modules/` and `.npm` cache: `npm ci --prefer-offline`
- Verify TypeScript compilation: `npx tsc --noEmit`
- Check for ESLint errors: `npm run lint`

## Environment Variables

Required `.env` variables:

```
VITE_SUPABASE_URL=https://cgccjvoedbbsjqzchtmo.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
```

Note: All variables must be prefixed with `VITE_` to be accessible in client-side code.

## Performance Optimization

### Bundle Splitting (Vite)
Configured in `vite.config.ts`:
- **vendor chunk**: React, React DOM, React Router
- **ui chunk**: Radix UI components
- **utils chunk**: Framer Motion, Lucide React, utility libraries

### Code Splitting
- All pages are lazy-loaded with `React.lazy()`
- Components wrapped in `<Suspense>` via `<RouteTransition>`
- Result: Only necessary code loaded per route

### Caching Strategy
- Static assets: 1 year cache (immutable)
- Service worker: No cache (always fetch fresh)
- React Query data: 5-minute default stale time

## Key Files to Understand First

1. **`src/App.tsx`** - Router configuration, theme setup, query client
2. **`src/index.css`** - Design tokens, color system, custom CSS variables
3. **`vite.config.ts`** - Build configuration, bundle splitting
4. **`tailwind.config.ts`** - Tailwind extensions and custom utilities
5. **`src/pages/Auth.tsx`** - Authentication flow, 2FA implementation
6. **`src/integrations/supabase/client.ts`** - Supabase client initialization
7. **`nginx.conf`** - Production server configuration
