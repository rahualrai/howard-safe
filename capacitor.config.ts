import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.f8e4fb571b8042199e25312a2e427cea',
  appName: 'howard-safe-path',
  webDir: 'dist',
  server: {
    url: 'https://f8e4fb57-1b80-4219-9e25-312a2e427cea.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Haptics: {}
  }
};

export default config;