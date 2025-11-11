// Cloudflare Pages Function for daily word OG tags
export async function onRequest(context) {
  const { request } = context;

  // Fetch daily word data
  let wordData;
  try {
    const response = await fetch('https://vaan-wordlist.keyvez.workers.dev/api/daily-word');
    if (response.ok) {
      wordData = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch daily word:', error);
  }

  if (!wordData) {
    // Return 404 or redirect to daily word page
    return new Response('Not found', { status: 404 });
  }

  // Build OG image URL
  const ogImageUrl = `https://vaan-og-images.keyvez.workers.dev/word/${wordData.id}?` +
    `sanskrit=${encodeURIComponent(wordData.word || '')}&` +
    `transliteration=${encodeURIComponent(wordData.transliteration || '')}&` +
    `meaning=${encodeURIComponent(wordData.primaryMeaning || '')}`;

  const title = `Sanskrit Word of the Day: ${wordData.word} | Vaan`;
  const description = `${wordData.word} (${wordData.transliteration}) - ${wordData.primaryMeaning}. Learn a new Sanskrit word every day.`;

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
  <meta property="og:url" content="https://vaan.pages.dev/daily-word">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Vaan">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImageUrl}">

  <meta http-equiv="refresh" content="0;url=/daily-word">
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
