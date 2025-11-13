# Baby Names Migration to D1 Database

## Summary
Successfully migrated the baby names feature from hardcoded data to using the Cloudflare D1 database, matching the pattern used by the "Word of the Day" feature.

## Changes Made

### 1. Database Schema (`db/d1/schema.sql`)
- Created `baby_names` table with columns:
  - `id` (primary key)
  - `name` (name of the baby)
  - `gender` (boy/girl/unisex with constraint)
  - `meaning` (English meaning)
  - `pronunciation` (transliteration)
  - `story` (cultural background)
  - `first_letter` (for efficient letter-based filtering)
  - `created_at` (timestamp)

- Added indexes for efficient queries:
  - `idx_baby_names_gender`
  - `idx_baby_names_first_letter`
  - `idx_baby_names_name`

- Created full-text search virtual table `baby_names_fts` with automatic triggers

### 2. Worker API (`worker/src/index.js`)
- Added new endpoint: `/api/baby-names`
- Supports query parameters:
  - `gender` - Filter by boy/girl (default: all)
  - `letter` - Filter by first letter A-Z
  - `search` - Full-text search across name, meaning, and story
- All filters can be combined for powerful queries
- Uses FTS for efficient searching when search parameter is provided

### 3. Frontend (`web/src/components/BabyNamesPage.tsx`)
- Removed dependency on hardcoded `sanskritBabyNames`
- Added API integration with proper error handling and loading states
- Added letter filter UI (A-Z buttons)
- Dynamic fetching based on all filter combinations
- Responsive UI with proper loading and error states

### 4. Data Migration (`scripts/populate_baby_names.sql`)
- SQL script to populate initial 20 baby names
- Easily extensible for adding more names

### 5. Cleanup
- Removed hardcoded `sanskritBabyNames` export from `web/src/lib/sanskrit-data.ts`

## Deployment Status

✅ Schema applied to local and remote D1 database
✅ Initial data populated (20 names)
✅ Worker deployed with new API endpoint
✅ Frontend built successfully
✅ API tested and working

## API Examples

### Get all names:
```bash
curl "https://vaan-wordlist.keyvez.workers.dev/api/baby-names"
```

### Filter by letter:
```bash
curl "https://vaan-wordlist.keyvez.workers.dev/api/baby-names?letter=A"
```

### Filter by gender:
```bash
curl "https://vaan-wordlist.keyvez.workers.dev/api/baby-names?gender=boy"
```

### Combined filters:
```bash
curl "https://vaan-wordlist.keyvez.workers.dev/api/baby-names?gender=girl&letter=A"
```

### Search:
```bash
curl "https://vaan-wordlist.keyvez.workers.dev/api/baby-names?search=wisdom"
```

## Adding New Names

To add more baby names to the database:

1. Create a SQL file with INSERT statements following this format:
```sql
INSERT INTO baby_names (name, gender, meaning, pronunciation, story, first_letter) VALUES
  ('Name', 'boy', 'Meaning', 'pronunciation', 'Story text', 'N');
```

2. Execute locally:
```bash
wrangler d1 execute vaan_sanskrit_lexicon --file=your-file.sql
```

3. Execute remotely:
```bash
wrangler d1 execute vaan_sanskrit_lexicon --remote --file=your-file.sql
```

## Benefits

- **Scalability**: Can now handle thousands of names without bloating the frontend bundle
- **Performance**: Indexed queries and full-text search for fast filtering
- **Maintainability**: Easy to add/update names via SQL without code changes
- **Consistency**: Uses the same D1 database infrastructure as word-of-day
- **User Experience**: Letter-based browsing makes it easy to find names
