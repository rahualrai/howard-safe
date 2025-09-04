import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BottomNavigation } from "@/components/BottomNavigation";
import { AlertTriangle, MapPin, Send, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { CapturedPhoto } from "@/utils/camera";
import { HapticFeedback } from "@/utils/haptics";
import { ImpactStyle, NotificationType } from "@capacitor/haptics";
import { useToast } from "@/hooks/use-toast";

export default function ReportIncident() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
    if (!category || !description) {
      toast({
        title: "Missing information",
        description: "Please fill in the incident category and description.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    await HapticFeedback.impact(ImpactStyle.Medium);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await HapticFeedback.notification(NotificationType.Success);
      toast({
        title: "Report submitted",
        description: "Your incident report has been sent to campus security.",
      });

      setCategory("");
      setLocation("");
      setDescription("");
      setAnonymous(false);
      setUseCurrentLocation(false);
      setPhotos([]);
    } catch (error) {
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
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={useCurrentLocation}
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
                  placeholder="Please provide as much detail as possible about what happened..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
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
                  disabled={isSubmitting}
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

              <p className="text-xs text-muted-foreground text-center">
                For immediate emergencies, call Campus Security at (202) 806-1100 or dial 911
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
}