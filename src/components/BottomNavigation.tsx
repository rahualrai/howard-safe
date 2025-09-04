import { NavLink, useLocation } from "react-router-dom";
import { MapIcon, Shield, AlertTriangle, BookOpen, Bell, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreloadRoute } from "@/hooks/usePreloadRoute";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/map", icon: MapIcon, label: "Map" },
  { path: "/tips", icon: Shield, label: "Tips" },
  { path: "/report", icon: AlertTriangle, label: "Report" },
  { path: "/profile", icon: Bell, label: "Profile" },
];

export function BottomNavigation() {
  const location = useLocation();
  const { preloadRoute } = usePreloadRoute(location.pathname);

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 bg-card/95 border-t border-border/50 shadow-soft z-[1000] backdrop-blur-xl"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex justify-around items-center px-2 py-3 max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <NavLink
              key={path}
              to={path}
              onMouseEnter={() => preloadRoute(path)} // Preload on hover
              onFocus={() => preloadRoute(path)} // Preload on focus for keyboard users
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 min-w-0 flex-1 relative group",
                isActive
                  ? "text-primary bg-primary/15 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <Icon size={22} className="mb-1" />
                <span className="text-xs font-medium truncate">{label}</span>
              </motion.div>
              
              {/* Active indicator with animation */}
              {isActive && (
                <motion.div 
                  className="absolute -top-1 left-1/2 w-1 h-1 bg-primary rounded-full"
                  layoutId="activeIndicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{ x: "-50%" }}
                />
              )}
              
              {/* Hover effect */}
              <motion.div
                className="absolute inset-0 bg-primary/10 rounded-xl opacity-0 group-hover:opacity-100"
                transition={{ duration: 0.2 }}
              />
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
}