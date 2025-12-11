/**
 * Fetches Strava athlete stats and recent activities
 * Saves data to src/data/strava.json for static site generation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  if (!response.ok) {
    throw new Error(
      `Failed to refresh token: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.access_token;
}

async function getAthleteId(accessToken) {
  const response = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch athlete: ${response.status} ${response.statusText}`
    );
  }

  const athlete = await response.json();
  return athlete.id;
}

async function getAthleteStats(accessToken, athleteId) {
  const response = await fetch(
    `https://www.strava.com/api/v3/athletes/${athleteId}/stats`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    console.warn(
      `Failed to fetch stats: ${response.status} ${response.statusText}`
    );
    return null;
  }

  return response.json();
}

async function getRecentActivities(accessToken, perPage = 20) {
  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Activities API error:', errorData);

    if (response.status === 401) {
      throw new Error(
        'Failed to fetch activities: 401 Unauthorized. ' +
        'Your refresh token may not have the "activity:read_all" scope. ' +
        'Run: node scripts/setup-strava-oauth.js to get a new token.'
      );
    }

    throw new Error(
      `Failed to fetch activities: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

async function main() {
  try {
    console.log('Fetching Strava data...');

    const accessToken = await refreshAccessToken();
    console.log('✓ Access token refreshed');

    const athleteId = await getAthleteId(accessToken);
    console.log(`✓ Athlete ID: ${athleteId}`);

    const [stats, activities] = await Promise.all([
      getAthleteStats(accessToken, athleteId),
      getRecentActivities(accessToken, 20),
    ]);

    console.log(`✓ Fetched ${activities.length} recent activities`);
    if (stats) {
      console.log('✓ Fetched athlete stats');
    }

    // Privacy filter: Strip sensitive location and time data from activities
    // Intentionally removing:
    // - GPS coordinates (start_latlng, end_latlng, map polyline)
    // - Exact time of day (keeping only the date)
    // - Location names that could reveal home/work addresses
    const sanitizedActivities = activities.map(activity => {
      const activityDate = new Date(activity.start_date_local);
      // Strip time, keep only date
      const dateOnly = activityDate.toISOString().split('T')[0];

      return {
        id: activity.id,
        name: activity.name,
        distance: activity.distance,
        moving_time: activity.moving_time,
        elapsed_time: activity.elapsed_time,
        total_elevation_gain: activity.total_elevation_gain,
        type: activity.type,
        sport_type: activity.sport_type,
        start_date_local: `${dateOnly}T00:00:00Z`,
        // Explicitly omitting: start_latlng, end_latlng, map, location_city,
        // location_state, location_country, timezone, and other location data
      };
    });

    const data = {
      lastUpdated: new Date().toISOString(),
      stats,
      recentActivities: sanitizedActivities,
      athleteId,
      // Privacy notice for transparency
      _privacy_note: 'GPS coordinates, exact activity times, and location names have been removed for privacy',
    };

    const dataDir = path.join(__dirname, '../src/data');
    const outputPath = path.join(dataDir, 'strava.json');

    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

    console.log(`✓ Saved to ${outputPath}`);
    console.log('Done!');
  } catch (error) {
    console.error('Error fetching Strava data:', error);
    process.exit(1);
  }
}

main();
