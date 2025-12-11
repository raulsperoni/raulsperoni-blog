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

    const data = {
      lastUpdated: new Date().toISOString(),
      stats,
      recentActivities: activities,
      athleteId,
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
