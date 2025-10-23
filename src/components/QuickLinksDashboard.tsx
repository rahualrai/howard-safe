import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type QuickLink = {
  id: string;
  label: string;
  href: string;
};

const DEFAULT_LINKS: QuickLink[] = [
  { id: "1", label: "Canvas", href: "https://canvas.howard.edu" },
  { id: "2", label: "Bison Email", href: "https://outlook.office.com" },
  { id: "3", label: "Financial Aid", href: "https://www2.howard.edu/student-financial-services" },
  { id: "4", label: "Course Registration", href: "https://www.myworkday.com/howard/d/task/3005$2765.htmld#backheader=true" },
  { id: "5", label: "Handshake", href: "https://howard.joinhandshake.com" },
];

export function QuickLinksDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["quick_links", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [] as QuickLink[];
      // any-cast since generated types don't yet include quick_links
      const { data, error } = await (supabase
        .from("quick_links" as any)
        .select("id,label,href,order_index")
        .eq("user_id", userId)
        .order("order_index", { ascending: true })) as unknown as { data: { id: string; label: string; href: string; order_index: number }[] | null, error: any };
      if (error) throw error;
      return (data ?? []).map((r) => ({ id: r.id, label: r.label, href: r.href })) as QuickLink[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const links = (data && data.length > 0) ? data : DEFAULT_LINKS;

  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");

  const addLink = useMutation({
    mutationFn: async ({ label, href }: { label: string; href: string }) => {
      if (!userId) throw new Error("Not authenticated");
      // compute next order_index
      const nextIndex = (data?.length ?? 0);
      const { error } = await (supabase
        .from("quick_links" as any)
        .insert([{ user_id: userId, label, href, order_index: nextIndex }])) as unknown as { error: any };
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick_links", userId] });
      setNewLabel("");
      setNewHref("");
    },
  });

  const deleteLink = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await (supabase
        .from("quick_links" as any)
        .delete()
        .eq("id", id)
        .eq("user_id", userId)) as unknown as { error: any };
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick_links", userId] });
    },
  });

  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <LinkIcon size={18} /> Quick Links
        </CardTitle>
        <Button size="sm" variant="outline" disabled title="Customization coming soon">
          <Plus size={14} className="mr-1" /> Customize
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading && userId && <div className="text-sm text-muted-foreground">Loading your links…</div>}
        {error && <div className="text-sm text-destructive">Unable to load your links. Showing defaults.</div>}
        <div className="grid grid-cols-2 gap-2">
          {links.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent/40 transition-colors">
              <a href={l.href} target="_blank" rel="noreferrer" className="truncate flex-1">{l.label}</a>
              {userId && data && data.length > 0 && (
                <button
                  aria-label={`Remove ${l.label}`}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => deleteLink.mutate({ id: l.id })}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {userId && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            <div className="text-xs text-muted-foreground">Add a quick link</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                className="col-span-1 sm:col-span-1 rounded border bg-background px-2 py-1 text-sm"
                placeholder="Label (e.g., Blackboard)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <input
                className="col-span-1 sm:col-span-2 rounded border bg-background px-2 py-1 text-sm"
                placeholder="https://..."
                value={newHref}
                onChange={(e) => setNewHref(e.target.value)}
              />
              <Button
                size="sm"
                onClick={() => addLink.mutate({ label: newLabel.trim(), href: newHref.trim() })}
                disabled={addLink.isPending || newLabel.trim().length === 0 || !newHref.startsWith("http")}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
