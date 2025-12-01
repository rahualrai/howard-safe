# Friends & Location Sharing - Setup Guide

## Overview

The friends and location sharing feature allows users to add friends, request friendships, and share their real-time location with trusted contacts. This comprehensive guide covers setup, migration, testing, and troubleshooting.

---

## Quick Start (3 Steps)

If you just want to get started quickly:

1. **Apply the database migration** (see section below)
2. **Verify the tables exist** (see Verification section)
3. **Start using the feature** in the app (Profile → Add Friends)

---

## Database Migrations

### Prerequisites

- Supabase project set up with necessary access
- Supabase CLI installed (optional, for CLI method) or access to Supabase Dashboard
- Database user created and `profiles` table already exists

### What the Migration Creates

The migration creates the following database tables and functions:

**Tables:**
- `friend_requests` - Stores pending and accepted friend requests
- `friendships` - Stores accepted, bidirectional friendships
- `user_locations` - Stores real-time location data for users
- `location_sharing_preferences` - Stores user sharing settings

**Security:**
- Row Level Security (RLS) policies for all tables
- RLS policies enable secure access control
- Users can only see their own friend requests and locations of friends they've authorized
- Database-level enforcement of access rules

**Triggers & Functions:**
- Auto-create friendships when requests are accepted
- `get_friends_with_locations` function for efficient friend location queries
- Auto-create profile records when users sign up

**Indexes:**
- Performance-optimized queries for friend lookups
- Fast location proximity searches

---

## Setting Up the Database Migration

You have **3 options** for applying the migration. Choose the one that works best for you:

### Option 1: Using Supabase Dashboard (Recommended)

This is the easiest method if you don't have the CLI installed.

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click the **SQL Editor** tab on the left sidebar
   - Click **New Query**

3. **Copy the migration SQL**
   - Open the file: `supabase/migrations/20250115000000_add_friends_and_location_sharing.sql`
   - Copy the entire contents

4. **Paste and Execute**
   - Paste the SQL into the editor
   - Click **Run** (or press Cmd/Ctrl + Enter)
   - Wait for "Success. No rows returned" message

5. **Apply the second migration**
   - Repeat steps 3-4 for: `supabase/migrations/20250116000000_update_profiles_for_friends.sql`

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# 1. Make sure you're logged in
supabase login

# 2. Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# 3. Apply all pending migrations
supabase db push

# 4. Verify migrations applied
supabase migration list
```

### Option 3: Manual SQL Execution

If you have direct database access:

1. Connect to your Supabase PostgreSQL database using any PostgreSQL client (pgAdmin, DBeaver, etc.)
2. Execute the SQL from `supabase/migrations/20250115000000_add_friends_and_location_sharing.sql`
3. Execute the SQL from `supabase/migrations/20250116000000_update_profiles_for_friends.sql`
4. Verify the tables exist (see Verification section below)

---

## Verification

After applying the migrations, verify everything was set up correctly:

### Check if tables exist:

In Supabase Dashboard, go to **SQL Editor** and run:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('friend_requests', 'friendships', 'user_locations', 'location_sharing_preferences');
```

**Expected output:**
```
friend_requests
friendships
user_locations
location_sharing_preferences
```

### Check if RLS policies exist:

```sql
SELECT policyname, tablename
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('friend_requests', 'friendships', 'user_locations', 'location_sharing_preferences');
```

**Expected output:**
Multiple policies for each table, like:
- `friend_requests_select_own`
- `friend_requests_insert_own`
- `friendships_select_own`
- etc.

### Check if function exists:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_friends_with_locations';
```

**Expected output:**
```
get_friends_with_locations
```

If all checks pass, the migration was successful!

---

## Testing the Feature

Once the migration is applied, test the feature end-to-end:

### Step 1: Create test user accounts

1. **Open the app** at `http://localhost:8080`
2. **Sign up as User A** with email (e.g., `user-a@test.com`)
3. **Sign up as User B** in a new browser tab or incognito window with email (e.g., `user-b@test.com`)

### Step 2: Create user profiles

1. **In User A's account:**
   - Go to Profile page
   - User profile should be auto-created with username from email

2. **In User B's account:**
   - Go to Profile page
   - User profile should be auto-created

### Step 3: Send friend request

1. **In User A's account:**
   - Click **"Add Friend"** button
   - Search for "user-b" (or User B's username)
   - Click on the user
   - Click **"Send Friend Request"**
   - Button changes to "Request Sent"

2. **In User B's account:**
   - Refresh or navigate to Profile
   - You should see **"Pending Friend Requests"** section
   - See User A's request with **"Accept"** or **"Decline"** buttons

### Step 4: Accept friend request

1. **In User B's account:**
   - Click **"Accept"** on User A's request
   - Button changes to **"Friend"**

2. **In User A's account:**
   - Refresh the page
   - User B now appears in **"Your Friends"** section
   - Button shows **"Remove Friend"**

### Step 5: Share location

1. **In User A's account:**
   - In Profile, find User B in friends list
   - Click the **location/map icon** to toggle "Share location"
   - Toggle should change color to indicate sharing is enabled

2. **In User B's account:**
   - Go to **Map** page
   - User A should appear on the map as a marker
   - Click the marker to see User A's current location

### Step 6: View on map

1. Both users should be able to see each other on the **Map** page
2. Locations should update in real-time as users move
3. Only authorized friends' locations should be visible

### Success! 🎉

If all steps work, the friends and location sharing feature is fully functional!

---

## Troubleshooting

### Error: "Could not find the table 'public.friend_requests'"

**Cause:** The migration hasn't been run yet.

**Solution:**
1. Follow the "Database Migrations" section above to apply the SQL
2. Refresh the page after applying
3. If using CLI, verify with `supabase migration list`

### Error: "Function ensure_profile_exists does not exist"

**Cause:** This is normal if the migration hasn't been run. The app will fall back to creating profiles directly.

**Solution:**
1. Run the database migration
2. Clear browser cache and refresh
3. Try signing up again

### Can't find users when searching for friends

**Cause:** Users don't have profiles, or profile search policy isn't correct.

**Solution:**
1. Make sure both users have signed up and visited Profile page once
2. Verify users have usernames set in their profile
3. Check Supabase logs for error messages
4. Verify the migration included the profile policies

### User sees "Request Pending" but other user doesn't see the request

**Cause:** Friend request wasn't inserted, or RLS policy is blocking it.

**Solution:**
1. Check browser console for error messages
2. Verify you're authenticated (not anonymous)
3. Check Supabase logs for RLS policy violations
4. Make sure the second migration was applied

### Locations not showing on map

**Cause:** Location sharing disabled, migration incomplete, or permissions issue.

**Solution:**
1. Verify both users have toggled "Share Location" enabled in Profile
2. Check that migration created `user_locations` and `location_sharing_preferences` tables
3. Wait a few seconds for real-time updates
4. Check browser console for API errors
5. Verify Google Maps API key is set

---

## Important Notes

### Security

- **Bidirectional**: Friendships are mutual. If User A adds User B as a friend and User B accepts, they're friends with each other.
- **RLS Enforced**: All access is controlled at the database level with Row Level Security policies. Users cannot view data they shouldn't.
- **Location Sharing**: Users must explicitly enable location sharing. Disabled by default for privacy.
- **Anonymous**: Only authenticated users can use this feature.

### Privacy

- Friends can only see each other's locations if location sharing is enabled
- Friend requests are private - only visible to the recipient
- Historical location data is not stored (only current location)
- Users can remove friends at any time to block location sharing

### Performance

- The migration includes database indexes for fast friend lookups
- The `get_friends_with_locations` function efficiently queries friends and their locations
- Real-time updates use Supabase subscriptions

---

## What Gets Created

### Tables

**friend_requests**
- Stores pending and accepted friend requests
- Fields: id, from_user_id, to_user_id, status, created_at, updated_at
- Statuses: pending, accepted, declined

**friendships**
- Stores accepted, bidirectional friendships
- Fields: id, user_id_1, user_id_2, created_at
- Enforced bidirectional (both users can see the friendship)

**user_locations**
- Stores real-time location data
- Fields: id, user_id, latitude, longitude, updated_at
- Only stores current location (overwrites previous)

**location_sharing_preferences**
- Stores sharing settings
- Fields: id, user_id, sharing_enabled, created_at, updated_at
- Controls whether user's location is shared with friends

### Policies

Row Level Security (RLS) ensures:
- Users can only see their own friend requests
- Users can only see friendships they're part of
- Users can only see friends' locations if they authorized sharing
- Users can only update/delete their own data
- Database enforces all access control

---

## Development Integration

### Using in Components

```tsx
// Fetch user's friends
import { useFriendsQuery } from '@/hooks/useFriendsQuery';

export function FriendsComponent() {
  const { friends, loading, error } = useFriendsQuery();

  if (loading) return <div>Loading friends...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {friends?.map(friend => (
        <div key={friend.id}>{friend.username}</div>
      ))}
    </div>
  );
}
```

### Using in API Calls

```ts
// Get friends with their locations
const { data, error } = await supabase
  .rpc('get_friends_with_locations', { user_id: userId });

if (error) {
  console.error('Error:', error);
} else {
  console.log('Friends with locations:', data);
}
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Tables don't exist | Migration not run | Apply migration via Dashboard/CLI |
| RLS errors | Policy blocking access | Check user is authenticated |
| Can't find friends | No profiles created | Visit Profile page after signup |
| Locations not updating | Real-time disabled | Check subscription is active |
| Friend request fails | User not authenticated | Ensure user is logged in |
| Permission denied errors | RLS policy violation | Check user_id matches auth.uid() |

---

## Next Steps

After successful setup:

1. **Test the feature thoroughly** - Try all user flows
2. **Review the code** - Check components using the friends feature
3. **Set up real-time notifications** (future enhancement)
4. **Monitor in production** - Watch Supabase logs for issues
5. **Gather user feedback** - Improve UX based on usage

---

## Support

For issues:
1. Check Supabase logs for database errors
2. Check browser console for client errors
3. Verify migrations were applied with correct SQL
4. Check RLS policies are correct
5. Verify user is authenticated (not anonymous)

For questions about specific components or hooks, check the codebase or CLAUDE.md for architecture guidance.
