import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import fs from 'node:fs';
import path from 'node:path';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			tags: z.array(z.string()).default([]),
		}),
});

const links = defineCollection({
	// Load Markdown files in the `src/content/links/` directory.
	loader: glob({ base: './src/content/links', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			url: z.string().url(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			// Optional SEO metadata
			ogImage: z.string().url().optional(),
			favicon: z.string().url().optional(),
			siteName: z.string().optional(),
			// Image for the link (can be screenshot or custom)
			linkImage: image().optional(),
			tags: z.array(z.string()).default([]),
		}),
});

const strava = defineCollection({
	loader: async () => {
		try {
			const dataPath = path.join(process.cwd(), 'src/data/strava.json');
			const fileContent = fs.readFileSync(dataPath, 'utf-8');
			const stravaData = JSON.parse(fileContent);
			const activities = stravaData.recentActivities || [];

			return activities.map((activity: any) => {
				const date = new Date(activity.start_date_local);
				const distanceKm = (activity.distance / 1000).toFixed(1);
				const timeMinutes = Math.round(activity.moving_time / 60);

				return {
					id: activity.id.toString(),
					title: activity.name,
					description: `${distanceKm} km in ${timeMinutes} minutes`,
					pubDate: date,
					tags: ['corro 🏃'],
					distance: activity.distance,
					movingTime: activity.moving_time,
					elevationGain: activity.total_elevation_gain,
					sportType: activity.sport_type || activity.type,
					stravaUrl: `https://www.strava.com/activities/${activity.id}`,
				};
			});
		} catch (error) {
			console.warn('Failed to load Strava data:', error);
			return [];
		}
	},
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.date(),
		tags: z.array(z.string()).default([]),
		distance: z.number(),
		movingTime: z.number(),
		elevationGain: z.number(),
		sportType: z.string(),
		stravaUrl: z.string().url(),
	}),
});

export const collections = { blog, links, strava };
