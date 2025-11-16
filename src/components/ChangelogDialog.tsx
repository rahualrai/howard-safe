import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Calendar } from "lucide-react";
import { format } from "date-fns";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  release_date: string;
  created_at: string;
}

interface ChangelogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchChangelog();
    }
  }, [open]);

  const fetchChangelog = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("changelog_entries")
        .select("*")
        .order("release_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching changelog:", error);
      // Use fallback data if database fails
      setEntries([
        {
          id: "1",
          version: "1.0.0",
          title: "Initial Release",
          description: "Welcome to Howard Safe! The app is now available with core safety features including emergency contacts, incident reporting, and campus maps.",
          release_date: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            What's New
          </DialogTitle>
          <DialogDescription>
            See what's changed in the latest updates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading changelog...
            </p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No updates yet. Check back soon!
            </p>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{entry.title}</CardTitle>
                    <Badge variant="secondary">{entry.version}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(entry.release_date), "MMMM d, yyyy")}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {entry.description}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

