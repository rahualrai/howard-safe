# Howard Safe

A comprehensive campus safety application designed to enhance security and communication within the Howard University community.

## Features

- **Incident Reporting**: Secure incident reporting with photo uploads
- **Interactive Campus Maps**: Real-time maps with safe zones and incident locations
- **User Authentication**: Secure login and profile management
- **Student Hub**: Digital ID, dining services, events, and quick links
- **Safety Resources**: Emergency contacts and campus security information
- **Mobile Responsive**: Optimized for desktop and mobile

## Quick Start

```bash
cd apps/howard-safe
npm install
npm run dev
```

Application runs at `http://localhost:5173`

## Environment Variables

Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Development Scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

React 18 + TypeScript, Vite, shadcn/ui, Tailwind CSS, Supabase, Google Maps API, Capacitor
