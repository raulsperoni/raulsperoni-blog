import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BSKY_API = 'https://bsky.social/xrpc';
const SITE_URL = process.env.SITE_URL || 'https://raulsperoni.me';
const HANDLE = process.env.BLUESKY_HANDLE;
const PASSWORD = process.env.BLUESKY_APP_PASSWORD;

if (!HANDLE || !PASSWORD) {
	console.log('Missing BLUESKY_HANDLE or BLUESKY_APP_PASSWORD, skipping.');
	process.exit(0);
}

function getNewContentFiles() {
	try {
		const base = process.env.PUSH_BEFORE_SHA || 'HEAD~1';
		const diff = execSync(
			`git diff ${base} --diff-filter=A --name-only`,
			{ encoding: 'utf-8' },
		).trim();
		if (!diff) return [];
		return diff
			.split('\n')
			.filter(
				(f) =>
					(f.startsWith('src/content/blog/') ||
						f.startsWith('src/content/til/')) &&
					f.endsWith('.md'),
			);
	} catch {
		console.log('Could not determine new files, skipping.');
		return [];
	}
}

function parseFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return {};
	const fm = {};
	for (const line of match[1].split('\n')) {
		const m = line.match(/^(\w+):\s*'?(.*?)'?\s*$/);
		if (m) fm[m[1]] = m[2];
	}
	return fm;
}

function buildPostText(fm, url, collection) {
	if (collection === 'til') {
		return `${fm.title}\n\n${url}`;
	}
	return `${fm.title}\n\n${fm.description || ''}\n\n${url}`;
}

function getByteOffsets(text, substring) {
	const idx = text.indexOf(substring);
	if (idx === -1) return null;
	const encoder = new TextEncoder();
	const byteStart = encoder.encode(text.slice(0, idx)).length;
	const byteEnd =
		byteStart + encoder.encode(substring).length;
	return { byteStart, byteEnd };
}

async function authenticate() {
	const res = await fetch(
		`${BSKY_API}/com.atproto.server.createSession`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				identifier: HANDLE,
				password: PASSWORD,
			}),
		},
	);
	if (!res.ok) {
		throw new Error(
			`Auth failed: ${res.status} ${await res.text()}`,
		);
	}
	return res.json();
}

async function createPost(session, text, url, title, description) {
	const offsets = getByteOffsets(text, url);
	const record = {
		$type: 'app.bsky.feed.post',
		text,
		createdAt: new Date().toISOString(),
		embed: {
			$type: 'app.bsky.embed.external',
			external: {
				uri: url,
				title,
				description: description || '',
			},
		},
	};

	if (offsets) {
		record.facets = [
			{
				index: offsets,
				features: [
					{
						$type: 'app.bsky.richtext.facet#link',
						uri: url,
					},
				],
			},
		];
	}

	const res = await fetch(
		`${BSKY_API}/com.atproto.repo.createRecord`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${session.accessJwt}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				repo: session.did,
				collection: 'app.bsky.feed.post',
				record,
			}),
		},
	);
	if (!res.ok) {
		throw new Error(
			`Post failed: ${res.status} ${await res.text()}`,
		);
	}
	return res.json();
}

async function main() {
	const files = getNewContentFiles();
	if (files.length === 0) {
		console.log('No new blog/til posts found, skipping.');
		return;
	}

	const session = await authenticate();
	console.log(`Authenticated as ${session.handle}`);

	for (const file of files) {
		const content = readFileSync(resolve(file), 'utf-8');
		const fm = parseFrontmatter(content);
		if (!fm.title) {
			console.log(`Skipping ${file}: no title in frontmatter`);
			continue;
		}

		const isTil = file.startsWith('src/content/til/');
		const collection = isTil ? 'til' : 'blog';
		const slug = file
			.replace(`src/content/${collection}/`, '')
			.replace(/\.mdx?$/, '');
		const url = `${SITE_URL}/${collection}/${slug}/`;

		const text = buildPostText(fm, url, collection);
		const title = fm.title;
		const description = fm.description;

		try {
			const result = await createPost(
				session,
				text,
				url,
				title,
				description,
			);
			console.log(`Posted to Bluesky: ${file} → ${result.uri}`);
		} catch (err) {
			console.error(`Failed to post ${file}:`, err.message);
		}
	}
}

main();
