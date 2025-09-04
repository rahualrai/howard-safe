import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";

interface PageSkeletonProps {
  type?: 'home' | 'map' | 'list' | 'form';
}

export function PageSkeleton({ type = 'list' }: PageSkeletonProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="bg-card shadow-soft border-b border-border">
        <div className="px-mobile-padding py-4">
          <Skeleton className="h-6 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="px-mobile-padding pt-6 pb-24">
        {type === 'home' && <HomeSkeleton />}
        {type === 'map' && <MapSkeleton />}
        {type === 'form' && <FormSkeleton />}
        {type === 'list' && <ListSkeleton />}
      </main>

      <BottomNavigation />
    </div>
  );
}

function HomeSkeleton() {
  return (
    <>
      {/* Quick Help Button */}
      <div className="mb-8">
        <Skeleton className="w-full h-20 rounded-lg mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>

      {/* Alerts Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <Card key={i} className="shadow-soft border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => (
          <Card key={i} className="shadow-soft border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20 mx-auto" />
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function MapSkeleton() {
  return (
    <>
      {/* Search Bar */}
      <div className="mb-4">
        <Skeleton className="w-full h-10 rounded-lg" />
      </div>

      {/* Map Area */}
      <Skeleton className="w-full h-96 rounded-lg mb-6" />

      {/* Map Information */}
      <div>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-soft border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="w-16 h-6 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function FormSkeleton() {
  return (
    <Card className="shadow-primary">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form Fields */}
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
        ))}
        
        {/* Submit Button */}
        <Skeleton className="w-full h-12 rounded-lg" />
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <Card key={i} className="shadow-soft border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center gap-2 mt-2">
                  <Skeleton className="h-3 w-12 rounded-full" />
                </div>
              </div>
              <Skeleton className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}