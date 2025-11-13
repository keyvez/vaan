# Baby Names Gemini Integration

## Overview
The baby names feature now includes automated processing that uses Google's Gemini AI to determine if words from the lexemes database are suitable as baby names.

## How It Works

### Background Processing
Every time someone visits the baby names page (calls `/api/baby-names`), the system automatically:

1. **Selects Unprocessed Words**: Picks 5 random words from the lexemes table that haven't been checked yet
2. **Sends to Gemini**: Asks Gemini AI to analyze if each word would make a good baby name
3. **Evaluates Criteria**: Gemini checks:
   - Positive or neutral meaning
   - Pronounceable as a name
   - Not primarily an abstract concept, object, or grammatical form
   - Traditional Sanskrit/Hindu naming conventions
   - Determines grammatical gender (boy/girl/unisex)
4. **Stores Results**:
   - Marks the word as checked in the lexemes table
   - If suitable, adds it to the baby_names table with gender and cultural context
   - If unsuitable, just marks it as checked to skip it in future

### Database Schema

**Lexemes Table** (extended with):
- `baby_name_checked` - Flag indicating if the word has been analyzed (0 or 1)
- `baby_name_suitable` - Flag indicating if Gemini found it suitable (0 or 1)
- `baby_name_gender` - Gender determined by Gemini (boy/girl/unisex or NULL)

**Baby Names Table** (extended with):
- `lexeme_id` - Reference to the source lexeme (for traceability)

### Rate Limiting Strategy
- Processes only 5 words per API call
- Uses background processing (doesn't block the response)
- Gradually builds up the database over time as users visit the site
- Avoids hitting Gemini API rate limits

## Current Status

**Database Stats:**
- Total lexemes: 8,880
- Processed so far: ~30 (will grow over time)
- Suitable names found: (varies based on processing)

## Configuration

**Gemini API Key**: Set in `wrangler.toml`
```toml
GEMINI_API_KEY = "AIzaSyAi..."
```

**Batch Size**: Defined in `worker/src/index.js`
```javascript
const BATCH_SIZE = 5; // Process 5 words per request
```

## Monitoring Progress

### Check processing status:
```bash
wrangler d1 execute vaan_sanskrit_lexicon --remote --command \
  "SELECT COUNT(*) as total_checked, SUM(baby_name_suitable) as suitable
   FROM lexemes WHERE baby_name_checked = 1"
```

### View recently added baby names:
```bash
wrangler d1 execute vaan_sanskrit_lexicon --remote --command \
  "SELECT name, gender, meaning FROM baby_names ORDER BY created_at DESC LIMIT 10"
```

### Check progress percentage:
```bash
wrangler d1 execute vaan_sanskrit_lexicon --remote --command \
  "SELECT
    (SELECT COUNT(*) FROM lexemes WHERE baby_name_checked = 1) * 100.0 /
    (SELECT COUNT(*) FROM lexemes) as percent_checked"
```

## Manual Processing

To speed up processing, you can trigger the API multiple times:

```bash
for i in {1..20}; do
  curl -s "https://vaan-wordlist.keyvez.workers.dev/api/baby-names" > /dev/null
  echo "Batch $i processed"
  sleep 3
done
```

This will process 100 words (20 batches × 5 words each).

## Expected Results

Since the lexemes database contains primarily:
- Grammatical word forms from texts (e.g., "do not understand", "situated in")
- Abstract concepts (e.g., "ascertaining", "is affected")
- Common nouns (e.g., "leaf", "abode")

The hit rate for suitable baby names will be relatively low (estimated 5-15%).

The system is designed to run continuously in the background as users visit the site, eventually identifying all suitable names from the 8,880 word corpus.

## Gemini Prompt

The system uses a carefully crafted prompt to guide Gemini's analysis:

```
You are a Sanskrit language and naming expert. Analyze the following Sanskrit word
and determine if it would be suitable as a baby name.

Sanskrit Word: [word]
Transliteration: [transliteration]
English Meaning: [meaning]

Respond in JSON format with:
- suitable: true/false
- gender: boy/girl/unisex (if suitable)
- reasoning: why it is or isn't suitable
- story: cultural/mythological context (if suitable)
```

## Future Enhancements

1. **Priority Processing**: Process words with certain patterns first (e.g., names of deities, qualities)
2. **Batch API Calls**: Send multiple words to Gemini in one request
3. **Admin Dashboard**: UI to review and approve/reject Gemini's suggestions
4. **Manual Additions**: Allow manual addition of names not in lexemes table
5. **Quality Scores**: Have Gemini rate name suitability on a scale
