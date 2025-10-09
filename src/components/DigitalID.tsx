import { useState } from "react";
import idCardAsset from "@/assets/id-card.jpg";
import { useSecurityValidation } from "@/hooks/useSecurityValidation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { IdCard } from "lucide-react";

export function DigitalID() {
  const [open, setOpen] = useState(false);
  const { user } = useSecurityValidation({ requireAuth: false });

  // Always use the bundled id-card asset for now (Supabase disabled for Digital ID)
  const avatarSrc = idCardAsset;

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

  const student = {
    name: user?.email ?? "Bison Student",
    id: "H12345678",
    program: "Computer Science",
    class: "Senior",
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
              <Button size="sm" variant="outline">Show ID</Button>
            </SheetTrigger>
            <Button size="sm" variant="ghost" onClick={openAtrium}>Open Atrium</Button>
          </div>

          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Your Howard ID</SheetTitle>
            </SheetHeader>

            <div className="mt-4">
              <div className="mx-auto max-w-sm">
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <img
                      src={avatarSrc}
                      alt="Student photo ID"
                      className="w-24 h-24 rounded-md object-cover border"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">{student.name}</div>
                          <div className="text-sm text-muted-foreground">{student.program} • {student.class}</div>
                        </div>
                        <Badge variant="secondary">Student</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="text-muted-foreground">HU ID</div>
                        <div className="font-medium">{student.id}</div>
                        <div className="text-muted-foreground">Status</div>
                        <div className="font-medium text-green-600">Active</div>
                      </div>
                      <div className="mt-5 text-xs text-muted-foreground">
                        For security, this ID auto-hides after 30s. Do not share screenshots.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">
        Tap "Show ID" for quick access to your digital student card.
      </CardContent>
    </Card>
  );
}
