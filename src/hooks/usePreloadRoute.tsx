import { useEffect } from 'react';

// Preload strategies based on user behavior patterns
const PRELOAD_ROUTES = {
  '/': ['/map', '/tips'], // From home, users often go to map or tips
  '/map': ['/report', '/tips'], // From map, users often report incidents or check tips  
  '/tips': ['/map', '/profile'], // From tips, users check map or profile
  '/report': ['/profile', '/'], // After reporting, users check profile or go home
  '/auth': ['/'], // After auth, users go home
  '/profile': ['/map', '/'], // From profile, users check map or go home
} as const;

// Dynamic imports for all routes
const routeImports = {
  '/': () => import('../pages/Home'),
  '/map': () => import('../pages/Map'),
  '/tips': () => import('../pages/Tips'),
  '/report': () => import('../pages/ReportIncident'),
  '/auth': () => import('../pages/Auth'),
  '/profile': () => import('../pages/Profile'),
};

export function usePreloadRoute(currentPath: string) {
  useEffect(() => {
    // Preload likely next routes based on current route
    const routesToPreload = PRELOAD_ROUTES[currentPath as keyof typeof PRELOAD_ROUTES];
    
    if (routesToPreload) {
      // Use setTimeout to preload after current route is loaded
      const timeoutId = setTimeout(() => {
        routesToPreload.forEach(route => {
          const importFn = routeImports[route as keyof typeof routeImports];
          if (importFn) {
            // Preload the component
            importFn().catch(() => {
              // Silently fail if preload doesn't work
            });
          }
        });
      }, 500); // Delay to not interfere with current page load

      return () => clearTimeout(timeoutId);
    }
  }, [currentPath]);

  // Manual preload function for hover/focus events
  const preloadRoute = (route: string) => {
    const importFn = routeImports[route as keyof typeof routeImports];
    if (importFn) {
      importFn().catch(() => {
        // Silently fail
      });
    }
  };

  return { preloadRoute };
}