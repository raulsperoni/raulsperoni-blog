# Blog Project Instructions

## Stack
- **Framework**: Astro (static site generator)
- **Content**: Markdown/MDX files in `src/content/blog/`
- **Styling**: CSS (in `src/styles/`)
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)
- **Writing**: Obsidian pointed at `src/content/blog/` folder

## Project Structure
```
src/
  content/
    blog/          # ← Markdown blog posts go here (Obsidian writes here)
  pages/           # Astro pages/routes
  components/      # Reusable components
  layouts/         # Page layouts
  styles/          # Global CSS
```

## Content Guidelines
- Blog posts are in `src/content/blog/`
- Each post is a `.md` or `.mdx` file
- Posts require frontmatter:
  ```yaml
  ---
  title: 'Post Title'
  description: 'Brief description'
  pubDate: 'Nov 27 2025'
  heroImage: '/path/to/image.jpg'  # optional
  ---
  ```

## Deployment
- Push to `main` branch triggers automatic deployment via GitHub Actions
- Site deploys to GitHub Pages
- Custom domain: `raulsperoni.me` (configured in `astro.config.mjs`)

## Development
- `npm run dev` - Start dev server (localhost:4321)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Key Principles
- **Content is sacred**: All blog posts are in Git, never stored in a database
- **Future-proof**: Standard markdown files can be moved anywhere
- **Tweakable**: All code is accessible for customization
- **Simple deployment**: Write → commit → push → deployed

## Common Tasks

### Add a new blog post
1. Create `.md` file in `src/content/blog/`
2. Add required frontmatter
3. Write content
4. Commit and push (auto-deploys)

### Customize styling
- Edit `src/styles/global.css`
- Component-specific styles in `.astro` component files

### Modify layout/design
- Edit components in `src/components/`
- Edit layouts in `src/layouts/`
- Main blog layout: `src/layouts/BlogPost.astro`

### Add new pages
- Create `.astro` file in `src/pages/`
- File name becomes route (e.g., `contact.astro` → `/contact`)

## GitHub Pages Setup
After first push, enable GitHub Pages:
1. Go to repo Settings → Pages
2. Source: "GitHub Actions"
3. Add custom domain: `raulsperoni.me` (optional)
4. Configure DNS to point to GitHub Pages
