/**
 * Local test script for Strava API
 * Usage: node scripts/test-strava-local.js
 *
 * Set environment variables before running:
 * export STRAVA_CLIENT_ID="your_client_id"
 * export STRAVA_CLIENT_SECRET="your_client_secret"
 * export STRAVA_REFRESH_TOKEN="your_refresh_token"
 */

async function refreshAccessToken() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Strava credentials. Set STRAVA_CLIENT_ID, ' +
      'STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN'
    );
  }

  console.log('Refreshing access token...');
  console.log('Client ID:', clientId);
  console.log('Refresh token (first 10 chars):', refreshToken.substring(0, 10) + '...');

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Token refresh failed:', data);
    throw new Error(
      `Failed to refresh token: ${response.status} ${response.statusText}`
    );
  }

  console.log('✓ Token refreshed successfully');
  console.log('Token expires at:', new Date(data.expires_at * 1000).toISOString());
  console.log('Scopes:', data.scope || 'No scope info (may be the issue!)');

  return data.access_token;
}

async function testEndpoint(url, accessToken, name) {
  console.log(`\nTesting ${name}...`);
  console.log(`URL: ${url}`);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`✗ ${name} failed (${response.status}):`, data);
    return null;
  }

  console.log(`✓ ${name} succeeded`);
  return data;
}

async function main() {
  try {
    console.log('=== Strava API Test ===\n');

    const accessToken = await refreshAccessToken();

    const athlete = await testEndpoint(
      'https://www.strava.com/api/v3/athlete',
      accessToken,
      'Get Athlete'
    );

    if (athlete) {
      console.log(`  Athlete: ${athlete.firstname} ${athlete.lastname}`);
      console.log(`  ID: ${athlete.id}`);

      const stats = await testEndpoint(
        `https://www.strava.com/api/v3/athletes/${athlete.id}/stats`,
        accessToken,
        'Get Stats'
      );

      if (stats) {
        console.log(`  YTD Run Distance: ${(stats.ytd_run_totals.distance / 1000).toFixed(1)} km`);
        console.log(`  YTD Ride Distance: ${(stats.ytd_ride_totals.distance / 1000).toFixed(1)} km`);
      }

      const activities = await testEndpoint(
        'https://www.strava.com/api/v3/athlete/activities?per_page=5',
        accessToken,
        'Get Recent Activities'
      );

      if (activities && activities.length > 0) {
        console.log(`  Found ${activities.length} activities:`);
        activities.slice(0, 3).forEach((act, i) => {
          console.log(`    ${i + 1}. ${act.name} - ${(act.distance / 1000).toFixed(1)} km`);
        });
      }
    }

    console.log('\n=== Test Complete ===');
    console.log('\nIf you see 401 errors, your refresh token may not have the correct scopes.');
    console.log('Required scopes: activity:read_all');
    console.log('\nTo fix:');
    console.log('1. Go to https://www.strava.com/settings/api');
    console.log('2. Delete your application authorization');
    console.log('3. Re-authorize with the correct scope using this URL:');
    console.log(`   https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all`);
    console.log('4. Exchange the code for a new refresh token');

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    process.exit(1);
  }
}

main();
