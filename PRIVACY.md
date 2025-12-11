# Privacy & Security

## Strava Data Privacy

The Strava integration includes built-in privacy protections to ensure sensitive location and timing data is never stored in the repository or published to the website.

### What Gets Removed

The `scripts/fetch-strava.js` script automatically strips the following sensitive information before saving data:

**Location Data:**
- GPS coordinates (`start_latlng`, `end_latlng`)
- Route maps and polylines (`map.summary_polyline`)
- City, state, and country names (`location_city`, `location_state`, `location_country`)
- Timezone information

**Timing Data:**
- Exact time of day (hour and minutes)
- Only the date is preserved (e.g., `2025-12-10T00:00:00Z` instead of `2025-12-10T16:04:29Z`)

**Other Sensitive Data:**
- Device names
- Heart rate data
- Power data (watts)
- Cadence information
- Personal records and achievements
- Kudos and comments
- Suffer scores

### What's Kept (Public Data)

The following aggregate and non-sensitive information is preserved:

- Activity name (as entered in Strava)
- Date (without time)
- Distance in meters
- Moving time and elapsed time in seconds
- Total elevation gain in meters
- Activity type (Run, Ride, Swim, etc.)
- Sport type (more specific categorization)

### Why This Matters

Publishing GPS coordinates and exact activity times can reveal:
- Home and work addresses (start/end points)
- Daily routines and schedules
- Routes you frequently take
- When your home is unoccupied

By stripping this data **before** it's committed to Git, we ensure:
- No sensitive data in Git history
- No accidental exposure through repository access
- Privacy is maintained even if the repository becomes public
- Data can't be reconstructed from commit history

### Implementation Details

The privacy filter is applied in [scripts/fetch-strava.js](scripts/fetch-strava.js:127-159):

```javascript
// Privacy filter: Strip sensitive location and time data from activities
const sanitizedActivities = activities.map(activity => {
  const activityDate = new Date(activity.start_date_local);
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
    // GPS and location data explicitly omitted
  };
});
```

The sanitized data is saved to [src/data/strava.json](src/data/strava.json) with a privacy notice included in the JSON.

### Verification

You can verify the privacy protection by inspecting `src/data/strava.json`:
- Check that no `start_latlng` or `end_latlng` fields exist
- Verify all timestamps end with `T00:00:00Z`
- Confirm no `map.summary_polyline` data is present
- Look for the `_privacy_note` field confirming sanitization

### Additional Considerations

If you want to display more or less information on your public site, you can:
1. Adjust the sanitization in `scripts/fetch-strava.js`
2. Modify what's displayed in `src/pages/fitness.astro` and `src/pages/index.astro`
3. The raw Strava data is never committed - only sanitized data

API credentials (Client ID, Secret, Refresh Token) are stored as GitHub Secrets and never committed to the repository.
