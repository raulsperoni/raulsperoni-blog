# Strava Integration Setup

This guide walks you through setting up Strava API integration for your blog.

## Prerequisites

1. A Strava account with activity data
2. Access to your GitHub repository settings

## Step 1: Create a Strava API Application

1. Go to https://www.strava.com/settings/api
2. Click "Create an App" (or use an existing app)
3. Fill in the required fields:
   - **Application Name**: Your blog name
   - **Category**: Choose appropriate category
   - **Club**: Leave blank (optional)
   - **Website**: https://raulsperoni.me
   - **Authorization Callback Domain**: localhost
4. Click "Create"
5. Note your **Client ID** and **Client Secret**

## Step 2: Get Your Refresh Token

Since this is a static site, you need to do a one-time OAuth flow to get a refresh token with the `activity:read_all` scope. The refresh token never expires and will be used by the GitHub Action to fetch fresh data.

### Option A: Using the HTML Tool (Easiest)

1. Open the OAuth helper in your browser:
   ```bash
   open scripts/strava-oauth.html
   ```

2. Enter your Client ID and Client Secret from Step 1

3. Click "Generate Authorization URL" and click the link to authorize

4. After authorizing on Strava, you'll be redirected to a URL that won't load (this is expected!)

5. Copy the entire redirect URL from your browser's address bar (it starts with `http://localhost/?state=&code=...`)

6. Paste it into the form and click "Get Refresh Token"

7. Copy the three secrets shown (Client ID, Client Secret, and Refresh Token)

### Option B: Using the Node.js Script

1. Run the OAuth helper script with your Client ID:
   ```bash
   node scripts/setup-strava-oauth.js YOUR_CLIENT_ID
   ```

2. Open the provided URL in your browser and authorize the application
   - Make sure you see `scope=activity:read_all` in the URL
   - This scope is required to read your activities

3. After authorizing, you'll be redirected to a URL like:
   ```
   http://localhost/?state=&code=XXXXXXXXXXXXXXX&scope=read,activity:read_all
   ```

4. Copy the `code` parameter and run:
   ```bash
   node scripts/setup-strava-oauth.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET COPIED_CODE
   ```

5. The script will output your refresh token

### Option C: Manual OAuth Flow

1. Visit this URL (replace YOUR_CLIENT_ID):
   ```
   https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
   ```

2. Authorize the application

3. From the redirect URL, copy the `code` parameter

4. Exchange the code for a refresh token using curl:
   ```bash
   curl -X POST https://www.strava.com/oauth/token \
     -d client_id=YOUR_CLIENT_ID \
     -d client_secret=YOUR_CLIENT_SECRET \
     -d code=YOUR_CODE \
     -d grant_type=authorization_code
   ```

5. The response will include your `refresh_token`

## Step 3: Add GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret" and add these three secrets:
   - `STRAVA_CLIENT_ID`: Your Client ID from Step 1
   - `STRAVA_CLIENT_SECRET`: Your Client Secret from Step 1
   - `STRAVA_REFRESH_TOKEN`: Your Refresh Token from Step 2

## Step 4: Test Locally (Optional)

Set environment variables and test the script:

```bash
export STRAVA_CLIENT_ID="your_client_id"
export STRAVA_CLIENT_SECRET="your_client_secret"
export STRAVA_REFRESH_TOKEN="your_refresh_token"

# Test with detailed diagnostics
node scripts/test-strava-local.js

# Or test the actual fetch script
node scripts/fetch-strava.js
```

## Step 5: Deploy

Commit and push your changes:

```bash
git add .
git commit -m "Add Strava integration"
git push
```

The GitHub Action will:
1. Fetch your Strava data automatically
2. Build the site with the latest data
3. Deploy to GitHub Pages

Your fitness stats will be available at: https://raulsperoni.me/fitness

## Automatic Updates

The workflow runs:
- On every push to `master`
- Daily at 3 AM UTC (via cron schedule)
- Manually via workflow dispatch

## Troubleshooting

### 401 Unauthorized Error

This means your refresh token doesn't have the correct scope. You need to:

1. Go to https://www.strava.com/settings/api
2. Find your application under "My API Application"
3. Revoke access (or delete and recreate the authorization)
4. Run the OAuth flow again with the correct scope (Step 2)
5. Update your GitHub secret with the new refresh token

### No Activities Showing

Check that:
- Your Strava account has public activities
- The refresh token was obtained with `activity:read_all` scope
- The GitHub Action completed successfully (check Actions tab)

### Rate Limits

Strava API has rate limits:
- 100 requests per 15 minutes
- 1000 requests per day

The daily cron job should stay well within these limits.

## Data Privacy

- All API credentials are stored as GitHub Secrets (encrypted)
- Only aggregated stats and recent activities are published
- No personal data (like heart rate, power, etc.) is exposed
- You can adjust what data is displayed by editing `src/pages/fitness.astro`
