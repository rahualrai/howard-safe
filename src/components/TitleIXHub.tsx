import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";

export function TitleIXHub() {
  return (
    <Card className="shadow-primary/10 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" /> Title IX Information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 text-sm">
        <p className="text-muted-foreground">
          Title IX protects students from sex-based discrimination, including sexual harassment and violence.
        </p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Ensure safety. If immediate danger, call 911 or campus security.</li>
          <li>Document details and preserve evidence if possible.</li>
          <li>File a report confidentially using official channels.</li>
          <li>Access support resources and accommodations.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://www2.howard.edu/title-ix" target="_blank" rel="noreferrer">
              Learn More <ExternalLink size={14} className="ml-1" />
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href="https://www2.howard.edu/title-ix/report" target="_blank" rel="noreferrer">
              File a Report
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
