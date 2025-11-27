# Mobile Writing Setup Guide

Write from your Android phone, auto-sync to GitHub, auto-deploy to web. No Mac required.

## Overview

**Flow:** Write in Obsidian mobile → GitHub Sync plugin → GitHub → GitHub Actions → Deployed

## Prerequisites

- Android phone
- Obsidian mobile app (free)
- GitHub account
- This blog repo

## Setup Steps

### 1. Install BRAT (Plugin Manager)

On your **desktop** first:

1. Open Obsidian
2. Settings → Community Plugins → Browse
3. Search for "BRAT" (Beta Reviewers Auto-update Tester)
4. Install and Enable BRAT

### 2. Install GitHub Sync Plugin via BRAT

Still on desktop:

1. Settings → BRAT
2. Click "Add Beta plugin"
3. Enter: `git-sync-obsidian/obsidian-git-sync`
4. Click "Add Plugin"
5. Go to Settings → Community Plugins
6. Enable "GitHub Sync"

### 3. Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Note: "Obsidian Blog Sync"
3. Expiration: No expiration (or 1 year)
4. Scopes needed:
   - `repo` (full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN** (you won't see it again)

### 4. Configure GitHub Sync Plugin

Still on desktop:

1. Settings → GitHub Sync
2. Fill in:
   - **Repository**: `raulsperoni/raulsperoni-blog`
   - **Branch**: `master`
   - **Personal Access Token**: (paste token from step 3)
   - **Sync Folder**: `src/content/blog` (only sync blog posts)
3. Enable:
   - ✅ Auto-pull on open
   - ✅ Auto-commit on close
   - ✅ Auto-push on commit
   - ✅ Periodic sync (set to 5 minutes)
4. Save settings

### 5. Test on Desktop

1. Create a test post in `src/content/blog/test.md`:
   ```markdown
   ---
   title: 'Test Post'
   description: 'Testing mobile sync'
   pubDate: 'Nov 27 2025'
   ---

   This is a test.
   ```
2. Close Obsidian (should auto-commit and push)
3. Check GitHub repo - you should see the commit
4. Wait 2-3 minutes for GitHub Actions to deploy
5. Visit your site to verify

### 6. Set Up Obsidian Mobile

On your **Android phone**:

1. Install Obsidian from Play Store
2. Open Obsidian
3. "Open folder as vault"
4. Select the folder where you want your vault
5. Settings → Community Plugins → Enable Community Plugins
6. Settings → Community Plugins → Installed Plugins
7. You should see "BRAT" and "GitHub Sync" (synced from desktop)
8. Enable both plugins

### 7. Configure GitHub Sync on Mobile

1. Settings → GitHub Sync
2. Enter the **same settings as desktop**:
   - Repository: `raulsperoni/raulsperoni-blog`
   - Branch: `master`
   - Personal Access Token: (same token)
   - Sync Folder: `src/content/blog`
3. Enable auto-sync options
4. Save

### 8. Test Mobile Workflow

1. Create a new note in your vault
2. Add frontmatter:
   ```yaml
   ---
   title: 'First Mobile Post'
   description: 'Written on my phone'
   pubDate: 'Nov 27 2025'
   ---
   ```
3. Write your content
4. Close Obsidian or wait 5 minutes
5. Plugin auto-commits and pushes
6. Check your site in 2-3 minutes - should be live!

## Daily Workflow

1. **Open Obsidian mobile**
2. **Write your post** (plugin auto-pulls latest on open)
3. **Close app** (plugin auto-commits and pushes)
4. **Wait 2-3 min** for deployment
5. **Post is live!**

## Troubleshooting

### "Failed to sync" error
- Check internet connection
- Verify GitHub token hasn't expired
- Check repo name is correct

### "Merge conflict" error
- Pull latest changes first
- Or: delete local vault, re-clone from GitHub

### Post not deploying
- Check GitHub Actions tab in repo
- Look for build errors
- Verify frontmatter is correct

### Plugin not showing on mobile
- Make sure Community Plugins are enabled
- Try reinstalling BRAT on mobile
- Sync settings from desktop

## Notes

- **Auto-sync interval**: 5 minutes (configurable)
- **File size limit**: 7MB (plenty for markdown)
- **Conflicts**: Plugin handles simple conflicts automatically
- **Offline writing**: Writes locally, syncs when online

## Alternative: Manual Sync

If you prefer manual control:
1. Disable auto-commit/push
2. Use the command palette (⌘P)
3. Run "GitHub Sync: Push"
4. Gives you control over when to publish
