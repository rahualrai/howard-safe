import { useState } from "react";
import idCardAsset from "@/assets/id-card.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { IdCard } from "lucide-react";

export function DigitalID() {
  const [open, setOpen] = useState(false);

  // TODO: Replace mock data with authenticated student profile
  const student = {
    name: "Bison Student",
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
          <SheetTrigger asChild>
            <Button size="sm" variant="outline">Show ID</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Your Howard ID</SheetTitle>
            </SheetHeader>
              <div className="mt-4">
                <div className="mx-auto max-w-sm">
                  <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      {/* Photo area: user can add /id-card.jpg in the public folder; falls back to placeholder.svg */}
                      <img
                        src={idCardAsset}
                        onError={(e) => {
                          // fallback to placeholder in public if local asset fails
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (e.currentTarget as any).src = '/placeholder.svg';
                        }}
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
