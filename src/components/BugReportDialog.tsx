import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bug } from "lucide-react";

interface BugReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

export function BugReportDialog({ open, onOpenChange, userId }: BugReportDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Auto-collect device info
  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      language: navigator.language,
      timestamp: new Date().toISOString(),
    };
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in title and description.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report a bug.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("bug_reports")
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          steps_to_reproduce: stepsToReproduce.trim() || null,
          device_info: getDeviceInfo(),
        });

      if (error) throw error;

      toast({
        title: "Bug report submitted",
        description: "Thank you for helping us improve the app!",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setStepsToReproduce("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast({
        title: "Failed to submit",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Found an issue? Let us know and we'll fix it as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="bug-title">Title *</Label>
            <Input
              id="bug-title"
              placeholder="Brief description of the bug"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="bug-description">Description *</Label>
            <Textarea
              id="bug-description"
              placeholder="What happened? What did you expect to happen?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="bug-steps">Steps to Reproduce (optional)</Label>
            <Textarea
              id="bug-steps"
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              rows={3}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Device information will be automatically included with your report.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

