import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield, Navigation, Info, Settings, X } from 'lucide-react';
import { useLocationPermission } from '@/hooks/useLocationPermission';

interface LocationPermissionPromptProps {
  onClose?: () => void;
  onPermissionGranted?: (position: GeolocationPosition) => void;
  showCloseButton?: boolean;
  variant?: 'card' | 'overlay';
}

export const LocationPermissionPrompt = ({
  onClose,
  onPermissionGranted,
  showCloseButton = false,
  variant = 'card'
}: LocationPermissionPromptProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const { permission, requestPermission, location } = useLocationPermission();

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const granted = await requestPermission();
    setIsRequesting(false);

    if (granted && location && onPermissionGranted) {
      onPermissionGranted(location);
    }
  };

  const features = [
    {
      icon: <Navigation className="w-4 h-4" />,
      title: "Real-time Navigation",
      description: "Get safe route directions to your destination"
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: "Emergency Response",
      description: "Faster emergency response with precise location"
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      title: "Nearby Safety Features",
      description: "Find blue light stations and safe areas around you"
    }
  ];

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-success text-success-foreground">Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      case 'prompt':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const content = (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border max-h-[85vh] overflow-y-auto">
      <CardHeader className="text-center space-y-2">
        {showCloseButton && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 w-8 h-8 p-0"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-xl">Enable Location Access</CardTitle>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {getPermissionBadge()}
          </div>
        </div>

        <CardDescription className="text-center">
          Your location helps us provide better safety features and emergency response.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {permission === 'denied' && (
          <Alert>
            <Settings className="w-4 h-4" />
            <AlertDescription>
              Location access is currently blocked. Please enable it in your browser settings:
              <br />
              <strong>Chrome:</strong> Click the location icon in the address bar
              <br />
              <strong>Safari:</strong> Go to Preferences → Privacy → Location Services
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            What you'll get with location access:
          </h4>

          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                {feature.icon}
              </div>
              <div>
                <p className="font-medium text-sm">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleRequestPermission}
            disabled={isRequesting || permission === 'denied'}
            className="w-full"
            size="lg"
          >
            {isRequesting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                Requesting Access...
              </div>
            ) : permission === 'granted' ? (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Location Access Enabled
              </div>
            ) : permission === 'denied' ? (
              'Open Browser Settings'
            ) : (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Allow Location Access
              </div>
            )}
          </Button>

          {showCloseButton && (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Maybe Later
            </Button>
          )}
        </div>

        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription className="text-xs">
            <strong>Privacy:</strong> Your location data is only used for safety features and is never shared with third parties.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {content}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return content;
};