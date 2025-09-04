import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { PageSkeleton } from "./PageSkeleton";

interface RouteTransitionProps {
  children: ReactNode;
}

const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02,
  },
};

const pageTransition = {
  ease: [0.4, 0, 0.2, 1] as const, // Custom easing for smooth feel
  duration: 0.3,
};

// Determine skeleton type based on route
function getSkeletonType(pathname: string) {
  if (pathname === '/') return 'home';
  if (pathname === '/map') return 'map';
  if (pathname === '/report') return 'form';
  return 'list';
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageTransitionVariants}
        transition={pageTransition}
        className="w-full"
        style={{ 
          // Ensure the transition doesn't affect the bottom navigation
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Suspense fallback={<PageSkeleton type={getSkeletonType(location.pathname)} />}>
          {children}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}