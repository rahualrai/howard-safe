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
      className="sticky bottom-0 left-0 right-0 z-[1000] bg-gradient-to-t from-background via-background/95 to-transparent pt-4 pb-6"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="max-w-md mx-auto w-full px-4">
        <div className="flex items-end justify-between gap-3 rounded-[32px] bg-card/95 border border-border/60 shadow-soft backdrop-blur-sm px-4 py-3">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;

            return (
              <NavLink
                key={path}
                to={path}
                onMouseEnter={() => preloadRoute(path)} // Preload on hover
                onFocus={() => preloadRoute(path)} // Preload on focus for keyboard users
                className="flex flex-col items-center gap-1 flex-1 text-[11px] font-medium"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-primary/40"
                      : "bg-muted text-foreground/70 dark:text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Icon size={isActive ? 24 : 22} />
                </motion.div>
                <span
                  className={cn(
                    "tracking-tight",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
