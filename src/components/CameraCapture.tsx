import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CameraService, CapturedPhoto } from '@/utils/camera';
import { HapticFeedback } from '@/utils/haptics';
import { ImpactStyle, NotificationType } from '@capacitor/haptics';

interface CameraCaptureProps {
  onPhotosChange: (photos: CapturedPhoto[]) => void;
  maxPhotos?: number;
}

export function CameraCapture({ onPhotosChange, maxPhotos = 3 }: CameraCaptureProps) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const { toast } = useToast();

  const handleTakePhoto = async () => {
    if (photos.length >= maxPhotos) {
      toast({
        title: "Photo limit reached",
        description: `You can only attach up to ${maxPhotos} photos per report.`,
        variant: "destructive"
      });
      return;
    }

    await HapticFeedback.impact(ImpactStyle.Light);
    
    const hasPermissions = await CameraService.requestPermissions();
    if (!hasPermissions) {
      toast({
        title: "Camera permissions required",
        description: "Please allow camera access to take photos.",
        variant: "destructive"
      });
      return;
    }

    const photo = await CameraService.takePicture();
    if (photo) {
      const newPhotos = [...photos, photo];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
      await HapticFeedback.notification(NotificationType.Success);
      toast({
        title: "Photo captured",
        description: "Photo has been added to your report."
      });
    }
  };

  const handleSelectFromGallery = async () => {
    if (photos.length >= maxPhotos) {
      toast({
        title: "Photo limit reached",
        description: `You can only attach up to ${maxPhotos} photos per report.`,
        variant: "destructive"
      });
      return;
    }

    await HapticFeedback.impact(ImpactStyle.Light);
    
    const photo = await CameraService.selectFromGallery();
    if (photo) {
      const newPhotos = [...photos, photo];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
      await HapticFeedback.notification(NotificationType.Success);
      toast({
        title: "Photo selected",
        description: "Photo has been added to your report."
      });
    }
  };

  const removePhoto = async (index: number) => {
    await HapticFeedback.impact(ImpactStyle.Light);
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTakePhoto}
          className="flex-1"
          disabled={photos.length >= maxPhotos}
        >
          <Camera size={16} className="mr-2" />
          Take Photo
        </Button>
        
        <Button
          type="button"
          variant="outline" 
          size="sm"
          onClick={handleSelectFromGallery}
          className="flex-1"
          disabled={photos.length >= maxPhotos}
        >
          <Image size={16} className="mr-2" />
          From Gallery
        </Button>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="p-0">
                  <img
                    src={photo.dataUrl}
                    alt={`Incident photo ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full p-0"
                    onClick={() => removePhoto(index)}
                  >
                    <X size={12} />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {photos.length < maxPhotos && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card 
                className="border-dashed border-2 cursor-pointer hover:border-primary transition-colors"
                onClick={handleTakePhoto}
              >
                <CardContent className="p-0 h-24 flex items-center justify-center">
                  <Plus size={24} className="text-muted-foreground" />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground text-center">
        {photos.length}/{maxPhotos} photos attached
      </p>
    </div>
  );
}