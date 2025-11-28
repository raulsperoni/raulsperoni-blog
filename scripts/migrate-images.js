#!/usr/bin/env node

/**
 * Ghost Images Migration Script
 *
 * Downloads all images referenced in blog posts from Ghost CDN
 * and updates markdown files to use local images.
 *
 * Usage: node scripts/migrate-images.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

// Your Ghost blog URL (change if different)
const GHOST_URL = 'https://raulsperoni.me';

// Track downloaded images to avoid duplicates
const downloadedImages = new Map();
let downloadCount = 0;
let errorCount = 0;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

function extractImageUrls(content) {
  const urls = [];

  // Extract markdown images: ![alt](url)
  const mdImageRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
  let match;
  while ((match = mdImageRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  // Extract HTML images: <img src="url">
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/g;
  while ((match = htmlImageRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

function extractFrontmatterImage(content) {
  const heroImageMatch = content.match(/heroImage:\s*['"]([^'"]+)['"]/);
  return heroImageMatch ? heroImageMatch[1] : null;
}

function generateLocalImagePath(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;

  // Extract filename from URL
  let filename = path.basename(pathname);

  // If no extension, try to get from URL or default to jpg
  if (!path.extname(filename)) {
    filename += '.jpg';
  }

  // Create a unique filename if it already exists
  let localPath = path.join(IMAGES_DIR, filename);
  let counter = 1;
  while (fs.existsSync(localPath) && !downloadedImages.has(url)) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    filename = `${base}-${counter}${ext}`;
    localPath = path.join(IMAGES_DIR, filename);
    counter++;
  }

  return { localPath, filename };
}

async function processMarkdownFile(filepath) {
  console.log(`\nProcessing: ${path.basename(filepath)}`);

  let content = fs.readFileSync(filepath, 'utf8');

  // Replace __GHOST_URL__ placeholders with actual Ghost URL
  if (content.includes('__GHOST_URL__')) {
    content = content.replace(/__GHOST_URL__/g, GHOST_URL);
    console.log('  🔧 Replaced __GHOST_URL__ placeholders');
  }

  let updatedContent = content;
  const imagesToDownload = [];

  // Extract frontmatter hero image
  const heroImageUrl = extractFrontmatterImage(content);
  if (heroImageUrl && heroImageUrl.startsWith('http')) {
    imagesToDownload.push({ url: heroImageUrl, type: 'hero' });
  }

  // Extract content images
  const contentImageUrls = extractImageUrls(content);
  contentImageUrls.forEach(url => {
    if (url.startsWith('http')) {
      imagesToDownload.push({ url, type: 'content' });
    }
  });

  if (imagesToDownload.length === 0) {
    console.log('  No external images found');
    return;
  }

  console.log(`  Found ${imagesToDownload.length} image(s) to download`);

  // Download and update references
  for (const { url, type } of imagesToDownload) {
    let localFilename;

    // Check if already downloaded
    if (downloadedImages.has(url)) {
      localFilename = downloadedImages.get(url);
      console.log(`  ♻️  Reusing: ${localFilename}`);
    } else {
      // Download image
      const { localPath, filename } = generateLocalImagePath(url);

      try {
        console.log(`  ⬇️  Downloading: ${filename}`);
        await downloadImage(url, localPath);
        downloadedImages.set(url, filename);
        localFilename = filename;
        downloadCount++;
        console.log(`  ✅ Saved: ${filename}`);
      } catch (error) {
        console.error(`  ❌ Failed to download ${url}: ${error.message}`);
        errorCount++;
        continue;
      }
    }

    // Update content
    const localUrl = `/images/${localFilename}`;

    if (type === 'hero') {
      updatedContent = updatedContent.replace(
        new RegExp(`heroImage:\\s*['"]${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`),
        `heroImage: '${localUrl}'`
      );
    }

    // Replace in markdown and HTML
    updatedContent = updatedContent.replace(
      new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      localUrl
    );
  }

  // Write updated content
  if (updatedContent !== content) {
    fs.writeFileSync(filepath, updatedContent, 'utf8');
    console.log('  📝 Updated markdown file');
  }
}

async function main() {
  console.log('Ghost Images Migration Tool\n');

  // Ensure directories exist
  ensureDir(IMAGES_DIR);

  // Get all markdown files
  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
    .map(f => path.join(BLOG_DIR, f));

  console.log(`Found ${files.length} markdown file(s)\n`);

  // Process each file
  for (const file of files) {
    await processMarkdownFile(file);
  }

  console.log('\n✨ Image migration complete!');
  console.log(`   Downloaded: ${downloadCount} images`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Images saved to: ${IMAGES_DIR}`);

  if (downloadCount > 0) {
    console.log('\nNext steps:');
    console.log('1. Test the site: npm run dev');
    console.log('2. Check images are loading correctly');
    console.log('3. Commit and push: git add . && git commit -m "Migrate images locally" && git push');
  }
}

main().catch(console.error);
