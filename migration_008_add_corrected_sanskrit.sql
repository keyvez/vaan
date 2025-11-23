-- Migration: Add corrected_sanskrit field to lexemes table
-- This field stores the corrected Sanskrit spelling suggested by Gemini AI
-- when the original sanskrit field appears to contain OCR errors

ALTER TABLE lexemes ADD COLUMN corrected_sanskrit TEXT;

-- Index for quick lookups of corrected words
CREATE INDEX IF NOT EXISTS idx_lexemes_corrected_sanskrit ON lexemes(corrected_sanskrit);
