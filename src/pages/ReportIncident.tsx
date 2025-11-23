import { HOWARD_BUILDINGS } from "@/data/howardBuildingsComplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, MapPin, Send, Camera, Shield, Loader, Check, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { CapturedPhoto } from "@/utils/camera";
import { HapticFeedback } from "@/utils/haptics";
import { ImpactStyle, NotificationType } from "@capacitor/haptics";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";
import { sanitizeInput, validateTextField, rateLimiter, getClientInfo, generateSecureId } from "@/utils/security";
import { supabase } from "@/integrations/supabase/client";
import { IncidentPhotoService } from "@/services/incidentPhotoService";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function ReportIncident() {
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [incidentTime, setIncidentTime] = useState<string>(() => {
    const now = new Date();
    // Convert to New York time
    const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = nyTime.getFullYear();
    const month = String(nyTime.getMonth() + 1).padStart(2, '0');
    const day = String(nyTime.getDate()).padStart(2, '0');
    const hours = String(nyTime.getHours()).padStart(2, '0');
    const minutes = String(nyTime.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
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

  const captureCurrentLocation = async () => {
    setIsGettingLocation(true);
    await HapticFeedback.impact(ImpactStyle.Light);

    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive"
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ latitude, longitude });
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        toast({
          title: "Location captured",
          description: "Your location has been added to the report"
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Unable to get location",
          description: error.message || "Please check your location permissions",
          variant: "destructive"
        });
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLocationToggle = async () => {
    await HapticFeedback.impact(ImpactStyle.Light);
    setUseCurrentLocation(!useCurrentLocation);
    if (!useCurrentLocation) {
      await captureCurrentLocation();
    } else {
      setLocation("");
      setCoordinates(null);
    }
  };

  const handleSubmit = async () => {
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
        categoryCustom: category === 'other' ? sanitizeInput(customCategory, { maxLength: 100 }) : null,
        location: sanitizeInput(location, { maxLength: 200 }),
        description: sanitizeInput(description, { maxLength: 2000, allowLineBreaks: true }),
        anonymous,
        photoCount: photos.length,
        timestamp: new Date().toISOString(),
        userId: user?.id || null,
        ...clientInfo
      };

      // Log the incident report submission for security monitoring
      await logSecurityEvent('incident_report_submitted', sanitizedData);

      // Create incident report in database
      const categoryMap: Record<string, string> = {
        suspicious: 'suspicious_activity',
        safety_hazard: 'safety_hazard',
        medical: 'medical_emergency',
        theft: 'theft',
        harassment: 'harassment',
        other: 'other'
      };

      const { data: incidentData, error: incidentError } = await supabase
        .from('incident_reports')
        .insert({
          user_id: anonymous ? null : user?.id,
          category: categoryMap[category] || category,
          category_custom: category === 'other' ? sanitizedData.categoryCustom : null,
          location_text: sanitizedData.location || null,
          latitude: coordinates?.latitude || null,
          longitude: coordinates?.longitude || null,
          description: sanitizedData.description,
          incident_time: incidentTime ? new Date(incidentTime).toISOString() : null,
          is_anonymous: anonymous,
          client_info: clientInfo,
          status: 'pending'
        })
        .select()
        .single();

      if (incidentError) {
        throw new Error(`Failed to create incident report: ${incidentError.message}`);
      }

      // Upload photos if there are any
      if (photos.length > 0 && incidentData) {
        console.log(`📸 Attempting to upload ${photos.length} photos for incident ${incidentData.id}`);
        const filesToUpload: File[] = [];

        // Convert captured photos to File objects
        for (const photo of photos) {
          if (photo.dataUrl) {
            console.log('Converting dataUrl photo to File...', photo.filename);
            // Convert base64 data URL to File
            try {
              const byteString = atob(photo.dataUrl.split(',')[1]);
              const ab = new ArrayBuffer(byteString.length);
              const ua = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ua[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: 'image/jpeg' });
              const file = new File([blob], photo.filename || `incident_photo_${Date.now()}.jpg`, {
                type: 'image/jpeg'
              });
              filesToUpload.push(file);
              console.log('DataUrl converted to File:', file.name, file.size);
            } catch (error) {
              console.error('Error converting dataUrl to File:', error);
            }
          }
        }

        // Upload photos
        if (filesToUpload.length > 0) {
          console.log(`Uploading ${filesToUpload.length} files to storage...`);
          const uploadResult = await IncidentPhotoService.uploadPhotos(
            filesToUpload,
            incidentData.id,
            anonymous ? undefined : user?.id
          );

          console.log('Upload result:', uploadResult);

          if (!uploadResult.success && uploadResult.failedPhotos > 0) {
            console.warn(`❌ Failed to upload ${uploadResult.failedPhotos} photos`, uploadResult.error);
            toast({
              title: "⚠️ Photo upload warning",
              description: `${uploadResult.failedPhotos} photos failed to upload, but incident was recorded`,
              variant: "destructive"
            });
          } else if (uploadResult.success) {
            console.log(`✅ Successfully uploaded ${uploadResult.urls.length} photos`);
          }

          // Link photos to incident in database
          if (uploadResult.urls.length > 0) {
            console.log('Linking photos to incident in database...');
            const photoRecords = uploadResult.urls.map((url) => {
              // Extract path from signed URL
              const pathMatch = url.match(/object\/public\/incident-photos\/([^?]+)/);
              const path = pathMatch ? pathMatch[1] : null;
              return {
                incident_id: incidentData.id,
                storage_path: path || url,
                file_size: filesToUpload[0]?.size || 0
              };
            });

            const { error: photoError } = await supabase
              .from('incident_photos')
              .insert(photoRecords);

            if (photoError) {
              console.warn('❌ Failed to link photos to incident:', photoError);
            } else {
              console.log('✅ Photos linked to incident successfully');
            }
          }
        } else {
          console.warn('No files to upload after conversion');
        }
      } else {
        console.log(`No photos to upload (photos.length=${photos.length})`);
      }

      await HapticFeedback.notification(NotificationType.Success);
      toast({
        title: "Report submitted successfully",
        description: `Report ID: ${incidentData.id.substring(0, 8).toUpperCase()}. Your incident report has been sent to campus security.`,
      });

      // Clear form
      setCategory("");
      setLocation("");
      setDescription("");
      setAnonymous(false);
      setUseCurrentLocation(false);
      setCoordinates(null);
      setPhotos([]);
      setValidationErrors({});
      setIncidentTime(new Date().toISOString().slice(0, 16));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed submission with enhanced error details
      await logSecurityEvent('incident_report_failed', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
        userId: user?.id || null,
        ...getClientInfo()
      });

      toast({
        title: "Submission failed",
        description: errorMessage || "Please try again or contact security directly if the problem persists.",
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
          <p className="text-sm text-muted-foreground text-center">Estimated response time: &lt; 5 mins</p>
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
              {/* Emergency Disclaimer - Moved to Top */}
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <Phone className="h-4 w-4" />
                <AlertTitle>Emergency</AlertTitle>
                <AlertDescription className="text-xs font-medium">
                  For immediate emergencies, call Campus Security at (202) 806-1100 or dial 911.
                </AlertDescription>
              </Alert>

              {/* Anonymous Checkbox - Moved to Top */}
              <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                <Checkbox
                  id="anonymous"
                  checked={anonymous}
                  onCheckedChange={(checked) => {
                    if (typeof checked === 'boolean') {
                      setAnonymous(checked);
                    }
                  }}
                />
                <Label htmlFor="anonymous" className="text-sm font-medium cursor-pointer flex-1">
                  Report Anonymously
                  <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                    Your identity will be hidden from the report
                  </span>
                </Label>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Category of Incident *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'suspicious', label: 'Suspicious Activity' },
                    { id: 'safety_hazard', label: 'Safety Hazard' },
                    { id: 'medical', label: 'Medical Emergency' },
                    { id: 'theft', label: 'Theft/Property' },
                    { id: 'harassment', label: 'Harassment' },
                    { id: 'other', label: 'Other' }
                  ].map((type) => (
                    <Button
                      key={type.id}
                      type="button"
                      variant={category === type.id ? "default" : "outline"}
                      className={`justify-start h-auto py-3 px-3 text-left text-sm whitespace-normal ${category === type.id ? 'border-primary ring-1 ring-primary' : ''}`}
                      onClick={() => {
                        setCategory(type.id);
                        if (type.id !== "other") {
                          setCustomCategory("");
                        }
                      }}
                    >
                      {category === type.id && <Check size={14} className="mr-2 shrink-0" />}
                      {type.label}
                    </Button>
                  ))}
                </div>
                {validationErrors.category && (
                  <p className="text-sm text-destructive font-medium">{validationErrors.category}</p>
                )}
              </div>

              {category === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-category">Describe the incident type *</Label>
                  <Input
                    id="custom-category"
                    placeholder="e.g., Noise complaint, Vandalism, etc."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {customCategory.length}/100 characters
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="location">Location of Incident</Label>
                <div className="space-y-2">
                  <Select
                    value={location}
                    onValueChange={(val) => {
                      if (val === "current_location") {
                        captureCurrentLocation();
                      } else {
                        setLocation(val);
                        setUseCurrentLocation(false);
                        setCoordinates(null);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a building or location" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="current_location" className="text-primary font-medium">
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-2" />
                          Use Current Location
                        </div>
                      </SelectItem>
                      {HOWARD_BUILDINGS.map((building) => (
                        <SelectItem key={building.id} value={building.name}>
                          {building.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other / Not Listed</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Show text input if "Other" is selected or if we have a custom location that isn't in the list (legacy support) */}
                  {(location === "other" || (location && location !== "current_location" && !HOWARD_BUILDINGS.find(b => b.name === location))) && (
                    <Input
                      placeholder="Enter specific location details..."
                      value={location === "other" ? "" : location}
                      onChange={(e) => setLocation(e.target.value)}
                      maxLength={200}
                      className="mt-2"
                    />
                  )}

                  {validationErrors.location && (
                    <p className="text-sm text-destructive">{validationErrors.location}</p>
                  )}

                  {isGettingLocation && (
                    <div className="flex items-center text-xs text-muted-foreground animate-pulse">
                      <Loader size={12} className="mr-2 animate-spin" />
                      Getting precise location...
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incident-time">When did this happen?</Label>
                <Input
                  id="incident-time"
                  type="datetime-local"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional - leave blank for current time
                </p>
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
                <div className="flex justify-between text-xs">
                  <span>{validationErrors.description && <span className="text-destructive font-medium">{validationErrors.description}</span>}</span>
                  <span className={`${description.length > 1800 ? 'text-destructive font-bold' : description.length > 1500 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
                    {description.length}/2000 characters
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera size={16} />
                  Attach Photos/Videos
                </Label>
                <CameraCapture onPhotosChange={setPhotos} maxPhotos={3} />
              </div>

              {/* Anonymous Checkbox moved to top */}

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

              {/* Emergency disclaimer moved to top */}
            </CardContent>
          </Card>
        </motion.div>
      </main>

    </div>
  );
}