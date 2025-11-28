# Migrating from Ghost

This guide will help you import all your existing Ghost blog posts into your new Astro blog.

## Quick Start

### Step 1: Export from Ghost

1. Go to your Ghost Admin panel: https://raulsperoni.me/ghost/
2. Navigate to **Settings → Labs**
3. Scroll to **Export**
4. Click **Export** button
5. Download the JSON file (usually named like `raulsperoni-me.ghost.2025-11-27.json`)

### Step 2: Run Migration

1. Move the downloaded JSON file to the `scripts/` folder:
   ```bash
   mv ~/Downloads/raulsperoni-me.ghost.*.json /Users/raulsperoni/Projects/blog/scripts/ghost-export.json
   ```

2. Run the migration script:
   ```bash
   npm run migrate
   ```

3. The script will:
   - Read all published posts from the Ghost export
   - Convert HTML content to Markdown
   - Create proper frontmatter with title, description, date
   - Include tags and hero images
   - Save each post as a `.md` file in `src/content/blog/`

### Step 3: Review & Test

1. Check the migrated posts:
   ```bash
   ls -l src/content/blog/
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Visit http://localhost:4321 to preview

4. Check each post for:
   - ✅ Proper formatting
   - ✅ Images loading correctly
   - ✅ Links working
   - ✅ Code blocks formatted properly

### Step 4: Migrate Images (Recommended)

Ghost images will still reference the Ghost CDN. You should download them locally:

```bash
npm run migrate:images
```

This script will:
- ✅ Scan all migrated posts for image URLs
- ✅ Download images from Ghost CDN
- ✅ Save to `public/images/`
- ✅ Update markdown files to reference local images
- ✅ Handle both hero images and content images
- ✅ Avoid duplicate downloads

**Alternative: Keep Ghost CDN links**
If you prefer to keep images on Ghost CDN (not recommended):
- Images work as long as Ghost blog is live
- No control over assets
- Slower loading from external CDN

### Step 5: Clean Up Demo Posts

Remove the Astro demo posts:
```bash
cd src/content/blog
rm first-post.md second-post.md third-post.md using-mdx.mdx markdown-style-guide.md
```

### Step 6: Deploy

Once you're happy with the migration:

```bash
git add .
git commit -m "Migrate posts from Ghost"
git push
```

GitHub Actions will deploy your site with all your Ghost content!

## What Gets Migrated

✅ Post title
✅ Post content (HTML → Markdown)
✅ Publication date
✅ Meta description / excerpt
✅ Featured/hero images
✅ Tags
✅ Post slugs (for URLs)

❌ Draft posts (skipped)
❌ Comments (Ghost doesn't include in export)
❌ User/author info (can be added manually if needed)

## Troubleshooting

### "Ghost export file not found"
Make sure you saved the JSON file as `scripts/ghost-export.json`

### "File exists, skipping"
The script won't overwrite existing files. Delete the file first if you want to re-migrate.

### Images not loading
Check if image URLs are correct. Ghost images will be absolute URLs to your Ghost CDN.

### Formatting issues
Some HTML might not convert perfectly to Markdown. Review and fix manually:
- Complex tables
- Embedded content (YouTube, etc.)
- Custom HTML/CSS

### Code blocks not formatting
Check that code blocks have proper language tags:
\`\`\`javascript
// code here
\`\`\`

## Advanced: Custom Migration

If you need to customize the migration (e.g., change date format, add custom frontmatter):

Edit `scripts/migrate-from-ghost.js`:
- `createFrontmatter()` - Modify frontmatter fields
- `convertPost()` - Change conversion logic
- Add custom turndown rules for specific HTML elements

## After Migration

Once migration is complete and you've tested everything:

1. ✅ Keep Ghost blog running temporarily (as backup)
2. ✅ Set up DNS to point raulsperoni.me to GitHub Pages
3. ✅ Update any external links to your blog
4. ✅ Submit new sitemap to search engines
5. ✅ Consider setting up redirects from old Ghost URLs if needed

Your content is now safe in Git forever!
