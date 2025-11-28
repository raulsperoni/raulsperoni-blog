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

### Mobile (Primary Method)

**Write on your phone, auto-publish to the web!**

1. Open Obsidian mobile app
2. Write your post
3. Close app (or wait 5 minutes)
4. **Auto-magic**: GitHub Sync plugin commits → GitHub Actions deploys → Live in 2-3 min

**Setup required**: See [`SETUP-MOBILE.md`](SETUP-MOBILE.md) for detailed setup instructions

**Tech**: Uses the GitHub Sync plugin for Obsidian - no Mac needed, works on Android

### Desktop (Alternative)

**Option 1: Obsidian with GitHub Sync Plugin**
1. Write in Obsidian
2. Plugin auto-commits and pushes (or manual commit)
3. Auto-deploys

**Option 2: Manual Git Workflow**
1. Create `.md` file in `src/content/blog/`
2. Add frontmatter:
   ```yaml
   ---
   title: 'Your Post Title'
   description: 'Brief description'
   pubDate: 'Nov 27 2025'
   ---
   ```
3. Write content
4. Commit and push:
   ```bash
   git add .
   git commit -m "New post: Your Title"
   git push
   ```
5. GitHub Actions deploys automatically

### Any Text Editor
Just create a `.md` file in `src/content/blog/` and follow the frontmatter format above.

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

Ready to import your existing Ghost posts? See [`MIGRATION.md`](MIGRATION.md) for complete instructions.

**Quick version:**
1. Export from Ghost Admin → Settings → Labs → Export
2. Save JSON as `scripts/ghost-export.json`
3. Run `npm run migrate` (migrates posts)
4. Run `npm run migrate:images` (downloads images locally)
5. Review posts and push to deploy

## Why This Stack?

- ✅ **Content safety**: Files in Git, never locked in a database
- ✅ **Future-proof**: Markdown is universal, will work in 2050
- ✅ **No vendor lock-in**: Move to any platform that reads markdown
- ✅ **Free hosting**: GitHub Pages is free forever
- ✅ **Fast**: Static sites are instant
- ✅ **Tweakable**: Full control over every line of code
- ✅ **Great writing experience**: Obsidian is beautiful
- ✅ **Mobile-first**: Write on your phone, auto-publishes
- ✅ **Simple workflow**: Write → auto-commit → auto-deploy → live
- ✅ **No Mac required**: GitHub Sync plugin handles everything

---

Built with [Astro](https://astro.build). Theme based on [Bear Blog](https://github.com/HermanMartinus/bearblog/).
