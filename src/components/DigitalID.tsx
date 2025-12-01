import { useState, useEffect } from "react";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { IdCard, AlertCircle, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DigitalIDData {
  id: string;
  full_name: string;
  student_id: string;
  program: string;
  class_year: string;
  photo_url?: string;
  status: string;
}

interface DigitalIDProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DigitalID({ trigger, open: controlledOpen, onOpenChange: setControlledOpen }: DigitalIDProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const [digitalID, setDigitalID] = useState<DigitalIDData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSecurityValidation({ requireAuth: false });

  useEffect(() => {
    if (user) {
      fetchDigitalID();
    }
  }, [user]);

  useEffect(() => {
    if (digitalID?.photo_url) {
      fetchPhotoUrl(digitalID.photo_url);
    }
  }, [digitalID]);

  // Listen for digital ID updates from other components
  useEffect(() => {
    const handleDigitalIDUpdate = () => {
      console.log('Digital ID update event received');
      fetchDigitalID();
    };

    window.addEventListener('digital-id-updated', handleDigitalIDUpdate);

    return () => {
      window.removeEventListener('digital-id-updated', handleDigitalIDUpdate);
    };
  }, [user]);

  // Also refetch when dialog is opened (in case data was updated elsewhere)
  useEffect(() => {
    if (open && user) {
      fetchDigitalID();
    }
  }, [open, user]);


  const fetchDigitalID = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('digital_ids')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching digital ID:', error);
        return;
      }

      setDigitalID(data as unknown as DigitalIDData | null);
    } catch (error) {
      console.error('Digital ID fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotoUrl = async (photoPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(photoPath, 3600);

      if (error) {
        console.error('Error fetching photo URL:', error);
        setPhotoUrl(null);
      } else {
        setPhotoUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Photo URL fetch error:', error);
      setPhotoUrl(null);
    }
  };

  // Deep link configuration for Atrium Campus Connect (restored)
  const ATRIUM_SCHEME = import.meta.env.VITE_ATRIUM_SCHEME || 'atrium://open';
  const ATRIUM_WEB = import.meta.env.VITE_ATRIUM_WEB || 'https://onecard.howard.edu/index.php?cid=426';
  const ATRIUM_ANDROID_PLAY = import.meta.env.VITE_ATRIUM_ANDROID_PLAY || 'https://play.google.com/store/apps/details?id=com.atriumcampus.connect';
  const ATRIUM_IOS_APPSTORE = import.meta.env.VITE_ATRIUM_IOS_APPSTORE || 'https://apps.apple.com/us/app/atrium-campus-connect/id1596975756';

  const openAtrium = () => {
    const appUrl = ATRIUM_SCHEME;
    const fallbackUrl = ATRIUM_WEB;

    const start = Date.now();

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appUrl;
    document.body.appendChild(iframe);

    const timeout = window.setTimeout(() => {
      const elapsed = Date.now() - start;
      if (elapsed < 2000) {
        const ua = navigator.userAgent || '';
        if (/Android/i.test(ua)) {
          window.location.href = ATRIUM_ANDROID_PLAY;
        } else if (/iPhone|iPad|iPod/i.test(ua)) {
          window.location.href = ATRIUM_IOS_APPSTORE;
        } else {
          window.location.href = fallbackUrl;
        }
      }
      try { document.body.removeChild(iframe); } catch (e: unknown) { /* empty */ }
    }, 1200);

    const onVisibility = () => {
      if (document.hidden) {
        window.clearTimeout(timeout);
        try { document.body.removeChild(iframe); } catch (e: unknown) { /* empty */ }
      }
    };
    document.addEventListener('visibilitychange', onVisibility, { once: true });
  };

  const DialogContentBody = (
    <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-center text-xl">Your Howard ID</DialogTitle>
      </DialogHeader>

      <div className="mt-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading your ID...
          </div>
        ) : !digitalID ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You haven't set up your digital ID yet. Please add your ID information in your Profile settings.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border-4 border-primary/20 bg-gradient-to-br from-card to-primary/5 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="text-center py-4 bg-primary/10 border-b-2 border-primary/20">
                <div className="text-sm font-semibold text-primary mb-1">HOWARD UNIVERSITY</div>
                <div className="text-xs text-muted-foreground">Student Identification Card</div>
              </div>

              {/* Full Photo Display */}
              <div className="relative bg-muted">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Student photo ID"
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <div className="w-full h-96 bg-muted flex items-center justify-center">
                    <User className="w-32 h-32 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Security Notice - Only at bottom */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    For security purposes, do not share screenshots of this ID. Use official channels for identity verification.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={openAtrium}>Open Atrium App</Button>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {DialogContentBody}
      </Dialog>
    );
  }

  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <IdCard size={18} /> Digital ID
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-2">
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={!digitalID && !loading}>
                Show ID
              </Button>
            </DialogTrigger>
            <Button size="sm" variant="ghost" onClick={openAtrium}>Open Atrium</Button>
          </div>
          {DialogContentBody}
        </Dialog>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">
        {loading ? (
          "Loading..."
        ) : !digitalID ? (
          "Set up your digital ID in Profile to access your student card."
        ) : (
          "Tap \"Show ID\" for quick access to your digital student card."
        )}
      </CardContent>
    </Card>
  );
}
