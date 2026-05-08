# Authentication setup — Google OAuth + Supabase

This walkthrough collects the values you need to drop into `.env`, then configures the Supabase project so the app's sign-in flow works.

You'll do this once. Total time: ~25 minutes.

**Outputs** you'll have at the end:
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (in `.env`)
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (in `.env`)
- Google provider enabled in Supabase
- Email auth configured in Supabase (confirmation + password-reset deep link)
- The `profiles` table created in the database

---

## Step 1 — Google Cloud Console

### 1.1 Pick or create a Google Cloud project

Open https://console.cloud.google.com/. Either:
- Use an existing project, or
- Click the project dropdown (top-left) → **New Project** → name it `UriScan AI` → Create.

### 1.2 Configure the OAuth consent screen

You must do this once per Google Cloud project before you can create OAuth clients.

1. Sidebar → **APIs & Services** → **OAuth consent screen**.
2. **User Type:** External → Create.
3. Fill in:
   - **App name:** `UriScan AI`
   - **User support email:** your email
   - **Developer contact:** your email
4. **Scopes:** click Save and Continue (no scopes to add — `openid`, `profile`, `email` are added automatically by the SDK).
5. **Test users:** add your own Google account so you can test sign-in before publishing.
6. Save and return to the dashboard.

> ⚠️ While in "Testing" mode, only added test users can sign in. To allow any Google user, click **Publish app** when you're ready (no review needed for basic scopes).

### 1.3 Create the **Web** OAuth client (for Supabase)

Supabase verifies Google ID tokens server-side using a Web client.

1. Sidebar → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID**.
3. **Application type:** Web application.
4. **Name:** `UriScan AI – Supabase`.
5. **Authorized redirect URIs:** add this exact URL (replace nothing — your project ref is already filled in):
   ```
   https://lfdfovmvtkxdtjgntwzq.supabase.co/auth/v1/callback
   ```
6. Click **Create**.
7. Copy the **Client ID** and **Client secret** that appear. You'll need both:
   - The **Client ID** goes into `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - The **Client secret** goes into Supabase (Step 3.1) — never put it in the app code.

### 1.4 Create the **Android** OAuth client (for the app)

This is the client the app uses to perform the actual sign-in on the device.

You need the SHA-1 fingerprint of the keystore that signs your APK. Get it with **whichever** of these matches your build setup:

#### If you use EAS Build (cloud builds)

```sh
npx eas-cli credentials
```
Pick **Android** → your project → keystore → it prints the SHA-1.

#### If you build locally with `expo run:android` (debug keystore)

```sh
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Look for the line `SHA1:` and copy that value (40 hex chars separated by colons, e.g. `AB:CD:EF:...`).

> When you eventually publish to Play Store, Play App Signing replaces your upload key with a Google-managed signing key — you'll need to add **that** SHA-1 too (visible in Play Console → Setup → App integrity). For now, dev SHA-1 is enough.

Then back in Google Cloud Console:

1. **Credentials** → **Create Credentials** → **OAuth client ID**.
2. **Application type:** Android.
3. **Name:** `UriScan AI – Android`.
4. **Package name:** `com.moiz_ratlam77.UriScan_AI` (must match `android.package` in `app.json`).
5. **SHA-1 certificate fingerprint:** paste the value from above.
6. Click **Create**.
7. Copy the **Client ID** → goes into `.env` as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.

> ℹ️ Android OAuth clients have no client secret — that's normal.

---

## Step 2 — Supabase

Open https://supabase.com/dashboard/project/lfdfovmvtkxdtjgntwzq.

### 2.1 Enable the Google provider

1. Sidebar → **Authentication** → **Providers**.
2. Scroll to **Google** → toggle **Enabled**.
3. Paste the **Web Client ID** from Step 1.3.
4. Paste the **Web Client Secret** from Step 1.3.
5. Leave "Skip nonce checks" **off**.
6. Save.

### 2.2 Configure email auth

Same page → top of Providers list, **Email** is enabled by default. Confirm:
- **Confirm email:** ON (users must verify before signing in)
- **Secure email change:** ON

Then sidebar → **Authentication** → **URL Configuration**:
- **Site URL:** `uriscanai://auth-callback` (this is your app's deep link)
- **Redirect URLs (allow list):** add `uriscanai://*` so password-reset and confirmation links can deep-link back into the app.

### 2.3 Customize the email templates (optional but recommended)

**Authentication → Email Templates → Reset Password.** The default `{{ .ConfirmationURL }}` works, but the link will redirect through Supabase first. To deep-link straight back to the app:

Replace the link with:
```
{{ .SiteURL }}/reset-password?token_hash={{ .TokenHash }}&type=recovery
```

Same for **Confirm signup** template:
```
{{ .SiteURL }}/auth-callback?token_hash={{ .TokenHash }}&type=signup
```

### 2.4 Apply the database migration

1. Sidebar → **SQL Editor** → **New query**.
2. Open [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) from this repo, copy the whole file, paste into the SQL Editor.
3. Click **Run**.

This creates:
- `public.profiles` table (one row per user, holds `is_pro` entitlement)
- RLS policies so users only read/update their own row
- A trigger that prevents users from setting `is_pro` themselves (only the service role can — used later by the receipt-verify Edge Function)
- A trigger that auto-creates a `profiles` row when someone signs up

---

## Step 3 — Drop values into `.env`

Open `.env` at the project root and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://lfdfovmvtkxdtjgntwzq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ... (already there)

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxxxxxxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxxxxxxxxxxxxx.apps.googleusercontent.com
```

**Restart Metro** after editing `.env` (`r` in the dev server, or kill+restart) — Expo only reads `.env` at startup.

---

## Step 4 — Sanity check

After restarting:
1. Launch the app → you'll see the **Sign in** screen instead of going straight to tabs.
2. Try **Continue with Google** → opens browser → pick your test Google account → returns to app, signed in.
3. Try **Create account** with email/password → check the inbox for the verification link → tap it → should deep-link back into the app, signed in.

If Google sign-in fails with `redirect_uri_mismatch`: re-check Step 1.3 (the redirect URI must be exactly `https://lfdfovmvtkxdtjgntwzq.supabase.co/auth/v1/callback`, no trailing slash).

If the email link opens a browser tab instead of the app: re-check Step 2.2 (Site URL must use the `uriscanai://` scheme).

---

## What this setup does NOT include

- **Receipt verification Edge Function** (Phase 3). After this setup, signing in works and `is_pro` lives in Supabase, but the app still trusts its local SQLite for entitlement. The Edge Function that updates `is_pro` after a verified Google Play purchase comes next.
- **Account deletion Edge Function** (also Phase 3). The Account screen will have a "Delete Account" button stub that doesn't yet wipe Supabase data.
- **Refund detection / RTDN webhooks** — deferred per earlier decision.
