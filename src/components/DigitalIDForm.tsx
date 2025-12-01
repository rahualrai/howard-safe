import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Upload } from "lucide-react";

interface DigitalIDData {
  id?: string;
  full_name: string;
  student_id: string;
  program: string;
  class_year: string;
  photo_url?: string;
}

interface DigitalIDFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingData?: DigitalIDData | null;
  onSuccess: () => void;
}

export function DigitalIDForm({ open, onOpenChange, existingData, onSuccess }: DigitalIDFormProps) {
  const [formData, setFormData] = useState<DigitalIDData>({
    full_name: existingData?.full_name || "",
    student_id: existingData?.student_id || "",
    program: existingData?.program || "",
    class_year: existingData?.class_year || "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    existingData?.photo_url || null
  );
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateAndSetPhoto = (file: File) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image",
        variant: "destructive",
      });
      return;
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetPhoto(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetPhoto(file);
    }
  };

  const uploadPhoto = async (userId: string): Promise<string | null> => {
    if (!photoFile) {
      return existingData?.photo_url || null;
    }

    try {
      const fileExt = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/digital-id.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      return fileName;
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Photo upload failed",
        description: error instanceof Error ? error.message : "Your ID information was saved but photo upload failed",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.student_id || !formData.program || !formData.class_year) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check if photo is required and not provided
    if (!photoFile && !existingData?.photo_url) {
      toast({
        title: "Photo required",
        description: "Please upload your ID photo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Upload photo if provided
      const photoUrl = await uploadPhoto(user.id);

      // Upsert digital ID data
      const digitalIdData = {
        user_id: user.id,
        full_name: formData.full_name,
        student_id: formData.student_id,
        program: formData.program,
        class_year: formData.class_year,
        photo_url: photoUrl,
        status: 'active',
      };

      const { error } = await supabase
        .from('digital_ids')
        .upsert(digitalIdData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success!",
        description: existingData ? "Your digital ID has been updated" : "Your digital ID has been created",
      });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('digital-id-updated'));

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving digital ID:', error);
      toast({
        title: "Error",
        description: "Failed to save your digital ID. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{existingData ? "Edit" : "Add"} Digital ID</DialogTitle>
          <DialogDescription>
            Enter your student information to create or update your digital ID card
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Photo Upload with Drag & Drop */}
            <div className="space-y-2">
              <Label>ID Photo *</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${isDragging
                    ? 'border-primary bg-primary/10'
                    : photoPreview
                      ? 'border-border'
                      : 'border-destructive'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="ID preview"
                      className="w-24 h-24 rounded-md object-cover border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-md border-2 border-dashed flex items-center justify-center">
                      <Camera className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {photoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Required • Max 5MB (JPG, PNG)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isDragging ? '📂 Drop image here!' : '💡 Or drag and drop your photo here'}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Student ID */}
            <div className="space-y-2">
              <Label htmlFor="student_id">Student ID *</Label>
              <Input
                id="student_id"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                placeholder="e.g., @12345678"
                required
              />
            </div>

            {/* Program */}
            <div className="space-y-2">
              <Label htmlFor="program">Program/Major *</Label>
              <Input
                id="program"
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                placeholder="e.g., Computer Science"
                required
              />
            </div>

            {/* Class Year */}
            <div className="space-y-2">
              <Label htmlFor="class_year">Class Year *</Label>
              <Select
                value={formData.class_year}
                onValueChange={(value) => setFormData({ ...formData, class_year: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your class year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Freshman">Freshman</SelectItem>
                  <SelectItem value="Sophomore">Sophomore</SelectItem>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Saving..." : existingData ? "Update" : "Create"} ID
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
