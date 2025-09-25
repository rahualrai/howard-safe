import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ReactNode, useState } from "react";

type AppTileProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  fullPagePath?: string;
};

export function AppTile({ title, icon, children, fullPagePath }: AppTileProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer transition-all hover:shadow-md">
          <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-foreground/80">
              {icon}
            </div>
            <div className="text-xs font-medium text-center truncate max-w-[8rem]">{title}</div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            {fullPagePath && (
              <Button asChild size="sm" variant="outline">
                <Link to={fullPagePath}>Open full page</Link>
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="mt-2 space-y-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
