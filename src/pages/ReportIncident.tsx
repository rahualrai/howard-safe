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
import { sanitizeInput, validateTextField, rateLimiter, getClientInfo, generateSecureId } from "@/utils/security";

export default function ReportIncident() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Use security validation to ensure user is authenticated for reporting
  const { user, loading, isValidSession, logSecurityEvent } = useSecurityValidation({
    requireAuth: false, // Allow anonymous reports
    redirectTo: '/auth'
  });

  // Enhanced real-time validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!category) {
      errors.category = "Please select an incident category";
    }
    
    const descValidation = validateTextField(description, "Description", 10, 2000);
    if (!descValidation.isValid) {
      errors.description = descValidation.error || "Description is invalid";
    }
    
    if (location) {
      const locValidation = validateTextField(location, "Location", 2, 200);
      if (!locValidation.isValid) {
        errors.location = locValidation.error || "Location is invalid";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Real-time validation on input changes
  useEffect(() => {
    if (category || description || location) {
      validateForm();
    }
  }, [category, description, location]);

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
    // Rate limiting check
    const rateLimitKey = `incident_report_${user?.id || 'anonymous'}`;
    if (!rateLimiter.canAttempt(rateLimitKey, 3, 300000)) { // 3 attempts per 5 minutes
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime(rateLimitKey) / 60000);
      toast({
        title: "Too many submissions",
        description: `Please wait ${remainingTime} minutes before submitting another report.`,
        variant: "destructive"
      });
      return;
    }

    // Enhanced validation
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Check the form for validation errors before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    await HapticFeedback.impact(ImpactStyle.Medium);

    try {
      // Generate unique report ID for tracking
      const reportId = generateSecureId();
      const clientInfo = getClientInfo();
      
      // Sanitize all inputs with enhanced options
      const sanitizedData = {
        reportId,
        category: sanitizeInput(category, { maxLength: 50 }),
        location: sanitizeInput(location, { maxLength: 200 }),
        description: sanitizeInput(description, { maxLength: 2000, allowLineBreaks: true }),
        anonymous,
        useCurrentLocation,
        photoCount: photos.length,
        timestamp: new Date().toISOString(),
        userId: user?.id || null,
        ...clientInfo
      };

      // Log the incident report submission for security monitoring
      await logSecurityEvent('incident_report_submitted', sanitizedData);

      // Simulate report submission with enhanced error handling
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random failures for testing error handling
          if (Math.random() > 0.95) {
            reject(new Error('Network timeout'));
          } else {
            resolve(true);
          }
        }, 2000);
      });
      
      await HapticFeedback.notification(NotificationType.Success);
      toast({
        title: "Report submitted successfully",
        description: `Report ID: ${reportId.substring(0, 8).toUpperCase()}. Your incident report has been sent to campus security.`,
      });

      // Clear form
      setCategory("");
      setLocation("");
      setDescription("");
      setAnonymous(false);
      setUseCurrentLocation(false);
      setPhotos([]);
      setValidationErrors({});
    } catch (error) {
      // Log failed submission with enhanced error details
      await logSecurityEvent('incident_report_failed', {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        userId: user?.id || null,
        ...getClientInfo()
      });

      toast({
        title: "Submission failed",
        description: "Please try again or contact security directly if the problem persists.",
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
                {validationErrors.category && (
                  <p className="text-sm text-destructive">{validationErrors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location of Incident</Label>
                <div className="space-y-2">
                  <Input
                    id="location"
                    placeholder="Enter location or building name"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={useCurrentLocation}
                    maxLength={200}
                  />
                  {validationErrors.location && (
                    <p className="text-sm text-destructive">{validationErrors.location}</p>
                  )}
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
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    maxLength={2000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{validationErrors.description && <span className="text-destructive">{validationErrors.description}</span>}</span>
                    <span>{description.length}/2000 characters</span>
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