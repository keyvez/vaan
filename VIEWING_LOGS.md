# Viewing Gemini API Logs

## Why You Might Not See Logs

The Gemini API logging only happens when:

1. **A request is made to `/api/baby-names`** - This triggers background processing
2. **There are unprocessed lexemes** - The worker only processes lexemes where `baby_name_checked = 0`
3. **The GEMINI_API_KEY is configured** - Check your Cloudflare dashboard

If all lexemes have already been processed, the Gemini API won't be called, so you won't see those logs.

## How to View Logs

### Option 1: Real-time Tail (Recommended)

Run the helper script:
```bash
./view_logs.sh
```

Or manually:
```bash
npx wrangler tail --format pretty
```

This will show all console.log output in real-time as requests come in.

### Option 2: Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Navigate to **Workers & Pages**
3. Click on **vaan-wordlist**
4. Click on the **Logs** tab (or **Real-time Logs**)
5. You'll see logs as they come in

### Option 3: Logpush (For Production)

For production monitoring, consider setting up Cloudflare Logpush to send logs to:
- Cloudflare R2
- AWS S3
- Google Cloud Storage
- Datadog, Splunk, etc.

## Triggering Gemini API Logs

To force the Gemini API to run and see the logs:

### 1. Check if there are unprocessed lexemes:

```bash
npx wrangler d1 execute vaan_sanskrit_lexicon --command "SELECT COUNT(*) as unprocessed FROM lexemes WHERE baby_name_checked = 0"
```

### 2. If all are processed, reset some lexemes:

```bash
# Reset 5 lexemes for testing
npx wrangler d1 execute vaan_sanskrit_lexicon --command "UPDATE lexemes SET baby_name_checked = 0 WHERE id IN (SELECT id FROM lexemes ORDER BY RANDOM() LIMIT 5)"
```

### 3. Trigger a request:

```bash
curl "https://vaan-wordlist.keyvez.workers.dev/api/baby-names?letter=A"
```

### 4. Watch the logs:

```bash
./view_logs.sh
```

You should now see output like:

```
=== Gemini API Request ===
Timestamp: 2025-11-19T21:19:27.123Z
Lexemes count: 5
Lexeme IDs: 123, 124, 125, 126, 127
Words: अग्नि, जल, वायु, पृथ्वी, आकाश
Prompt length: 1234 characters
=== Gemini API Response ===
Status: 200 OK
Response time: 1523ms
Response metadata: { candidatesCount: 1, usageMetadata: {...} }
Token usage - Prompt: 456, Candidates: 234, Total: 690
...
```

## Log Levels

The observability logging includes:

- **Request details**: Timestamp, lexeme count, IDs, words
- **Prompt metrics**: Character count
- **Response status**: HTTP status, timing
- **Token usage**: Prompt, candidates, total tokens
- **Results summary**: Per-word analysis results
- **Error details**: Full error responses when failures occur

## Troubleshooting

### No logs appearing at all?

1. Check the worker is deployed: `npx wrangler deployments list`
2. Verify GEMINI_API_KEY is set in Cloudflare dashboard
3. Ensure requests are reaching the worker (check basic request logs)

### Logs appear but no Gemini API logs?

1. All lexemes might be processed already
2. Background processing might have failed (check error logs)
3. GEMINI_API_KEY might be missing or invalid

### Want to see historical logs?

Cloudflare Workers only shows real-time logs by default. For historical logs:
- Set up Logpush to a storage provider
- Use Cloudflare Analytics & Logs (paid feature)
- Implement custom logging to an external service
