import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, AlertCircle, ChevronRight, Clock, Shield, MapIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { HomeLoadingScreen } from "@/components/LoadingStates";
import { PullToRefresh } from "@/components/PullToRefresh";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { HapticFeedback } from "@/utils/haptics";
import { ImpactStyle, NotificationType } from "@capacitor/haptics";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  
  const emergencyAlerts = [
    {
      id: 1,
      type: "Weather Alert",
      message: "Severe thunderstorm warning in effect until 8:00 PM",
      time: "2 hours ago",
      priority: "medium"
    },
    {
      id: 2,
      type: "Safety Notice",
      message: "Construction on Georgia Ave - use alternate routes",
      time: "4 hours ago",
      priority: "low"
    }
  ];

  const refreshAlerts = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Alerts updated",
      description: "Latest campus alerts have been loaded."
    });
  };

  const { isRefreshing, pullDistance, pullToRefreshProps, isTriggered } = usePullToRefresh({
    onRefresh: refreshAlerts,
    threshold: 80
  });

  const handleQuickHelp = async () => {
    await HapticFeedback.impact(ImpactStyle.Heavy);
    await HapticFeedback.notification(NotificationType.Warning);
    
    // Simulate emergency action
    toast({
      title: "Emergency Alert Sent",
      description: "Campus security has been notified of your location.",
      variant: "destructive"
    });
  };


  return (
    <div className="min-h-screen bg-background" {...pullToRefreshProps}>
      <PullToRefresh
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        isTriggered={isTriggered}
        onRefresh={refreshAlerts}
      >
        {/* Header */}
        <motion.header 
          className="bg-gradient-to-r from-card via-card to-card/95 shadow-primary/5 shadow-lg border-b border-border/30 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-mobile-padding py-6">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent text-center">Better Safe</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">Howard University Campus Safety</p>
            {loading ? null : (
              <div className="text-center mt-3">
                {user ? (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Welcome back!
                  </Badge>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                      Sign In / Sign Up
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="px-mobile-padding pt-6 pb-24">
          {/* Quick Help Button */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Button 
              size="lg"
              onClick={handleQuickHelp}
              className="w-full h-20 bg-gradient-emergency text-white text-xl font-semibold shadow-emergency hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 border-0"
            >
              <Phone className="mr-3" size={28} />
              Quick Help
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Emergency? Tap for immediate assistance
            </p>
          </motion.div>

          {/* Emergency Alerts Section */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Campus Alerts</h2>
              <Badge variant="secondary" className="text-xs">
                {emergencyAlerts.length} Active
              </Badge>
            </div>

            <div className="space-y-3">
              {emergencyAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="shadow-primary/10 shadow-lg border-border/50 hover:shadow-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer backdrop-blur-sm bg-card/80">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle 
                              size={16} 
                              className={
                                alert.priority === "high" 
                                  ? "text-destructive"
                                  : alert.priority === "medium"
                                  ? "text-accent"
                                  : "text-muted-foreground"
                              }
                            />
                            <span className="text-sm font-medium text-foreground">
                              {alert.type}
                            </span>
                            <div className="flex items-center text-xs text-muted-foreground ml-auto">
                              <Clock size={12} className="mr-1" />
                              {alert.time}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {alert.message}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground ml-2 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Link to="/tips">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="shadow-primary/10 shadow-lg border-border/50 hover:shadow-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer backdrop-blur-sm bg-card/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-center">Safety Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Shield className="text-primary" size={24} />
                      </div>
                      <p className="text-xs text-muted-foreground">Stay informed</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            <Link to="/map">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="shadow-primary/10 shadow-lg border-border/50 hover:shadow-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer backdrop-blur-sm bg-card/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-center">Campus Map</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MapIcon className="text-success" size={24} />
                      </div>
                      <p className="text-xs text-muted-foreground">Find safe routes</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          </motion.div>
        </main>

      </PullToRefresh>
    </div>
  );
}