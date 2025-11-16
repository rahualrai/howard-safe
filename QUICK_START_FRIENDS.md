# Quick Start: Friends & Location Sharing Feature

## 🚀 Step 1: Apply Database Migration

**IMPORTANT:** You must run the SQL migration before the friends feature will work!

### Option A: Using Supabase Dashboard (Easiest)

1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file: `supabase/apply_friends_migration.sql`
5. Copy the **entire contents** of the file
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Wait for "Success. No rows returned" message

### Option B: Using Supabase CLI

```bash
supabase db push
```

## ✅ Step 2: Verify Migration

After running the migration, verify it worked:

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these new tables:
   - `friend_requests`
   - `friendships`
   - `user_locations`
   - `location_sharing_preferences`

## 🎯 Step 3: Test the Feature

1. **Sign in** to your app - profiles are automatically created
2. Go to **Profile** page
3. Click **"Add Friend"** button
4. Search for users by username
5. Send friend requests
6. Accept/reject requests
7. Toggle **"Share Location with Friends"** to start sharing
8. View friends' locations on the **Map** page

## 🔧 Troubleshooting

### Error: "Could not find the table 'public.friend_requests'"

**Solution:** The migration hasn't been run yet. Follow Step 1 above.

### Error: "Function ensure_profile_exists does not exist"

**Solution:** This is normal if the migration hasn't been run. The app will fall back to creating profiles directly. Run the migration to fix this.

### Can't find users when searching

**Solution:** 
- Make sure users have profiles (they're created automatically on signup)
- Check that the profile policy allows viewing profiles (included in migration)
- Verify users have usernames set in their profiles

## 📝 What the Migration Does

The migration creates:
- **friend_requests** table - stores friend requests
- **friendships** table - stores accepted friendships (bidirectional)
- **user_locations** table - stores real-time location data
- **location_sharing_preferences** table - stores sharing settings
- **RLS policies** - secure access control
- **Triggers** - auto-create friendships when requests are accepted
- **Functions** - helper functions for queries
- **Profile policies** - allows authenticated users to search profiles

## 🔒 Security

All tables have Row Level Security (RLS) enabled:
- Users can only see their own friend requests
- Users can only see friends' locations if sharing is enabled
- Users can only modify their own data
- All policies are enforced at the database level

## 🎉 You're Done!

Once the migration is applied, the friends feature is fully functional. Users can:
- Add friends by searching usernames
- Accept/reject friend requests
- Share their location with friends
- See friends' locations on the map in real-time

