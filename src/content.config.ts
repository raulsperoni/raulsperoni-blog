import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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

export const collections = { blog, links };
