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
			// SEO/social image (Open Graph, Twitter). If omitted, heroImage is used.
			ogImage: image().optional(),
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

const goodreads = defineCollection({
	loader: async () => {
		try {
			const dataPath = path.join(process.cwd(), 'src/data/goodreads.json');
			const fileContent = fs.readFileSync(dataPath, 'utf-8');
			const data = JSON.parse(fileContent);
			const activities = data.activities || [];

			return activities.map((item: any) => ({
				id: item.id,
				title: item.bookTitle,
				description: item.author ? `by ${item.author}` : '',
				pubDate: new Date(item.pubDate),
				tags: ['leo 📚'],
				bookTitle: item.bookTitle,
				author: item.author,
				action: item.action,
				rating: item.rating,
				coverImage: item.coverImage,
				goodreadsUrl: item.goodreadsUrl,
			}));
		} catch (error) {
			console.warn('Failed to load Goodreads data:', error);
			return [];
		}
	},
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.date(),
		tags: z.array(z.string()).default([]),
		bookTitle: z.string(),
		author: z.string().nullable(),
		action: z.string(),
		rating: z.number().nullable(),
		coverImage: z.string().nullable(),
		goodreadsUrl: z.string().url(),
	}),
});

const til = defineCollection({
	loader: glob({
		base: './src/content/til',
		pattern: '**/*.{md,mdx}',
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		tags: z.array(z.string()).default([]),
	}),
});

const ingredient = z.object({
	item: z.string(),
	grams: z.number().optional(),
	note: z.string().optional(),
});

// One operation in a Cooking-for-Engineers style table: `add` names the
// ingredients that join the dough here (matched against the phase's ingredient
// list by name), and the cell spans every row introduced so far. Steps with no
// `add` (pliegues, heladera, horno) span the whole table.
const step = z.object({
	do: z.string(),
	time: z.string().optional(),
	add: z.array(z.string()).default([]),
});

const recetas = defineCollection({
	loader: glob({ base: './src/content/recetas', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			heroImage: image().optional(),
			ogImage: image().optional(),
			// Ambient kitchen temperature (°C) — matters for sourdough timing.
			temperatura: z.number().optional(),
			// Baker's hydration, e.g. "72%", when the post states it.
			hidratacion: z.string().optional(),
			// Recipe category for schema.org (Pan, Pizza, Focaccia, ...).
			categoria: z.string().default('Pan'),
			source: z
				.object({
					text: z.string(),
					// absolute (instagram/youtube/…) or internal (/recetas/…)
					url: z.string().optional(),
				})
				.optional(),
			// Structured recipe. Absent for narrative primers (e.g. las-basicas).
			recipe: z
				.object({
					// Levain build / MM feed (pre_receta).
					starter: z.array(ingredient).default([]),
					// Final dough ingredients (receta).
					dough: z.array(ingredient).default([]),
					// Process tables. When present they replace `schedule`:
					// the timings live in the step cells.
					starterProcess: z.array(step).default([]),
					process: z.array(step).default([]),
					// Timeline (itinerario), for recipes with no `process` yet.
					// Empty step = day separator.
					schedule: z
						.array(z.object({ time: z.string(), step: z.string() }))
						.default([]),
				})
				.optional(),
			tags: z.array(z.string()).default([]),
		}),
});

const cv = defineCollection({
	loader: glob({
		base: './src/content/cv',
		pattern: '**/*.{md,mdx}',
	}),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		lang: z.string(),
		name: z.string(),
		role: z.string(),
		location: z.string(),
		updated: z.string(),
		contact: z.array(
			z.object({
				label: z.string(),
				value: z.string(),
				url: z.string().url().optional(),
			}),
		),
		focus: z.array(z.string()).default([]),
		languages: z.array(z.string()).default([]),
	}),
});

export const collections = { blog, links, strava, goodreads, til, cv, recetas };
