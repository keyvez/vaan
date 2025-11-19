# Setting up GEMINI_API_KEY

## The Issue

The logs show:
```
[Background] Skipping lexeme processing - GEMINI_API_KEY or ctx.waitUntil not available
```

This means the GEMINI_API_KEY environment variable is not set in your Cloudflare Worker.

## Solution

You need to add the GEMINI_API_KEY as a secret to your Cloudflare Worker.

### Option 1: Using Wrangler CLI (Recommended)

```bash
npx wrangler secret put GEMINI_API_KEY
```

When prompted, paste your Gemini API key.

### Option 2: Using Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Navigate to **Workers & Pages**
3. Click on **vaan-wordlist**
4. Go to **Settings** tab
5. Scroll to **Environment Variables**
6. Click **Add variable**
7. Name: `GEMINI_API_KEY`
8. Type: **Secret** (encrypted)
9. Value: Your Gemini API key
10. Click **Save**

### Getting a Gemini API Key

If you don't have one:

1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key

## After Setting the Key

1. The worker will automatically use the new secret (no redeployment needed)
2. Make a request to trigger background processing:
   ```bash
   curl "https://vaan-wordlist.keyvez.workers.dev/api/baby-names?letter=A"
   ```
3. Tail the logs to see the Gemini API calls:
   ```bash
   ./view_logs.sh
   ```

You should now see:
```
[Background] Triggering lexeme processing for letter: A
=== Gemini API Request ===
Timestamp: 2025-11-19T...
Lexemes count: 5
...
```
