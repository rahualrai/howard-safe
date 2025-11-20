import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-8 w-32" />
        </div>
      </header>
      
      <main className="p-4 max-w-md mx-auto space-y-4 pb-24">
        {/* Account Info Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Skeleton className="h-5 w-5 rounded-full mr-2" />
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Security Status Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Skeleton className="h-5 w-5 rounded-full mr-2" />
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Profile Settings Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Skeleton className="h-5 w-5 rounded-full mr-2" />
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-10 w-20 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Friends & Location Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center">
              <Skeleton className="h-5 w-5 rounded-full mr-2" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Skeleton className="h-5 w-5 rounded-full mr-2" />
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacy & Security Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Skeleton className="h-5 w-5 rounded-full mr-2" />
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-10 w-20 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* App & Support Card Skeleton */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Skeleton className="h-5 w-5 rounded-full mr-2" />
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-10 w-20 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out Button Skeleton */}
        <Skeleton className="w-full h-12 rounded-md" />
      </main>
    </div>
  );
}

