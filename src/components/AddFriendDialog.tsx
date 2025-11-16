import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { UserSearchResult, FriendRequest } from '@/hooks/useFriends';

interface AddFriendDialogProps {
  onSearch: (query: string) => void;
  searchResults: UserSearchResult[];
  onSendRequest: (userId: string) => Promise<boolean>;
  currentUserId: string;
  existingFriendIds: string[];
  pendingRequests: FriendRequest[];
}

export function AddFriendDialog({
  onSearch,
  searchResults,
  onSendRequest,
  currentUserId,
  existingFriendIds,
  pendingRequests,
}: AddFriendDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (open && searchQuery) {
      const timeoutId = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (open && !searchQuery) {
      onSearch('');
    }
  }, [searchQuery, open, onSearch]);

  const handleSendRequest = async (userId: string) => {
    setSendingRequestId(userId);
    const success = await onSendRequest(userId);
    if (success) {
      setSearchQuery('');
      setOpen(false);
    }
    setSendingRequestId(null);
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

  const isAlreadyFriend = (userId: string) => existingFriendIds.includes(userId);
  const hasPendingRequest = (userId: string) => {
    return pendingRequests.some(
      (req) =>
        (req.requester_id === currentUserId && req.addressee_id === userId) ||
        (req.addressee_id === currentUserId && req.requester_id === userId)
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Search for users by username to send a friend request
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by username..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {searchQuery.trim() === '' ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start typing to search for users</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              searchResults
                .filter((user) => user.user_id !== currentUserId)
                .map((user) => {
                  const isFriend = isAlreadyFriend(user.user_id);
                  const hasRequest = hasPendingRequest(user.user_id);
                  const isSending = sendingRequestId === user.user_id;

                  return (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {user.username || 'Unknown User'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={isFriend || hasRequest ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => !isFriend && !hasRequest && handleSendRequest(user.user_id)}
                        disabled={isFriend || hasRequest || isSending}
                        className="h-8"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isFriend ? (
                          'Friends'
                        ) : hasRequest ? (
                          'Pending'
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

