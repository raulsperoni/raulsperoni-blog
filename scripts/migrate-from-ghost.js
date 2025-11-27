#!/usr/bin/env node

/**
 * Ghost to Astro Migration Script
 *
 * Usage:
 * 1. Export your Ghost blog: Ghost Admin → Settings → Labs → Export
 * 2. Save the JSON file to this directory as 'ghost-export.json'
 * 3. Run: node scripts/migrate-from-ghost.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TurndownService from 'turndown';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GHOST_EXPORT_FILE = path.join(__dirname, 'ghost-export.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');

// Initialize turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});

// Add custom rules for better conversion
turndownService.addRule('images', {
  filter: 'img',
  replacement: (content, node) => {
    const alt = node.getAttribute('alt') || '';
    const src = node.getAttribute('src') || '';
    return `![${alt}](${src})`;
  }
});

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

function createFrontmatter(post) {
  const frontmatter = {
    title: post.title,
    description: post.meta_description || post.excerpt || '',
    pubDate: formatDate(post.published_at || post.created_at),
  };

  // Add optional fields
  if (post.feature_image) {
    frontmatter.heroImage = post.feature_image;
  }

  if (post.tags && post.tags.length > 0) {
    frontmatter.tags = post.tags.map(tag => tag.name);
  }

  // Build frontmatter string
  let frontmatterString = '---\n';
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      frontmatterString += `${key}: [${value.map(v => `'${v}'`).join(', ')}]\n`;
    } else {
      frontmatterString += `${key}: '${value.replace(/'/g, "\\'")}'\n`;
    }
  }
  frontmatterString += '---\n\n';

  return frontmatterString;
}

function convertPost(post) {
  // Convert HTML to Markdown
  const markdown = turndownService.turndown(post.html || '');

  // Create frontmatter
  const frontmatter = createFrontmatter(post);

  // Combine frontmatter and content
  return frontmatter + markdown;
}

function main() {
  console.log('Ghost to Astro Migration Tool\n');

  // Check if export file exists
  if (!fs.existsSync(GHOST_EXPORT_FILE)) {
    console.error(`Error: Ghost export file not found at: ${GHOST_EXPORT_FILE}`);
    console.error('\nPlease:');
    console.error('1. Go to Ghost Admin → Settings → Labs → Export');
    console.error('2. Download the JSON file');
    console.error('3. Save it as: scripts/ghost-export.json');
    console.error('4. Run this script again');
    process.exit(1);
  }

  // Read and parse Ghost export
  console.log('Reading Ghost export file...');
  const exportData = JSON.parse(fs.readFileSync(GHOST_EXPORT_FILE, 'utf8'));

  // Ghost exports are wrapped in a db object
  const posts = exportData.db[0].data.posts || [];
  const tags = exportData.db[0].data.tags || [];
  const postsTags = exportData.db[0].data.posts_tags || [];

  console.log(`Found ${posts.length} posts\n`);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Map tags to posts
  const tagMap = {};
  tags.forEach(tag => {
    tagMap[tag.id] = tag;
  });

  // Process each post
  let migratedCount = 0;
  let skippedCount = 0;

  posts.forEach((post, index) => {
    // Only migrate published posts
    if (post.status !== 'published') {
      console.log(`⏭️  Skipping draft: ${post.title}`);
      skippedCount++;
      return;
    }

    // Add tags to post
    post.tags = postsTags
      .filter(pt => pt.post_id === post.id)
      .map(pt => tagMap[pt.tag_id])
      .filter(tag => tag && tag.visibility === 'public');

    // Convert post
    const content = convertPost(post);

    // Create filename from slug or title
    const filename = `${post.slug || slugify(post.title)}.md`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`⚠️  File exists, skipping: ${filename}`);
      skippedCount++;
      return;
    }

    // Write file
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`✅ Migrated: ${post.title} → ${filename}`);
    migratedCount++;
  });

  console.log(`\n✨ Migration complete!`);
  console.log(`   Migrated: ${migratedCount} posts`);
  console.log(`   Skipped: ${skippedCount} posts`);
  console.log(`\nPosts saved to: ${OUTPUT_DIR}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the migrated posts in src/content/blog/`);
  console.log(`2. Check images are loading correctly`);
  console.log(`3. Test the site: npm run dev`);
  console.log(`4. Commit and push to deploy`);
}

main();
