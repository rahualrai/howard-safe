import { useState, useEffect } from "react";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { IdCard, AlertCircle, User } from "lucide-react";
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

export function DigitalID() {
  const [open, setOpen] = useState(false);
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


  const fetchDigitalID = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('digital_ids' as any)
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
      try { document.body.removeChild(iframe); } catch (e) {}
    }, 1200);

    const onVisibility = () => {
      if (document.hidden) {
        window.clearTimeout(timeout);
        try { document.body.removeChild(iframe); } catch (e) {}
      }
    };
    document.addEventListener('visibilitychange', onVisibility, { once: true });
  };

  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <IdCard size={18} /> Digital ID
        </CardTitle>
        <Sheet open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-2">
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" disabled={!digitalID && !loading}>
                Show ID
              </Button>
            </SheetTrigger>
            <Button size="sm" variant="ghost" onClick={openAtrium}>Open Atrium</Button>
          </div>

          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Your Howard ID</SheetTitle>
            </SheetHeader>

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
                <div className="mx-auto max-w-sm">
                  <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Student photo ID"
                          className="w-24 h-24 rounded-md object-cover border"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center">
                          <User className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold">{digitalID.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {digitalID.program} • {digitalID.class_year}
                            </div>
                          </div>
                          <Badge variant="secondary">Student</Badge>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="text-muted-foreground">HU ID</div>
                          <div className="font-medium">{digitalID.student_id}</div>
                          <div className="text-muted-foreground">Status</div>
                          <div className="font-medium text-green-600">
                            {digitalID.status === 'active' ? 'Active' : digitalID.status}
                          </div>
                        </div>
                        <div className="mt-5 text-xs text-muted-foreground">
                          For security, this ID auto-hides after 30s. Do not share screenshots.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
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
