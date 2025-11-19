-- Migration: Move learning columns from baby_names to lexemes
-- These columns are for learning Sanskrit words, not specifically for baby names

-- Add learning-related columns to lexemes table
ALTER TABLE lexemes ADD COLUMN improved_translation TEXT;
ALTER TABLE lexemes ADD COLUMN example_phrase TEXT;
ALTER TABLE lexemes ADD COLUMN difficulty_level TEXT;
ALTER TABLE lexemes ADD COLUMN quiz_choices TEXT; -- JSON array of incorrect choices for quizzes

-- Copy existing data from baby_names to lexemes (if any exists)
UPDATE lexemes
SET
  improved_translation = (SELECT improved_translation FROM baby_names WHERE baby_names.lexeme_id = lexemes.id),
  example_phrase = (SELECT example_phrase FROM baby_names WHERE baby_names.lexeme_id = lexemes.id),
  difficulty_level = (SELECT difficulty_level FROM baby_names WHERE baby_names.lexeme_id = lexemes.id),
  quiz_choices = (SELECT quiz_choices FROM baby_names WHERE baby_names.lexeme_id = lexemes.id)
WHERE EXISTS (SELECT 1 FROM baby_names WHERE baby_names.lexeme_id = lexemes.id);

-- Remove learning columns from baby_names table
-- Note: SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
CREATE TABLE baby_names_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  gender TEXT NOT NULL,
  meaning TEXT,
  pronunciation TEXT,
  story TEXT,
  reasoning TEXT,
  first_letter TEXT,
  lexeme_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lexeme_id) REFERENCES lexemes(id)
);

-- Copy data from old table to new table
INSERT INTO baby_names_new (id, name, slug, gender, meaning, pronunciation, story, reasoning, first_letter, lexeme_id, created_at)
SELECT id, name, slug, gender, meaning, pronunciation, story, reasoning, first_letter, lexeme_id, created_at
FROM baby_names;

-- Drop old table and rename new table
DROP TABLE baby_names;
ALTER TABLE baby_names_new RENAME TO baby_names;

-- Recreate FTS index if it exists
DROP TABLE IF EXISTS baby_names_fts;
CREATE VIRTUAL TABLE baby_names_fts USING fts5(name, meaning, content=baby_names, content_rowid=id);

-- Populate FTS index
INSERT INTO baby_names_fts(rowid, name, meaning)
SELECT id, name, meaning FROM baby_names;

-- Create triggers to keep FTS in sync
CREATE TRIGGER baby_names_ai AFTER INSERT ON baby_names BEGIN
  INSERT INTO baby_names_fts(rowid, name, meaning) VALUES (new.id, new.name, new.meaning);
END;

CREATE TRIGGER baby_names_ad AFTER DELETE ON baby_names BEGIN
  INSERT INTO baby_names_fts(baby_names_fts, rowid, name, meaning) VALUES('delete', old.id, old.name, old.meaning);
END;

CREATE TRIGGER baby_names_au AFTER UPDATE ON baby_names BEGIN
  INSERT INTO baby_names_fts(baby_names_fts, rowid, name, meaning) VALUES('delete', old.id, old.name, old.meaning);
  INSERT INTO baby_names_fts(rowid, name, meaning) VALUES (new.id, new.name, new.meaning);
END;
