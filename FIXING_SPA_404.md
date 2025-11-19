# Fixed: 404 on Page Refresh for SPA Routes

## The Issue

Refreshing pages like `https://sanskrit.roj.app/baby-names/i` was returning a 404 error.

## The Cause

The Cloudflare Pages Function at `web/functions/baby-names/[slug].tsx` was intercepting *all* requests to `/baby-names/*`.
It was trying to fetch the slug from the API, and if it failed (e.g. for "i" which is a category, not a name), it was returning a hard 404 response:
`return new Response('Not found', { status: 404 });`

This prevented the Single Page Application (SPA) from loading its `index.html` to handle the client-side route.

## The Fix

Modified `web/functions/baby-names/[slug].tsx` to:

1. Check if the slug is a single letter (e.g. "i", "a"). If so, serve `index.html` immediately.
2. If the API lookup fails (name not found), serve `index.html` instead of a hard 404.

This allows the React app to load and handle the routing client-side, while still providing server-side rendered OG tags for valid baby name pages.

## Verification

- `curl -I https://sanskrit.roj.app/baby-names/aa-rav-1` -> Returns HTML with OG tags (SEO)
- `curl -I https://sanskrit.roj.app/baby-names/i` -> Returns 200 OK with index.html (SPA)
