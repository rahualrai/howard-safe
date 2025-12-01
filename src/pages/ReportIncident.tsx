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
          if (uploadResult.paths.length > 0) {
            console.log('Linking photos to incident in database...');
            const photoRecords = uploadResult.paths.map((path, index) => {
              console.log(`Photo ${index + 1} path:`, path);
              return {
                incident_id: incidentData.id,
                storage_path: path,
                file_size: filesToUpload[index]?.size || 0
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
    <div className="min-h-screen bg-mint-50 pb-32">
      {/* Curved Header Section */}
      <div className="relative bg-mint-500 pt-12 pb-16 rounded-b-[40px] shadow-lg mb-10 overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-mint-400/30 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 rounded-full bg-mint-300/20 blur-2xl" />

        <div className="px-6 relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <AlertTriangle className="text-white h-6 w-6" />
            </div>
            <h1 className="text-3xl font-friendly font-bold text-white tracking-tight">
              Report Incident
            </h1>
          </div>
          <p className="text-mint-100 font-medium text-lg">Estimated response time: &lt; 5 mins</p>
        </div>
      </div>

      <main className="px-6 -mt-8 relative z-10 w-full max-w-md md:max-w-5xl lg:max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-none shadow-soft rounded-[24px] overflow-hidden bg-white">
            <CardHeader className="bg-white border-b border-gray-50 pb-4">
              <CardTitle className="text-xl font-bold text-ui-charcoal">Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-5">
              {/* Emergency Disclaimer */}
              <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-800 rounded-2xl shadow-sm">
                <div className="bg-red-100 p-1 rounded-full mr-2">
                  <Phone className="h-4 w-4 text-red-600" />
                </div>
                <AlertTitle className="text-red-900 font-bold">Emergency</AlertTitle>
                <AlertDescription className="text-xs font-medium text-red-800/90 mt-1">
                  For immediate emergencies, call Campus Security at (202) 806-1100 or dial 911.
                </AlertDescription>
              </Alert>

              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div className="space-y-6">
                  {/* Anonymous Checkbox */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-colors hover:bg-gray-100">
                    <Checkbox
                      id="anonymous"
                      checked={anonymous}
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          setAnonymous(checked);
                        }
                      }}
                      className="h-5 w-5 border-2 border-gray-300 data-[state=checked]:bg-mint-500 data-[state=checked]:border-mint-500 rounded-md"
                    />
                    <Label htmlFor="anonymous" className="text-sm font-bold cursor-pointer flex-1 text-ui-charcoal">
                      Report Anonymously
                      <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                        Your identity will be hidden from the report
                      </span>
                    </Label>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-bold text-ui-charcoal">Category of Incident *</Label>
                    <div className="grid grid-cols-2 gap-3">
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
                          className={`justify-start h-auto py-3 px-4 text-left text-sm whitespace-normal rounded-xl transition-all ${category === type.id
                            ? 'bg-mint-500 hover:bg-mint-600 text-white shadow-md border-transparent'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-mint-600'
                            }`}
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
                      <p className="text-sm text-red-500 font-medium px-1">{validationErrors.category}</p>
                    )}
                  </div>

                  {category === "other" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-category" className="font-bold text-ui-charcoal">Describe the incident type *</Label>
                      <Input
                        id="custom-category"
                        placeholder="e.g., Noise complaint, Vandalism, etc."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        maxLength={100}
                        className="rounded-xl bg-gray-50 border-transparent focus:bg-white transition-all"
                      />
                      <p className="text-xs text-muted-foreground px-1">
                        {customCategory.length}/100 characters
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6 mt-6 md:mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="font-bold text-ui-charcoal">Location of Incident</Label>
                    <div className="space-y-2">
                      <Select
                        value={location}
                        onValueChange={(val) => {
                          if (val === "current_location") {
                            captureCurrentLocation();
                          } else {
                            setLocation(val);
                            setUseCurrentLocation(false);

                            // Look up building coordinates when a building is selected
                            const selectedBuilding = HOWARD_BUILDINGS.find(b => b.name === val);
                            if (selectedBuilding) {
                              setCoordinates({
                                latitude: selectedBuilding.latitude,
                                longitude: selectedBuilding.longitude
                              });
                            } else {
                              setCoordinates(null); // For "Other" option
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full rounded-xl bg-gray-50 border-transparent focus:bg-white h-12">
                          <SelectValue placeholder="Select a building or location" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px] rounded-xl shadow-lg border-gray-100">
                          <SelectItem value="current_location" className="text-mint-600 font-bold focus:bg-mint-50 focus:text-mint-700">
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-2" />
                              Use Current Location
                            </div>
                          </SelectItem>
                          {HOWARD_BUILDINGS.map((building) => (
                            <SelectItem key={building.id} value={building.name} className="focus:bg-gray-50">
                              {building.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="other" className="focus:bg-gray-50">Other / Not Listed</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Show text input if "Other" is selected or if we have a custom location that isn't in the list (legacy support) */}
                      {(location === "other" || (location && location !== "current_location" && !HOWARD_BUILDINGS.find(b => b.name === location))) && (
                        <Input
                          placeholder="Enter specific location details..."
                          value={location === "other" ? "" : location}
                          onChange={(e) => setLocation(e.target.value)}
                          maxLength={200}
                          className="mt-2 rounded-xl bg-gray-50 border-transparent focus:bg-white"
                        />
                      )}

                      {validationErrors.location && (
                        <p className="text-sm text-red-500 font-medium px-1">{validationErrors.location}</p>
                      )}

                      {isGettingLocation && (
                        <div className="flex items-center text-xs text-mint-600 font-medium animate-pulse px-1">
                          <Loader size={12} className="mr-2 animate-spin" />
                          Getting precise location...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incident-time" className="font-bold text-ui-charcoal">When did this happen?</Label>
                    <div className="flex gap-2">
                      <Input
                        id="incident-time"
                        type="datetime-local"
                        value={incidentTime}
                        onChange={(e) => setIncidentTime(e.target.value)}
                        className="rounded-xl bg-gray-50 border-transparent focus:bg-white h-12 text-black placeholder:text-gray-500 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const now = new Date();
                          const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
                          const year = nyTime.getFullYear();
                          const month = String(nyTime.getMonth() + 1).padStart(2, '0');
                          const day = String(nyTime.getDate()).padStart(2, '0');
                          const hours = String(nyTime.getHours()).padStart(2, '0');
                          const minutes = String(nyTime.getMinutes()).padStart(2, '0');
                          setIncidentTime(`${year}-${month}-${day}T${hours}:${minutes}`);
                        }}
                        className="h-12 px-4 rounded-xl border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-medium"
                      >
                        Now
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground px-1">
                      Defaults to current time. Tap to change.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-bold text-ui-charcoal">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide as much detail as possible about what happened... (10-2000 characters)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      className="rounded-xl bg-gray-50 border-transparent focus:bg-white resize-none p-4 text-black placeholder:text-gray-500"
                    />
                    <div className="flex justify-between text-xs px-1">
                      <span>{validationErrors.description && <span className="text-red-500 font-medium">{validationErrors.description}</span>}</span>
                      <span className={`${description.length > 1800 ? 'text-red-500 font-bold' : description.length > 1500 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
                        {description.length}/2000 characters
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-bold text-ui-charcoal">
                      <Camera size={16} className="text-mint-600" />
                      Attach Photos/Videos
                    </Label>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                      <CameraCapture onPhotosChange={setPhotos} maxPhotos={3} />
                    </div>
                  </div>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !category || !description || description.length < 10}
                  className="w-full h-14 bg-mint-500 hover:bg-mint-600 text-white text-lg font-bold shadow-lg shadow-mint-200 rounded-full transition-all"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <Alert className="bg-blue-50 border-blue-100 text-blue-800 rounded-2xl">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs ml-2">
                  All incident reports are logged for security purposes.
                  {user ? " Your identity is associated with this report." : " Anonymous reports are permitted but may limit follow-up."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}