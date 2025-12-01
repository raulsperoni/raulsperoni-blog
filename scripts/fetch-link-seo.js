#!/usr/bin/env node

/**
 * Fetch SEO metadata from a URL and create a link markdown file
 * Usage: node scripts/fetch-link-seo.js <url> [slug]
 *
 * This script fetches Open Graph tags, meta description, and favicon
 * from a given URL and creates a markdown file in src/content/links/
 */

import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function fetchHTML(url) {
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; LinkFetcher/1.0)'
		}
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return await response.text();
}

function extractMetaTags(html) {
	const metadata = {
		title: '',
		description: '',
		ogImage: '',
		siteName: '',
		favicon: ''
	};

	// Extract title
	const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	if (titleMatch) {
		metadata.title = titleMatch[1].trim();
	}

	// Extract Open Graph title
	const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
	if (ogTitleMatch) {
		metadata.title = ogTitleMatch[1].trim();
	}

	// Extract description
	const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
	if (descMatch) {
		metadata.description = descMatch[1].trim();
	}

	// Extract Open Graph description
	const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
	if (ogDescMatch) {
		metadata.description = ogDescMatch[1].trim();
	}

	// Extract Open Graph image
	const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
	if (ogImageMatch) {
		metadata.ogImage = ogImageMatch[1].trim();
	}

	// Extract Open Graph site name
	const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i);
	if (ogSiteMatch) {
		metadata.siteName = ogSiteMatch[1].trim();
	}

	// Extract favicon
	const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i);
	if (faviconMatch) {
		metadata.favicon = faviconMatch[1].trim();
	}

	return metadata;
}

function slugify(text) {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function createMarkdown(url, metadata, tags = []) {
	const today = new Date().toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});

	const frontmatter = {
		title: metadata.title || 'Untitled Link',
		url: url,
		description: metadata.description || '',
		pubDate: today,
		...(metadata.ogImage && { ogImage: metadata.ogImage }),
		...(metadata.favicon && { favicon: resolveUrl(url, metadata.favicon) }),
		...(metadata.siteName && { siteName: metadata.siteName }),
		...(tags.length > 0 && { tags: tags })
	};

	const yaml = Object.entries(frontmatter)
		.map(([key, value]) => {
			if (Array.isArray(value)) {
				return `${key}: [${value.map(v => `'${v}'`).join(', ')}]`;
			}
			return `${key}: '${value.replace(/'/g, "''")}'`;
		})
		.join('\n');

	return `---\n${yaml}\n---\n\nAdd your notes about this link here.\n`;
}

function resolveUrl(baseUrl, path) {
	try {
		return new URL(path, baseUrl).toString();
	} catch {
		return path;
	}
}

async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error('Usage: node scripts/fetch-link-seo.js <url> [slug] [tags...]');
		console.error('Example: node scripts/fetch-link-seo.js https://example.com my-link web development');
		process.exit(1);
	}

	const url = args[0];
	let slug = args[1];
	const tags = args.slice(2);

	console.log(`Fetching metadata from: ${url}`);

	try {
		const html = await fetchHTML(url);
		const metadata = extractMetaTags(html);

		if (!slug) {
			slug = slugify(metadata.title || new URL(url).hostname);
		}

		const markdown = createMarkdown(url, metadata, tags);
		const filePath = join(__dirname, '..', 'src', 'content', 'links', `${slug}.md`);

		await writeFile(filePath, markdown, 'utf-8');

		console.log('\nLink created successfully!');
		console.log(`File: src/content/links/${slug}.md`);
		console.log(`\nMetadata found:`);
		console.log(`  Title: ${metadata.title}`);
		console.log(`  Description: ${metadata.description.slice(0, 100)}${metadata.description.length > 100 ? '...' : ''}`);
		if (metadata.siteName) console.log(`  Site: ${metadata.siteName}`);
		if (metadata.ogImage) console.log(`  Image: ${metadata.ogImage}`);
		if (metadata.favicon) console.log(`  Favicon: ${resolveUrl(url, metadata.favicon)}`);
		if (tags.length > 0) console.log(`  Tags: ${tags.join(', ')}`);

	} catch (error) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

main();
