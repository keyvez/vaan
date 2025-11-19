# Migration: Move Learning Columns from Baby Names to Lexemes

## Summary
Moved learning-related columns (`difficulty_level`, `quiz_choices`, `improved_translation`, `example_phrase`) from the `baby_names` table to the `lexemes` table where they belong. These columns are for learning Sanskrit words in general, not specifically for baby names.

## Changes Made

### 1. Code Changes (`worker/src/index.js`)

#### Updated `processBatchResults()` function (lines 551-556)
- Now updates the `lexemes` table with learning fields when processing Gemini API results
- Stores `improved_translation`, `example_phrase`, `difficulty_level`, and `quiz_choices` in lexemes

#### Updated `saveBabyName()` function (lines 722-763)
- Removed learning-related parameters from function signature
- Removed learning columns from INSERT statement
- Now only stores baby-name-specific data (name, slug, gender, meaning, pronunciation, story, reasoning)

#### Updated `getLearningWords()` function (lines 773-800)
- Changed to fetch from `lexemes` table instead of `baby_names` table
- Uses `sanskrit` and `transliteration` columns directly instead of aliasing from `name` and `pronunciation`
- Uses `primary_meaning` instead of `meaning`

### 2. Database Migration

A migration file has been created at: `migration_007_move_learning_columns.sql`

**You need to manually copy this file to:** `db/d1/migrations/007_move_learning_columns_to_lexemes.sql`

The migration will:
1. Add new columns to `lexemes` table:
   - `improved_translation TEXT`
   - `example_phrase TEXT`
   - `difficulty_level TEXT`
   - `quiz_choices TEXT` (JSON array)

2. Copy existing data from `baby_names` to `lexemes` (if any exists)

3. Remove these columns from `baby_names` table by recreating it

4. Recreate the FTS (Full-Text Search) index and triggers for `baby_names`

## How to Apply the Migration

1. Copy the migration file:
   ```bash
   cp migration_007_move_learning_columns.sql db/d1/migrations/007_move_learning_columns_to_lexemes.sql
   ```

2. Apply the migration to your local D1 database:
   ```bash
   npx wrangler d1 migrations apply vaan_sanskrit_lexicon --local
   ```

3. Apply the migration to production:
   ```bash
   npx wrangler d1 migrations apply vaan_sanskrit_lexicon --remote
   ```

## Impact

### Before
- Learning data was stored in `baby_names` table
- This mixed concerns: baby naming + Sanskrit learning
- Learning words API fetched from `baby_names`

### After
- Learning data is stored in `lexemes` table
- Clean separation: `baby_names` is only for baby naming feature
- Learning words API fetches from `lexemes` (all Sanskrit words)
- Gemini API enriches all lexemes with learning data, not just baby names

## Benefits

1. **Proper data modeling**: Learning features apply to all Sanskrit words, not just baby names
2. **Scalability**: Can now provide learning features for all lexemes in the database
3. **Clarity**: Clear separation between baby naming feature and learning feature
4. **Flexibility**: Can add more learning-related columns to lexemes without affecting baby names

## Testing

After applying the migration, verify:
1. The `/api/learning-words` endpoint still works correctly
2. Existing learning progress is preserved
3. New lexemes processed by Gemini API get learning data in the correct table
4. Baby names feature still works as expected
