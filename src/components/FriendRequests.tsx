import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserCheck, UserX, Clock } from 'lucide-react';
import { FriendRequest } from '@/hooks/useFriends';

interface FriendRequestsProps {
  friendRequests: FriendRequest[];
  currentUserId: string;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onCancel: (requestId: string) => void;
}

export function FriendRequests({
  friendRequests,
  currentUserId,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestsProps) {
  const pendingRequests = friendRequests.filter((req) => req.status === 'pending');
  const receivedRequests = pendingRequests.filter((req) => req.addressee_id === currentUserId);
  const sentRequests = pendingRequests.filter((req) => req.requester_id === currentUserId);

  const getInitials = (username: string | null): string => {
    if (!username) return '?';
    return username
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Friend Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Received Requests */}
        {receivedRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Received</h3>
            <div className="space-y-2">
              {receivedRequests.map((request) => {
                const requester = request.requester;
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={requester?.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(requester?.username || null)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {requester?.username || 'Unknown User'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onAccept(request.id)}
                        className="h-8"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(request.id)}
                        className="h-8"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Sent</h3>
            <div className="space-y-2">
              {sentRequests.map((request) => {
                const addressee = request.addressee;
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={addressee?.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(addressee?.username || null)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {addressee?.username || 'Unknown User'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="mr-2">
                      Pending
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancel(request.id)}
                      className="h-8 text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

