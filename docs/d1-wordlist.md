# Cloudflare D1 Sanskrit Lexicon

This project now provisions a Cloudflare D1 database named `vaan_sanskrit_lexicon` (ID `7e1dac7b-77b7-4659-ac6e-1f952da4d293`) to host the Sanskrit lexicon. The schema lives in `db/d1/schema.sql` and ingestion is handled by `scripts/ingest-wordlist.js`.

## Prerequisites

- `npm install` inside `web/`
- Logged in to Wrangler (`wrangler login`)
- Access to the Cloudflare account that owns the D1 database

## One-time setup

1. (Already done) `wrangler d1 create vaan_sanskrit_lexicon`
2. Ensure `wrangler.toml` has the generated `database_id`.
3. Apply/update the schema to the remote database whenever it changes:
   ```bash
   cd web
   npm run d1:setup
   ```

## Parsing & ingesting a wordlist

The ingestion script expects each line to look like:
```
Sanskrit word (transliteration) = comma-separated English glosses
```
Example lines are available at `data/sample-wordlist.txt`.

Run the script from the repo root (or via the npm helper) once the full 9k-line file is available:
```bash
cd web
npm run d1:ingest -- \
  --file ../<path-to-wordlist>.txt \
  --database vaan_sanskrit_lexicon \
  --batch-size 200
```

Flags:
- `--dry-run` parses and previews without calling Cloudflare.
- `--limit <n>` ingests only the first `n` rows (useful for smoke tests).
- `--skip-schema` skips automatically re-applying the schema.
- `--batch-size <n>` controls how many INSERT rows are sent per request (default 200).

The script normalizes each line into:
- Sanskrit word
- Transliteration (if provided)
- Primary English gloss + full list of glosses (stored as JSON)
- Optional part of speech (detected from prefixes like `adj.`)
- Placeholder Hindi meaning & tags columns for future enrichment
- Raw source line for traceability

All `INSERT` statements use `INSERT OR REPLACE`, so re-running the importer safely updates existing entries.

## Verifying the data

You can spot-check records with Wrangler:
```bash
wrangler d1 execute vaan_sanskrit_lexicon --remote \
  --command "SELECT sanskrit, primary_meaning FROM lexemes LIMIT 5;"
```

## Next steps when the full file arrives

1. Save the provided 9k-line file somewhere inside the repo (e.g. `data/lexicon.txt`).
2. Run `npm run d1:ingest -- --file ../data/lexicon.txt --database vaan_sanskrit_lexicon`.
3. Optionally, verify counts with `SELECT COUNT(*) FROM lexemes;`.
4. Share any ingestion logs or anomalies before wiring the DB into the UI.
