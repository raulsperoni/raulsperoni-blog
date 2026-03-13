/**
 * Fetches Goodreads RSS feed and saves to src/data/goodreads.json
 * No OAuth needed — public RSS feed with key.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSS_URL = process.env.GOODREADS_RSS_URL ||
  'https://www.goodreads.com/user/updates_rss/10411327?key=qdJhCg_LPDvPb__lMqZP6RSkXMjYFFhYeBe2SZlMPag_Zyaw';

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`));
  return match ? match[1].trim() : '';
}

function extractCDATA(xml, tag) {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`)
  );
  return match ? match[1].trim() : null;
}

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      guid: extractTag(itemXml, 'guid'),
      pubDate: extractTag(itemXml, 'pubDate'),
      title: extractCDATA(itemXml, 'title') || extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link') || (itemXml.match(/<link\s*\/>[\s]*([^\s<]+)/) || [])[1] || '',
      description: extractCDATA(itemXml, 'description') || extractTag(itemXml, 'description'),
    });
  }
  return items;
}

function parseBookTitle(titleText) {
  const match = titleText.match(/'([^']+)'/);
  return match ? match[1] : titleText;
}

function parseAction(titleText) {
  const t = titleText.toLowerCase();
  if (t.includes('started reading')) return 'reading';
  if (t.includes('marked as abandoned')) return 'abandoned';
  if (t.includes('wants to read')) return 'want';
  if (t.includes('finished reading')) return 'read';
  if (t.includes('added')) return 'read';
  return 'activity';
}

function parseRating(description) {
  const match = description.match(/gave (\d) star/i);
  if (match) return parseInt(match[1]);
  const stars = (description.match(/★/g) || []).length;
  return stars > 0 ? stars : null;
}

function parseCoverImage(description) {
  const match = description.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

function parseAuthor(description) {
  const match = description.match(/class="authorName"[^>]*>([^<]+)<\/a>/);
  return match ? match[1] : null;
}

async function main() {
  console.log('Fetching Goodreads RSS...');

  const response = await fetch(RSS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const rawItems = parseRSSItems(xml);

  const activities = rawItems.map(item => ({
    id: item.guid,
    bookTitle: parseBookTitle(item.title),
    author: parseAuthor(item.description),
    action: parseAction(item.title),
    rating: parseRating(item.description),
    coverImage: parseCoverImage(item.description),
    pubDate: new Date(item.pubDate).toISOString(),
    goodreadsUrl: item.link,
  }));

  // Load existing data and merge by ID so old entries are preserved
  const outPath = path.join(__dirname, '../src/data/goodreads.json');
  let existingActivities = [];
  try {
    const existing = JSON.parse(await fs.readFile(outPath, 'utf-8'));
    existingActivities = existing.activities || [];
  } catch {
    // file doesn't exist yet, start fresh
  }

  const byId = new Map(existingActivities.map(a => [a.id, a]));
  for (const a of activities) {
    byId.set(a.id, a);
  }
  const mergedActivities = [...byId.values()].sort(
    (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
  );

  console.log(`Merged: ${activities.length} new + ${existingActivities.length} existing = ${mergedActivities.length} total`);

  const output = {
    lastUpdated: new Date().toISOString(),
    activities: mergedActivities,
  };

  await fs.writeFile(outPath, JSON.stringify(output, null, 2));
  console.log(`Saved ${mergedActivities.length} Goodreads activities to src/data/goodreads.json`);
  activities.slice(0, 3).forEach(a =>
    console.log(`  [${a.action}] "${a.bookTitle}" by ${a.author} (${a.pubDate.slice(0, 10)})`)
  );
}

main().catch(err => {
  console.error('Error fetching Goodreads data:', err);
  process.exit(1);
});
