# Raul Speroni's Blog

A Git-backed, Obsidian-powered, Astro-built blog. Content lives in markdown files forever. No databases, no vendor lock-in, just files.

## The Setup

**Stack:**
- **Astro**: Static site generator (fast, modern, tweakable)
- **Markdown/MDX**: Blog posts in `src/content/blog/`
- **Obsidian**: Beautiful markdown editor for writing
- **GitHub Actions**: Auto-deploy on push
- **GitHub Pages**: Free hosting at raulsperoni.me

**Philosophy:**
- Content is sacred → stored as markdown in Git
- Future-proof → files can move anywhere
- Tweakable → it's just code
- Simple workflow → write, commit, push, deployed

## Writing Workflow

### Option 1: Obsidian (Recommended)
1. Open Obsidian
2. Point it to `Projects/blog/src/content/blog/` as a vault
3. Write your post as a `.md` file
4. Add frontmatter:
   ```yaml
   ---
   title: 'Your Post Title'
   description: 'Brief description'
   pubDate: 'Nov 27 2025'
   ---
   ```
5. Save (Obsidian auto-saves)
6. Commit and push when ready:
   ```bash
   git add .
   git commit -m "New post: Your Title"
   git push
   ```
7. GitHub Actions builds and deploys automatically

### Option 2: Any Text Editor
Just create a `.md` file in `src/content/blog/` and follow the same frontmatter format.

## Development

```bash
# Install dependencies
npm install

# Start dev server (localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  content/
    blog/          # ← Your blog posts (markdown files)
  pages/           # Routes/pages
  components/      # Reusable components
  layouts/         # Page layouts (BlogPost.astro is the main one)
  styles/          # CSS
.github/
  workflows/
    deploy.yml     # Auto-deployment workflow
```

## Deployment

- **Automatic**: Push to `main` → GitHub Actions builds → deploys to GitHub Pages
- **Custom domain**: Configured for `raulsperoni.me` in `astro.config.mjs`
- **First-time setup**:
  1. Go to repo Settings → Pages
  2. Source: "GitHub Actions"
  3. (Optional) Add custom domain and configure DNS

## Customization

All code is yours to tweak:

- **Styling**: Edit `src/styles/global.css`
- **Layout**: Edit `src/layouts/BlogPost.astro`
- **Components**: Edit files in `src/components/`
- **Add pages**: Create `.astro` files in `src/pages/`

## Migration from Ghost

(TODO: Run migration script to pull existing posts from Ghost)

## Why This Stack?

- ✅ **Content safety**: Files in Git, never locked in a database
- ✅ **Future-proof**: Markdown is universal, will work in 2050
- ✅ **No vendor lock-in**: Move to any platform that reads markdown
- ✅ **Free hosting**: GitHub Pages is free forever
- ✅ **Fast**: Static sites are instant
- ✅ **Tweakable**: Full control over every line of code
- ✅ **Great writing experience**: Obsidian is beautiful
- ✅ **Simple workflow**: Write → commit → push → live

---

Built with [Astro](https://astro.build). Theme based on [Bear Blog](https://github.com/HermanMartinus/bearblog/).
