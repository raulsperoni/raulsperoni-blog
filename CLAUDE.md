# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack & Architecture

**Framework**: Astro v5 static site generator
- **Content**: Markdown/MDX files in `src/content/blog/` (Astro Content Collections)
- **Styling**: Plain CSS in `src/styles/global.css` + scoped styles in `.astro` components
- **Hosting**: GitHub Pages at `raulsperoni.me`
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`) - auto-deploys on push to `master`
- **Writing**: Obsidian (desktop + mobile) with GitHub Sync plugin for auto-commit/push

## Development Commands

```bash
npm run dev            # Dev server at localhost:4321
npm run build          # Production build to dist/
npm run preview        # Preview production build locally
npm run migrate        # Migrate posts from Ghost JSON export
npm run migrate:images # Download Ghost images locally
npm run add-link       # Add a new link with SEO metadata
```

## Content System Architecture

**Content Collections** (`src/content.config.ts`):
- Uses Astro's Content Collections API with glob loader
- Schema validation with Zod
- Two collections: `blog` and `links`

### Blog Posts

**Blog Post Frontmatter** (required fields):
```yaml
---
title: 'Post Title'
description: 'Brief description'
pubDate: 'Nov 27 2025'  # Coerced to Date by schema
heroImage: '../../assets/images/photo.webp'  # Optional, relative path to src/assets
tags: ['tag1', 'tag2']  # Optional array of tags
---
```

**Routing**:
- `src/pages/blog/[...slug].astro` - Dynamic route for all blog posts
- Uses `getStaticPaths()` to generate routes from Content Collections
- Post ID from filename becomes the slug

**Important**: `heroImage` field uses `image()` helper for optimization
- Returns ImageMetadata object with optimized image info
- Enables automatic format conversion, resizing, and lazy loading

### Links Collection

**Link Frontmatter** (required fields):
```yaml
---
title: 'Link Title'
url: 'https://example.com'
description: 'Brief description of the link'
pubDate: 'Dec 01 2025'  # Coerced to Date by schema
tags: ['tag1', 'tag2']  # Optional, uses same tag system as blog posts
# Optional SEO metadata (auto-fetched by add-link script):
ogImage: 'https://example.com/og-image.jpg'
favicon: 'https://example.com/favicon.ico'
siteName: 'Example Site'
linkImage: '../../assets/images/screenshot.webp'  # Optional custom image
---
```

**Routing**:
- `src/pages/links/index.astro` - Links listing page
- `src/pages/links/[...slug].astro` - Individual link pages with notes
- Links can include markdown content below frontmatter for notes/commentary

**Adding Links**:
1. **Automatic** (recommended): `npm run add-link <url> [slug] [tags...]`
   - Fetches title, description, Open Graph image, favicon, and site name
   - Creates markdown file in `src/content/links/`
   - Example: `npm run add-link https://astro.build astro-site web development`
2. **Manual**: Create markdown file in `src/content/links/` with frontmatter above

### Recetas Collection

Recipes render as **Cooking-for-Engineers tables**: ingredients down the left,
operations to the right in cells that span every ingredient they touch, so the
shape of the table is the shape of the process.

```yaml
recipe:
  starter: [{ item: 'Harina Blanca', grams: 400 }, ...]   # masa madre
  dough: [{ item: 'Sal', grams: 18, note: 'opcional' }, ...]
  starterProcess: [{ do: 'mezclar', add: ['Harina Blanca', ...] }, ...]
  process:
    - do: 'horno a 250° con bandeja de agua'   # no `add` and first → prelude row
    - do: 'mezclar'
      time: 'día 1 · 6 a 8 h tras alimentar la MM'
      add: ['Harina Blanca', 'Agua']          # names must match the ingredients
    - do: 'pliegues hasta que crezca 2½'      # no `add` → spans the whole table
      time: '5 h'
```

- Row order comes from the `process`, not from the ingredient list — ingredients
  appear in the order you actually add them.
- Names in `add` must match an ingredient exactly (accents/case forgiven). An
  unknown name, or an ingredient no step adds, **fails the build** on purpose.
- A step with no `add` that comes *before* any adding step becomes a full-width
  prelude row (equipment/oven setup, like the printed tables do).
- Keep each recipe at **≤6 operations**; more and the table scrolls sideways
  even on desktop. Merge related actions into one cell (`time: '40 min a 250°
  + 10 min a 200°'`).
- Grid logic lives in `src/utils/recipeTable.ts`, markup in
  `src/components/RecipeTable.astro`. The gram fields stay editable (the
  scaler rescales the whole recipe from any one of them).
- **Downloadable card**: `src/pages/recetas/[slug]/tabla.png.ts` renders the
  same grid as a branded PNG at build time (satori + sharp, like the OG
  images), linked from the recipe page as "descargar la tabla". It always shows
  the published grams — the scaler only affects the page. Satori has no
  rowspan, so that file computes every box height itself; it sets the grid in
  JetBrains Mono because monospace makes the line wrapping computable.
- Note the two Playfair files in `src/fonts/` are **mislabelled**:
  `PlayfairDisplay-Bold.ttf` contains the italic face and `-Italic.ttf` the
  bold one.
- `schedule` (the old time/step list) still renders for recipes with no
  `process`, but new recipes should use `process`.

## Image Handling

**Uses Astro's built-in image optimization** for performance.

- All images live in `src/assets/images/` (optimized at build time)
- Hero images use Astro's `<Image>` component (see `src/layouts/BlogPost.astro`)
- Frontmatter `heroImage` uses `image()` helper in schema (returns ImageMetadata)
- Blog posts reference images with relative paths: `../../assets/images/photo.webp`
- Social meta tags in `BaseHead.astro` use `image.src` to get optimized URL

**Benefits**: Automatic WebP conversion, lazy loading, responsive images, and size reduction.

## Key Files

**Content**:
- `src/content/blog/` - All blog posts (managed by Obsidian or any editor)
- `src/content/links/` - Link bookmarks with SEO metadata
- `src/content.config.ts` - Content Collections schema and validation

**Layouts**:
- `src/layouts/BlogPost.astro` - Main blog post layout (used by all posts)

**Pages**:
- `src/pages/index.astro` - Homepage (intro → recent posts → reciente timeline → tags grid → heatmap)
- `src/pages/blog/index.astro` - Blog listing page
- `src/pages/blog/[...slug].astro` - Dynamic blog post pages (prev/next nav + related posts)
- `src/pages/hago.astro` - Projects/activism page (items tagged `hago 🔧` from blog + links)
- `src/pages/links/index.astro` - Links listing page
- `src/pages/links/[...slug].astro` - Individual link pages
- `src/pages/tags/[tag].astro` - Tag filtering (works for both blog posts and links)
- `src/pages/about.astro` - About page

**Components**:
- `src/components/BaseHead.astro` - SEO meta tags (uses ImageMetadata.src for OG images)
- `src/components/Header.astro` - Site header; nav: `inicio · escribo · hago · entreno`
- `src/components/Footer.astro` - Site footer

## Navigation & Design Conventions

- **Nav labels are verbs/nouns in Spanish**: `inicio`, `escribo`, `hago`, `entreno` — no "links" in nav (links are discoverable via tags/homepage)
- **Horizontal lines**: used only as item separators, not as section wrappers. No `border-bottom` on section containers or labels — the small `——` accent decoration on `.section-label::before` is enough.
- **Intro text** on homepage is upright (not italic) display font
- **Blog post layout** (`BlogPost.astro`): prev/next navigation + related posts (by shared tag, max 3) at bottom
- **Share button**: always shows icon panel (Bluesky, X, LinkedIn, WhatsApp SVG icons) — no Web Share API
- **Blog listing thumbnail**: falls back to `ogImage` when no `heroImage`
- **Inline prose images**: `max-width: min(100%, 560px)` — square/portrait images don't stretch full-width
- **`hago 🔧` tag**: marks content shown on `/hago/` page (blog posts + links combined)

**Config**:
- `astro.config.mjs` - Site URL: `https://raulsperoni.me`, MDX + Sitemap integrations
- `pages.config.json` - PagesCMS configuration for web-based content editing

## Deployment

- Push to `master` branch triggers GitHub Actions workflow
- Workflow runs `npm ci && npm run build`
- Deploys `dist/` folder to GitHub Pages
- Live in 2-3 minutes

## Writing Workflows

### PagesCMS (Recommended)
- Web-based CMS at https://pagescms.org
- Connect your GitHub repository
- Edit blog posts and links via web interface
- Auto-commits to GitHub → triggers deployment
- Configuration: `pages.config.json`

### Obsidian
**Primary (Mobile)**: Obsidian mobile app → GitHub Sync plugin auto-commits → auto-deploys
**Desktop**: Obsidian desktop or any text editor → manual git commit or auto-commit plugin

### Direct Editing
Any text editor → manual git commit → push → auto-deploys

## Scripts & Tools

**Ghost Import** (`scripts/migrate-from-ghost.js`):
- Converts Ghost JSON export to Markdown files
- Downloads and converts images to WebP
- Run: `npm run migrate` then `npm run migrate:images`
- See `MIGRATION.md` for details

**Link SEO Fetcher** (`scripts/fetch-link-seo.js`):
- Automatically fetches metadata from URLs (title, description, OG image, favicon, site name)
- Creates markdown files in `src/content/links/` with proper frontmatter
- Usage: `npm run add-link <url> [slug] [tags...]`
- Example: `npm run add-link https://docs.astro.build astro-docs documentation astro`
- If slug is omitted, generates one from the page title
- Tags are optional and space-separated

## Philosophy

- **Content is sacred**: All posts stored as Git-tracked markdown files
- **No vendor lock-in**: Markdown is universal and future-proof
- **Simple workflow**: Write → commit → push → deployed
- **Performance-first**: Automatic image optimization with Astro's built-in tooling
