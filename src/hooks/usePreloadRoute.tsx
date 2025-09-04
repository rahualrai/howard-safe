import { useEffect } from 'react';

// Preload strategies based on user behavior patterns
const PRELOAD_ROUTES = {
  '/': ['/map', '/safety-tips'], // From home, users often go to map or safety tips
  '/map': ['/report', '/safety-tips'], // From map, users often report incidents or check safety tips  
  '/safety-tips': ['/resources', '/map'], // From safety tips, users check resources or map
  '/report': ['/notifications', '/'], // After reporting, users check notifications or go home
  '/resources': ['/safety-tips', '/'], // From resources, users go to safety tips or home
  '/notifications': ['/map', '/'], // From notifications, users check map or go home
} as const;

// Dynamic imports for all routes
const routeImports = {
  '/': () => import('../pages/Home'),
  '/map': () => import('../pages/Map'),
  '/safety-tips': () => import('../pages/SafetyTips'),
  '/report': () => import('../pages/ReportIncident'),
  '/resources': () => import('../pages/Resources'),
  '/notifications': () => import('../pages/Notifications'),
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