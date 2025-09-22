# Supabase Google Authentication Setup

## Step 1: Configure Google OAuth in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`saeeds-shuffle`)
3. Navigate to **Authentication → Providers**
4. Click on **Google** provider
5. Enable Google authentication
6. Add your redirect URLs:
   - For development: `http://localhost:9004/auth/callback`
   - For production: `https://your-domain.com/auth/callback`

## Step 2: Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://your-supabase-project-ref.supabase.co/auth/v1/callback`
   - Replace `your-supabase-project-ref` with your actual project reference

## Step 3: Configure Supabase with Google Credentials

Back in Supabase Dashboard:
1. Go to **Authentication → Providers → Google**
2. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
3. Click **Save**

## Step 4: Update Environment Variables (Optional)

Your current `.env.local` already has the Supabase configuration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://flivbajmjdvrpzrtrkto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 5: Test Authentication

1. Start your dev server: `npm run dev -- -p 9004`
2. Go to `http://localhost:9004/login`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. You should be redirected to `/admin` upon successful login

## Benefits of Supabase Auth vs Firebase Auth

✅ **Simpler setup** - No complex service account configuration
✅ **Built-in with database** - Auth and data in one place
✅ **Automatic redirect handling** - Built-in OAuth flow management
✅ **Row Level Security** - Database-level user access control
✅ **No build-time issues** - Works seamlessly in all environments

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the redirect URI in Google Cloud Console matches exactly:
  `https://flivbajmjdvrpzrtrkto.supabase.co/auth/v1/callback`

### Authentication not working in development
- Ensure you've added `http://localhost:9004/auth/callback` to both:
  - Google Cloud Console authorized redirect URIs
  - Supabase Auth provider settings

### User not redirecting after login
- Check browser console for errors
- Verify the redirect URL in Supabase Auth settings
- Make sure your OAuth flow completes properly

## Current Status

✅ **Supabase Auth context** - Created and configured
✅ **Login page** - Updated to use Supabase Auth
✅ **Admin layout** - Protected with authentication checks
✅ **App header** - Shows user info and logout functionality
⏳ **Google OAuth setup** - Requires manual configuration in Supabase + Google Cloud

Once you complete the Google OAuth setup in Supabase Dashboard, your authentication will work exactly like it did with Firebase, but with a much simpler configuration!