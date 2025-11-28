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
```

## Content System Architecture

**Content Collections** (`src/content.config.ts`):
- Uses Astro's Content Collections API with glob loader
- Schema validation with Zod
- **Important**: `heroImage` field uses `image()` helper for optimization
  - Returns ImageMetadata object with optimized image info
  - Enables automatic format conversion, resizing, and lazy loading

**Blog Post Frontmatter** (required fields):
```yaml
---
title: 'Post Title'
description: 'Brief description'
pubDate: 'Nov 27 2025'  # Coerced to Date by schema
heroImage: '../../assets/images/photo.webp'  # Optional, relative path to src/assets
---
```

**Routing**:
- `src/pages/blog/[...slug].astro` - Dynamic route for all blog posts
- Uses `getStaticPaths()` to generate routes from Content Collections
- Post ID from filename becomes the slug

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
- `src/content.config.ts` - Content Collections schema and validation

**Layouts**:
- `src/layouts/BlogPost.astro` - Main blog post layout (used by all posts)

**Pages**:
- `src/pages/index.astro` - Homepage
- `src/pages/blog/index.astro` - Blog listing page
- `src/pages/blog/[...slug].astro` - Dynamic blog post pages
- `src/pages/about.astro` - About page

**Components**:
- `src/components/BaseHead.astro` - SEO meta tags (uses ImageMetadata.src for OG images)
- `src/components/Header.astro` - Site header with navigation
- `src/components/Footer.astro` - Site footer

**Config**:
- `astro.config.mjs` - Site URL: `https://raulsperoni.me`, MDX + Sitemap integrations

## Deployment

- Push to `master` branch triggers GitHub Actions workflow
- Workflow runs `npm ci && npm run build`
- Deploys `dist/` folder to GitHub Pages
- Live in 2-3 minutes

## Writing Workflows

**Primary (Mobile)**: Obsidian mobile app → GitHub Sync plugin auto-commits → auto-deploys
**Desktop**: Obsidian desktop or any text editor → manual git commit or auto-commit plugin

## Migration Tools

**Ghost Import** (`scripts/migrate-from-ghost.js`):
- Converts Ghost JSON export to Markdown files
- Downloads and converts images to WebP
- Run: `npm run migrate` then `npm run migrate:images`
- See `MIGRATION.md` for details

## Philosophy

- **Content is sacred**: All posts stored as Git-tracked markdown files
- **No vendor lock-in**: Markdown is universal and future-proof
- **Simple workflow**: Write → commit → push → deployed
- **Performance-first**: Automatic image optimization with Astro's built-in tooling
