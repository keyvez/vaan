# Gemini Sanskrit OCR Correction Feature

## Overview

This feature enhances the Gemini API integration to detect and correct OCR (Optical Character Recognition) errors in Sanskrit words. Many Sanskrit lexemes in the database may contain OCR errors from scanning printed texts, and this feature uses Gemini AI to identify and correct these errors.

## Changes Made

### 1. Database Schema (`migration_008_add_corrected_sanskrit.sql`)

Added a new column to the `lexemes` table:
- `corrected_sanskrit` (TEXT, nullable): Stores the corrected Sanskrit spelling suggested by Gemini
- Index on `corrected_sanskrit` for efficient lookups

**To apply the migration:**

```bash
# Local database
wrangler d1 execute vaan_sanskrit_lexicon --file=migration_008_add_corrected_sanskrit.sql

# Remote database
wrangler d1 execute vaan_sanskrit_lexicon --remote --file=migration_008_add_corrected_sanskrit.sql
```

### 2. Worker API (`worker/src/index.js`)

#### Updated Gemini Prompt
The prompt now explicitly instructs Gemini to:
- Examine each Sanskrit word for OCR errors
- Check Devanagari characters for malformations
- Compare the word against the English meaning to verify correctness
- Provide corrected Devanagari spelling when errors are detected

#### Updated Response Schema
Added `corrected_sanskrit` field to the JSON schema:
```javascript
corrected_sanskrit: { type: "string", nullable: true }
```

#### Updated Database Logic
- Database UPDATE statement now includes `corrected_sanskrit` field
- The `saveBabyName` function accepts and uses corrected Sanskrit when available
- Baby names table will store the corrected spelling instead of the original OCR error

#### Enhanced Logging
- Logs now include `correctedSanskrit` in results summary
- Special log entry for all corrections detected in a batch
- Console output clearly indicates when a baby name uses corrected spelling

### 3. Documentation (`docs/baby-names-gemini-integration.md`)

Updated to include:
- OCR Error Correction section explaining the feature
- Examples of how corrections work
- Database storage details

## How It Works

### Processing Flow

1. **Batch Selection**: System selects 5 unprocessed lexemes from the database

2. **Gemini Analysis**: For each lexeme, Gemini receives:
   - Sanskrit Word (Devanagari): e.g., `रुक्मिन`
   - English Meaning: e.g., `golden, radiant`

3. **OCR Detection**: Gemini analyzes:
   - Does the Sanskrit word look correct?
   - Do the characters make sense?
   - Does the word match the English meaning?
   - Are there common OCR errors (similar-looking characters)?

4. **Correction**: If errors found:
   - Gemini suggests: `रुक्मिणी`
   - System stores in `corrected_sanskrit` field
   - Logs the correction

5. **Storage**:
   ```sql
   UPDATE lexemes SET
     corrected_sanskrit = 'रुक्मिणी',
     baby_name_checked = 1,
     ...
   WHERE id = 123
   ```

6. **Baby Name Creation**: If suitable:
   ```sql
   INSERT INTO baby_names (name, ...)
   VALUES ('रुक्मिणी', ...)  -- Uses corrected spelling
   ```

## Example Scenarios

### Scenario 1: OCR Error Detected

**Input:**
- Sanskrit: `सत्य` (with OCR error, should be `सत्य`)
- Meaning: "truth"

**Gemini Response:**
```json
{
  "corrected_sanskrit": "सत्य",
  "reasoning": "Corrected OCR error in Devanagari spelling"
}
```

**Result:**
- `lexemes.sanskrit` = original (with error)
- `lexemes.corrected_sanskrit` = "सत्य"
- `baby_names.name` = "सत्य" (corrected version)

### Scenario 2: No OCR Error

**Input:**
- Sanskrit: `कृष्ण`
- Meaning: "dark, Krishna"

**Gemini Response:**
```json
{
  "corrected_sanskrit": null,
  "reasoning": "Word is correctly spelled"
}
```

**Result:**
- `lexemes.sanskrit` = "कृष्ण"
- `lexemes.corrected_sanskrit` = null
- `baby_names.name` = "कृष्ण" (original version)

## Benefits

1. **Data Quality**: Improves Sanskrit word accuracy in the database
2. **Preservation**: Original OCR text preserved for reference
3. **User Experience**: Baby names show correct Sanskrit spelling
4. **Learning**: Corrected words provide better learning material
5. **Traceability**: Logs show all corrections made

## Monitoring

### Check for corrected words:
```bash
wrangler d1 execute vaan_sanskrit_lexicon --remote --command \
  "SELECT id, sanskrit, corrected_sanskrit, primary_meaning
   FROM lexemes
   WHERE corrected_sanskrit IS NOT NULL"
```

### Count corrections:
```bash
wrangler d1 execute vaan_sanskrit_lexicon --remote --command \
  "SELECT COUNT(*) as total_corrections
   FROM lexemes
   WHERE corrected_sanskrit IS NOT NULL"
```

### View logs:
Check worker logs for entries like:
```
Sanskrit corrections detected (2): [
  { lexemeId: 123, original: 'रुक्मिन', corrected: 'रुक्मिणी' },
  { lexemeId: 456, original: 'देव', corrected: 'देवी' }
]
```

## Testing

After deploying these changes:

1. Trigger the baby names API to process some lexemes:
   ```bash
   curl "https://vaan-wordlist.keyvez.workers.dev/api/baby-names"
   ```

2. Check the worker logs:
   ```bash
   wrangler tail --remote
   ```

3. Look for:
   - "Sanskrit corrections detected" messages
   - Results summary showing `correctedSanskrit` field
   - Baby name creation logs with "[CORRECTED from: ...]"

4. Verify database:
   ```bash
   wrangler d1 execute vaan_sanskrit_lexicon --remote --command \
     "SELECT * FROM lexemes WHERE corrected_sanskrit IS NOT NULL LIMIT 5"
   ```

## Future Enhancements

1. **Admin Review**: UI to review and approve/reject corrections
2. **Bulk Reprocessing**: Script to reprocess existing lexemes for OCR errors
3. **Correction Statistics**: Dashboard showing correction rates and patterns
4. **Manual Override**: Allow manual correction submission by users
5. **Confidence Scores**: Have Gemini provide confidence level for corrections
