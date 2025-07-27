# Vercel Deployment Guide

## 🚀 Quick Deploy

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy from GitHub**:
   - Push your code to GitHub
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will automatically detect it's a Vite project

3. **Deploy with CLI**:
   ```bash
   vercel
   ```

## 📁 Required Files

✅ **Already configured:**
- `vercel.json` - Vercel configuration
- `vite.web.config.ts` - Web build configuration
- `package.json` - Dependencies and scripts
- `index.html` - Main entry point
- `.vercelignore` - Excludes unnecessary files

## 🔧 Build Configuration

The project uses two build configurations:

- **Library Build**: `pnpm run build:lib` (for npm package)
- **Web Build**: `pnpm run build:web` (for Vercel deployment)

Vercel automatically uses the web build configuration.

## 🌍 Environment Variables

### Required Environment Variables:
None required for basic deployment.

### Optional Environment Variables:
```bash
# For development features
NODE_ENV=production

# For analytics (if you add them later)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Setting Environment Variables in Vercel:
1. Go to your project dashboard in Vercel
2. Navigate to Settings → Environment Variables
3. Add any variables you need

## 🎯 Deployment Features

✅ **Automatic HTTPS** - Vercel provides SSL certificates  
✅ **Global CDN** - Fast loading worldwide  
✅ **Automatic deployments** - Deploy on every push  
✅ **Preview deployments** - Test changes before production  
✅ **Custom domains** - Use your own domain  

## 🔍 Troubleshooting

### Build Issues:
- Make sure `pnpm` is available (Vercel supports it)
- Check that all dependencies are in `package.json`
- Verify the build command: `pnpm run build:web`

### Runtime Issues:
- Check browser console for errors
- Verify environment variables are set correctly
- Check Vercel function logs if using API routes

### Common Commands:
```bash
# Test build locally
pnpm run build:web

# Preview build locally
pnpm run preview

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## 📊 Performance

The build generates optimized assets:
- **CSS**: ~12KB (2.65KB gzipped)
- **JS**: ~54KB (15KB gzipped)
- **HTML**: ~5KB (1KB gzipped)

Total bundle size: ~71KB (19KB gzipped) - Excellent performance!

## 🎉 Success!

Your hexagonal grid game will be live at:
`https://your-project-name.vercel.app`

The deployment includes:
- ✅ Responsive design
- ✅ Touch controls
- ✅ 3D transformations
- ✅ User setup modal
- ✅ Multiple game views
- ✅ Optimized assets 