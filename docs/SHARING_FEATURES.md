# Sharing & OpenGraph Features

## Overview
All pages and individual content (baby names, daily words) now have:
- Unique shareable URLs
- Dynamic OpenGraph images
- SEO meta tags
- Share buttons

## Live Endpoints

### Baby Names
- **List**: https://vaan-wordlist.keyvez.workers.dev/api/baby-names
- **Individual**: https://vaan-wordlist.keyvez.workers.dev/api/baby-names/{slug}
- **OG Image**: https://vaan-wordlist.keyvez.workers.dev/api/baby-names/{slug}/og-image

Example:
- https://vaan-wordlist.keyvez.workers.dev/api/baby-names/ar-jun-3
- https://vaan-wordlist.keyvez.workers.dev/api/baby-names/ar-jun-3/og-image

### Daily Word
- **Word**: https://vaan-wordlist.keyvez.workers.dev/api/word-of-day
- **OG Image**: https://vaan-wordlist.keyvez.workers.dev/api/word-of-day/og-image

## Features

### Individual Baby Name Pages
Each baby name has its own page at `/baby-names/{slug}` with:
- Full name details
- Pronunciation guide
- Cultural significance
- Share button (native share or copy link)
- Copy link button
- Beautiful OG image for social sharing

### OpenGraph Images
Dynamic SVG images are generated for each:
- **Baby Names**: Orange/red gradient with name, pronunciation, and meaning
- **Daily Words**: Blue/purple gradient with Sanskrit text and transliteration

These images appear when sharing links on:
- Facebook
- Twitter
- LinkedIn
- WhatsApp
- Slack
- Discord
- etc.

### SEO Meta Tags
Every page includes:
- Title tags
- Meta descriptions
- OpenGraph tags (og:title, og:description, og:image, og:url)
- Twitter Card tags
- Canonical URLs

## Usage

### Web App
1. Visit http://localhost:3000/baby-names
2. Click any baby name card
3. You'll see the detail page with share buttons
4. Click "Share" to share via native share (mobile) or social media
5. Click "Copy" to copy the link to clipboard

### Testing OpenGraph
To test how your links appear on social media:
1. Use tools like:
   - https://www.opengraph.xyz/
   - https://cards-dev.twitter.com/validator
   - https://developers.facebook.com/tools/debug/
2. Enter a URL like: `https://vaan.pages.dev/baby-names/arjun`
3. See the OG image preview

## R2 Storage (Optional)
To enable caching of OG images in R2:

1. Enable R2 in your Cloudflare Dashboard
2. Create the bucket:
   ```bash
   wrangler r2 bucket create vaan-og-images
   ```
3. Uncomment the R2 binding in `wrangler.toml`:
   ```toml
   [[r2_buckets]]
   binding = "OG_IMAGES"
   bucket_name = "vaan-og-images"
   ```
4. Redeploy:
   ```bash
   wrangler deploy
   ```

## Routes

### Frontend Routes
- `/` - Home page
- `/baby-names` - Baby names listing
- `/baby-names/:slug` - Individual baby name page
- `/daily-word` - Daily Sanskrit word
- `/learn` - Learning exercises
- `/ai-companion` - AI chat
- `/translate` - Translation tool
- `/donate` - Donation page

### API Routes
- `GET /api/baby-names` - List baby names
- `GET /api/baby-names/:slug` - Get individual baby name
- `GET /api/baby-names/:slug/og-image` - Generate OG image for baby name
- `GET /api/word-of-day` - Get today's word
- `GET /api/word-of-day/og-image` - Generate OG image for daily word

## Next Steps

1. **Deploy Frontend**: Deploy the web app to Cloudflare Pages
2. **Enable R2**: Enable R2 storage for caching OG images
3. **Custom Domain**: Set up your custom domain (e.g., vaan.com)
4. **Analytics**: Add analytics to track shares and engagement
5. **Social Media**: Create social media accounts and start sharing!

## Technical Details

### OG Image Generation
- SVG-based images (1200x630px)
- Dynamic content (name, meaning, pronunciation)
- Gradient backgrounds
- Vaan branding
- Fast generation (<100ms)

### Caching Strategy
- OG images cached in R2 (when enabled)
- Long cache duration (immutable for baby names, 1 hour for daily word)
- Falls back to on-demand generation if R2 is disabled

### Share Button Behavior
- Mobile: Uses native `navigator.share()` API
- Desktop: Falls back to copy to clipboard
- Success toasts for user feedback
