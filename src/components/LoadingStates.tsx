import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AlertSkeleton() {
  return (
    <Card className="shadow-soft border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center ml-auto">
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-4 w-4 ml-2" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActionSkeleton() {
  return (
    <Card className="shadow-soft border-border">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20 mx-auto" />
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="text-center">
          <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
}

export function HomeLoadingScreen() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="px-mobile-padding py-4">
          <Skeleton className="h-8 w-32 mx-auto mb-1" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-mobile-padding pt-6 pb-24">
        {/* Quick Help Button */}
        <div className="mb-8">
          <Skeleton className="w-full h-20 rounded-lg mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        {/* Emergency Alerts Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>

          <div className="space-y-3">
            <AlertSkeleton />
            <AlertSkeleton />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <QuickActionSkeleton />
          <QuickActionSkeleton />
        </div>
      </main>
    </div>
  );
}