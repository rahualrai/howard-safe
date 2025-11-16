# How to Apply Database Migrations

The friends and location sharing feature requires database tables to be created. Follow these steps to apply the migrations:

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20250115000000_add_friends_and_location_sharing.sql`
4. Copy the entire contents of the file
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration
7. Repeat for `supabase/migrations/20250116000000_update_profiles_for_friends.sql`

## Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Apply all pending migrations
supabase db push
```

## Option 3: Manual SQL Execution

1. Connect to your Supabase database using any PostgreSQL client
2. Run the SQL from `supabase/migrations/20250115000000_add_friends_and_location_sharing.sql`
3. Run the SQL from `supabase/migrations/20250116000000_update_profiles_for_friends.sql`

## Verification

After applying migrations, verify the tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('friend_requests', 'friendships', 'user_locations', 'location_sharing_preferences');

-- Check if policies exist
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('friend_requests', 'friendships', 'user_locations', 'location_sharing_preferences');
```

## Important Notes

- The migrations use `CREATE TABLE IF NOT EXISTS`, so running them multiple times is safe
- All tables have Row Level Security (RLS) enabled for security
- The `get_friends_with_locations` function is created for efficient friend location queries
- Profiles are automatically created when users sign up, and the policy allows authenticated users to search profiles

## Troubleshooting

If you get errors:
1. Make sure you're running the migrations in order
2. Check that the `profiles` table already exists (from previous migrations)
3. Verify you have the necessary permissions in Supabase
4. Check the Supabase logs for detailed error messages

