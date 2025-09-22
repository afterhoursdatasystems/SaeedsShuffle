# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign up or sign in
3. Click "New Project"
4. Choose your organization
5. Set project name: `saeeds-shuffle`
6. Set database password (save this securely)
7. Choose region (closest to your users)
8. Click "Create new project"

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to create the tables and policies

## Step 3: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-ref.supabase.co`)
   - **Project API Keys → anon public** (starts with `eyJ...`)

## Step 4: Update Environment Variables

1. Open your `.env.local` file
2. Replace the placeholder values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 5: Switch to Supabase Actions

1. Rename `src/app/actions.ts` to `src/app/actions-firebase.ts` (backup)
2. Rename `src/app/actions-supabase.ts` to `src/app/actions.ts`

## Step 6: Test Local Development

```bash
npm run dev
```

Your app should now use Supabase instead of Firebase!

## Step 7: Production Environment Variables

For production, add these environment variables to your hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Benefits of Supabase vs Firebase

✅ **Easier setup** - No complex service account configuration
✅ **SQL database** - More familiar than NoSQL
✅ **Real-time subscriptions** - Built-in live updates
✅ **Automatic APIs** - REST and GraphQL APIs generated automatically
✅ **Better TypeScript support** - Type-safe database queries
✅ **No build-time issues** - Environment variables work seamlessly

## Database Structure

### `players` table:
- `id` (UUID, primary key)
- `name` (text)
- `gender` ('Guy' | 'Gal')
- `skill` (integer, 1-10)
- `present` (boolean)
- `created_at`, `updated_at` (timestamps)

### `published_data` table:
- `id` (UUID, primary key)
- `teams` (JSONB)
- `format` (text)
- `schedule` (JSONB)
- `active_rule` (JSONB)
- `points_to_win` (integer)
- `created_at`, `updated_at` (timestamps)

## Troubleshooting

### "Failed to fetch data"
- Check your environment variables are set correctly
- Ensure your Supabase project is running
- Verify the anon key has the correct permissions

### "Row Level Security" errors
- The schema automatically sets up permissive RLS policies
- All authenticated users can read/write all data
- Adjust policies in Supabase dashboard if needed

### Database connection issues
- Ensure your project URL and API key are correct
- Check that your project isn't paused (free tier auto-pauses after inactivity)