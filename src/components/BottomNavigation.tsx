import { NavLink, useLocation } from "react-router-dom";
import { MapIcon, Shield, AlertTriangle, Bell, Home } from "lucide-react";
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
      className="fixed bottom-6 left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-md bg-white/90 border border-white/20 shadow-primary z-[1000] backdrop-blur-xl rounded-full p-2"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
    >
      <div className="flex justify-between items-center px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;

          return (
            <NavLink
              key={path}
              to={path}
              onMouseEnter={() => preloadRoute(path)}
              onFocus={() => preloadRoute(path)}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 relative group",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="navBubble"
                  className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative z-10 flex flex-col items-center justify-center"
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
}