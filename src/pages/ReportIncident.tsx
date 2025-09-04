import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, MapPin, Send, Camera, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { CapturedPhoto } from "@/utils/camera";
import { HapticFeedback } from "@/utils/haptics";
import { ImpactStyle, NotificationType } from "@capacitor/haptics";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";

export default function ReportIncident() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Use security validation to ensure user is authenticated for reporting
  const { user, loading, isValidSession, logSecurityEvent } = useSecurityValidation({
    requireAuth: false, // Allow anonymous reports
    redirectTo: '/auth'
  });

  // Input sanitization function
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit input length
  };

  // Enhanced validation
  const validateInput = (value: string, minLength: number = 3, maxLength: number = 1000): boolean => {
    const cleaned = value.trim();
    return cleaned.length >= minLength && cleaned.length <= maxLength;
  };

  const handleLocationToggle = async () => {
    await HapticFeedback.impact(ImpactStyle.Light);
    setUseCurrentLocation(!useCurrentLocation);
    if (!useCurrentLocation) {
      setLocation("Using current location...");
    } else {
      setLocation("");
    }
  };

  const handleSubmit = async () => {
    // Enhanced validation
    if (!category || !validateInput(category, 1, 50)) {
      toast({
        title: "Invalid category",
        description: "Please select a valid incident category.",
        variant: "destructive"
      });
      return;
    }

    if (!description || !validateInput(description, 10, 2000)) {
      toast({
        title: "Invalid description",
        description: "Description must be between 10 and 2000 characters.",
        variant: "destructive"
      });
      return;
    }

    if (location && !validateInput(location, 2, 200)) {
      toast({
        title: "Invalid location",
        description: "Location must be between 2 and 200 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    await HapticFeedback.impact(ImpactStyle.Medium);

    try {
      // Sanitize all inputs
      const sanitizedData = {
        category: sanitizeInput(category),
        location: sanitizeInput(location),
        description: sanitizeInput(description),
        anonymous,
        useCurrentLocation,
        photoCount: photos.length,
        timestamp: new Date().toISOString(),
        userId: user?.id || null,
        userAgent: navigator.userAgent
      };

      // Log the incident report submission for security monitoring
      await logSecurityEvent('incident_report_submitted', sanitizedData);

      // Simulate report submission (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await HapticFeedback.notification(NotificationType.Success);
      toast({
        title: "Report submitted successfully",
        description: "Your incident report has been sent to campus security.",
      });

      // Clear form
      setCategory("");
      setLocation("");
      setDescription("");
      setAnonymous(false);
      setUseCurrentLocation(false);
      setPhotos([]);
    } catch (error) {
      // Log failed submission
      await logSecurityEvent('incident_report_failed', {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        userId: user?.id || null
      });

      toast({
        title: "Submission failed",
        description: "Please try again or contact security directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.header 
        className="bg-card shadow-soft border-b border-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-mobile-padding py-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <AlertTriangle className="text-destructive" size={24} />
            <h1 className="text-2xl font-bold text-primary">Report Incident</h1>
          </div>
          <p className="text-sm text-muted-foreground text-center">Help keep our campus safe</p>
        </div>
      </motion.header>

      <main className="px-mobile-padding pt-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="shadow-primary">
            <CardHeader>
              <CardTitle className="text-lg">Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category of Incident *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                    <SelectItem value="safety_hazard">Safety Hazard</SelectItem>
                    <SelectItem value="medical">Medical Emergency</SelectItem>
                    <SelectItem value="theft">Theft/Property Crime</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location of Incident</Label>
                <div className="space-y-2">
                  <Input
                    id="location"
                    placeholder="Enter location or building name"
                    value={location}
                    onChange={(e) => setLocation(sanitizeInput(e.target.value))}
                    disabled={useCurrentLocation}
                    maxLength={200}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="current-location"
                      checked={useCurrentLocation}
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          handleLocationToggle();
                        }
                      }}
                    />
                    <Label htmlFor="current-location" className="text-sm flex items-center gap-1">
                      <MapPin size={14} />
                      Use Current Location
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide as much detail as possible about what happened... (10-2000 characters)"
                    value={description}
                    onChange={(e) => setDescription(sanitizeInput(e.target.value))}
                    rows={4}
                    maxLength={2000}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {description.length}/2000 characters
                  </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera size={16} />
                  Attach Photos/Videos
                </Label>
                <CameraCapture onPhotosChange={setPhotos} maxPhotos={3} />
              </div>

              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="anonymous"
                  checked={anonymous}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setAnonymous(checked);
                    }
                  }}
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Report Anonymously
                  <p className="text-xs text-muted-foreground mt-1">
                    Your contact information will not be shared with anyone
                  </p>
                </Label>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !category || !description || description.length < 10}
                  className="w-full h-12 bg-gradient-primary text-white text-lg font-semibold shadow-primary"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    <>
                      <Send className="mr-2" size={20} />
                      Submit Report
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Security Notice */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  All incident reports are logged for security purposes. 
                  {user ? " Your identity is associated with this report." : " Anonymous reports are permitted but may limit follow-up."}
                </AlertDescription>
              </Alert>

              <p className="text-xs text-muted-foreground text-center">
                For immediate emergencies, call Campus Security at (202) 806-1100 or dial 911
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>

    </div>
  );
}