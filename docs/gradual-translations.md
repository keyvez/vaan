# Gradual Translation System

## Overview

The Vaan application now supports gradual, on-demand translation of UI strings. Instead of translating all strings upfront, translations are generated incrementally based on actual user activity.

## How It Works

### 1. Database Schema

**translation_keys table**: Stores all translatable strings from the application
- `translation_key`: Unique key (e.g., "nav.home", "babyNames.title")
- `source_text`: Original English text
- `category`: Grouping for organization (e.g., "navigation", "babyNames")

**translations table**: Stores completed translations
- `translation_key`: References translation_keys
- `language_code`: Target language (e.g., "hi", "es", "fr")
- `source_text`: Original text
- `translated_text`: Translated result
- Unique constraint on (translation_key, language_code)

### 2. Background Processing

When a user visits the site with a non-English language selected:

1. **Frontend requests translations** via `/api/translations/{languageCode}`
2. **API returns existing translations** from the database
3. **Background job triggers** via `ctx.waitUntil()` to process untranslated strings
4. **5 strings at a time** are sent to the free-translate API
5. **Results are saved** to the translations table for future use

This happens asynchronously without blocking the user experience.

### 3. Translation Process

```
User visits site with Hindi language
           ↓
GET /api/translations/hi
           ↓
Returns existing Hindi translations
           ↓
[Background] Find 5 untranslated strings
           ↓
[Background] Call free-translate API for each
           ↓
[Background] Save results to database
           ↓
Next request has more translations available
```

### 4. Gradual Coverage

Over time, as users with different language preferences visit the site:
- Frequently used pages get translated first
- Translations accumulate in the database
- Eventually, the entire UI is translated for active languages
- Languages with no users remain untranslated (saving resources)

## API Endpoints

### GET /api/translations/:languageCode

Returns all available translations for a language.

**Response:**
```json
{
  "translations": {
    "nav.home": "होम",
    "nav.translate": "अनुवाद",
    "babyNames.title": "बच्चों के नाम"
  }
}
```

**Side Effect:** Triggers background translation of 5 untranslated strings

## Configuration

### Environment Variables

- `VITE_TRANSLATIONS_API_ENDPOINT`: Override the translations API URL (optional)

### Translation API

Currently uses: `https://free-translate-go-api.onrender.com/translate`

To change:
1. Update `processTranslationsBatch()` in `worker/src/index.js`
2. Modify the fetch URL and request/response format

## Database Migrations

To set up the translation system in a new environment:

```sql
-- Run these migrations in order:
-- 1. db/d1/migrations/004_create_translations_table.sql
-- 2. db/d1/migrations/005_seed_translation_keys.sql
```

Or update the main schema: `db/d1/schema.sql`

## Adding New Translatable Strings

When adding new UI strings:

1. **Add to English fallback** in `web/src/lib/i18n.ts`
2. **Add to translation_keys seed** in `db/d1/migrations/005_seed_translation_keys.sql`
3. **Run migration** to populate the translation_keys table

Example:
```sql
INSERT OR IGNORE INTO translation_keys
  (translation_key, source_text, category)
VALUES
  ('newFeature.title', 'New Feature Title', 'newFeature');
```

## Monitoring

Check worker logs for translation activity:

```
Processing translations for language: hi
Found 5 untranslated strings for hi
Translating "Home" to hi
Saved translation: nav.home -> होम
Completed translation batch for hi
```

## Benefits

1. **Cost-effective**: Only translate strings that users actually need
2. **Scalable**: Add new languages without upfront translation costs
3. **Automatic**: No manual translation management required
4. **Resilient**: Falls back to English if translations unavailable
5. **Progressive**: Site becomes more localized over time with usage

## Future Improvements

- Add translation caching with TTL
- Implement translation quality scoring
- Support for plural forms and interpolation
- Add manual translation overrides
- Translation memory for consistency
- Community translation contributions
