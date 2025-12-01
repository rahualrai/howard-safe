import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ReactNode, useState } from "react";
import { motion } from "framer-motion";

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
        <motion.div
          whileHover={{ scale: 1.02, translateY: -5 }}
          whileTap={{ scale: 0.98 }}
          className="h-full"
        >
          <Card className="h-full cursor-pointer transition-all duration-300 border-none shadow-soft hover:shadow-hover bg-white rounded-[2rem] overflow-hidden group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-4 flex flex-col items-center justify-center gap-3 h-full relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-soft shadow-inner flex items-center justify-center text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <div className="text-primary drop-shadow-sm">
                  {icon}
                </div>
              </div>
              <div className="text-sm font-bold text-center text-foreground/80 group-hover:text-primary transition-colors">
                {title}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-[2.5rem] border-none shadow-2xl bg-white/95 backdrop-blur-xl p-6">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
              {title}
            </DialogTitle>
            {fullPagePath && (
              <Button asChild size="sm" variant="secondary" className="rounded-full px-4">
                <Link to={fullPagePath}>Open full page</Link>
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="mt-2 space-y-4 max-h-[70vh] overflow-y-auto p-1 custom-scrollbar">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
