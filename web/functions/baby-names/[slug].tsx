// Cloudflare Pages Function for dynamic OG tags
export async function onRequest(context) {
  const { params, request } = context;
  const { slug } = params;

  // If slug is a single letter, it's a category page, not a specific name
  // Serve index.html for SPA to handle
  if (slug.length === 1) {
    return context.env.ASSETS.fetch(new URL('/index.html', request.url));
  }

  // Fetch baby name data
  let nameData;
  try {
    const response = await fetch(`https://vaan-wordlist.keyvez.workers.dev/api/baby-names/${slug}`);
    if (response.ok) {
      nameData = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch name:', error);
  }

  if (!nameData) {
    // If name not found, serve index.html for SPA to handle (could be a client-side 404 or other route)
    return context.env.ASSETS.fetch(new URL('/index.html', request.url));
  }

  // Use pronunciation as fallback if name is empty
  const displayName = nameData.name || nameData.pronunciation || slug.replace(/-/g, ' ');

  // Build OG image URL
  const ogImageUrl = `https://vaan-og-images.keyvez.workers.dev/baby-name/${slug}?` +
    `name=${encodeURIComponent(displayName)}&` +
    `pronunciation=${encodeURIComponent(nameData.pronunciation)}&` +
    `meaning=${encodeURIComponent(nameData.meaning)}&` +
    `story=${encodeURIComponent(nameData.story || '')}&` +
    `gender=${encodeURIComponent(nameData.gender)}`;

  const title = `${displayName} - Sanskrit Baby Name | Vaan`;
  const description = `${displayName} (${nameData.pronunciation}) - ${nameData.meaning}. Discover the meaning and cultural significance of this beautiful Sanskrit name.`;

  // Return HTML with proper meta tags
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://vaan.pages.dev/baby-names/${slug}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Vaan">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImageUrl}">

  <meta http-equiv="refresh" content="0;url=/baby-names/${slug}">
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
