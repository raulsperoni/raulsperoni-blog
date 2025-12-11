/**
 * Helper script to complete Strava OAuth flow
 *
 * Step 1: Run this script with your client ID:
 *   node scripts/setup-strava-oauth.js <client_id>
 *
 * Step 2: Visit the URL provided and authorize
 *
 * Step 3: Copy the 'code' from the redirect URL
 *
 * Step 4: Run this script with the code:
 *   node scripts/setup-strava-oauth.js <client_id> <client_secret> <code>
 */

const clientId = process.argv[2];
const clientSecret = process.argv[3];
const code = process.argv[4];

if (!clientId) {
  console.error('Usage:');
  console.error('  Step 1: node scripts/setup-strava-oauth.js <client_id>');
  console.error('  Step 2: Visit the URL and authorize');
  console.error('  Step 3: node scripts/setup-strava-oauth.js <client_id> <client_secret> <code>');
  process.exit(1);
}

if (!clientSecret || !code) {
  console.log('\n=== Step 1: Authorize your application ===\n');
  console.log('Visit this URL to authorize:\n');
  console.log(`https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all\n`);
  console.log('After authorizing, you will be redirected to a URL like:');
  console.log('  http://localhost/?state=&code=XXXXXXXXXXXXXXX&scope=read,activity:read_all\n');
  console.log('Copy the code parameter from that URL.\n');
  console.log('Then run:');
  console.log(`  node scripts/setup-strava-oauth.js ${clientId} <client_secret> <code>\n`);
  process.exit(0);
}

console.log('\n=== Step 2: Exchange code for tokens ===\n');
console.log('Exchanging authorization code for access token...');

fetch('https://www.strava.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
  }),
})
  .then(response => response.json())
  .then(data => {
    if (data.errors) {
      console.error('Error:', data);
      process.exit(1);
    }

    console.log('✓ Success!\n');
    console.log('Add these to your GitHub Secrets:\n');
    console.log('STRAVA_CLIENT_ID:', clientId);
    console.log('STRAVA_CLIENT_SECRET:', clientSecret);
    console.log('STRAVA_REFRESH_TOKEN:', data.refresh_token);
    console.log('\nYou can also test locally by setting these environment variables:');
    console.log(`export STRAVA_CLIENT_ID="${clientId}"`);
    console.log(`export STRAVA_CLIENT_SECRET="${clientSecret}"`);
    console.log(`export STRAVA_REFRESH_TOKEN="${data.refresh_token}"`);
    console.log('\nAthlete:', data.athlete.firstname, data.athlete.lastname);
    console.log('Token expires:', new Date(data.expires_at * 1000).toISOString());
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
