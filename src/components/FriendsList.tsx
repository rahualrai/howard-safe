import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MapPin, MapPinOff, UserX } from 'lucide-react';
import { Friend } from '@/hooks/useFriends';
import { FriendLocation } from '@/hooks/useLocationSharing';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FriendsListProps {
  friends: Friend[];
  friendsLocations: FriendLocation[];
  onRemoveFriend: (friendId: string) => void;
}

export function FriendsList({ friends, friendsLocations, onRemoveFriend }: FriendsListProps) {
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

  const getFriendLocation = (friendId: string): FriendLocation | undefined => {
    return friendsLocations.find((loc) => loc.friend_id === friendId);
  };

  const getInitials = (username: string | null): string => {
    if (!username) return '?';
    return username
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (friends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No friends yet</p>
            <p className="text-sm mt-2">Add friends to see their locations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends ({friends.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {friends.map((friend) => {
            const location = getFriendLocation(friend.friend_id);
            const hasLocation = location && location.is_sharing && location.latitude && location.longitude;
            const locationAge = location?.location_timestamp
              ? Math.floor((Date.now() - new Date(location.location_timestamp).getTime()) / 1000 / 60)
              : null;

            return (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(friend.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {friend.username || 'Unknown User'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {hasLocation ? (
                        <>
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-muted-foreground">
                            {locationAge !== null
                              ? locationAge < 1
                                ? 'Just now'
                                : locationAge < 60
                                  ? `${locationAge}m ago`
                                  : `${Math.floor(locationAge / 60)}h ago`
                              : 'Location available'}
                          </span>
                        </>
                      ) : (
                        <>
                          <MapPinOff className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Location not shared</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemovingFriendId(friend.friend_id)}
                  className="text-destructive hover:text-destructive"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog open={removingFriendId !== null} onOpenChange={(open) => !open && setRemovingFriendId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? You will no longer be able to see their location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removingFriendId) {
                  onRemoveFriend(removingFriendId);
                  setRemovingFriendId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

