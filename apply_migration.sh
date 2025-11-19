#!/bin/bash

# Script to apply the migration for moving learning columns from baby_names to lexemes

echo "=== Moving Learning Columns Migration ==="
echo ""
echo "Step 1: Copying migration file..."

# Copy the migration file to the migrations directory
cp migration_007_move_learning_columns.sql db/d1/migrations/007_move_learning_columns_to_lexemes.sql

if [ $? -eq 0 ]; then
    echo "✓ Migration file copied successfully"
else
    echo "✗ Failed to copy migration file"
    exit 1
fi

echo ""
echo "Step 2: Applying migration to local database..."
npx wrangler d1 migrations apply vaan_sanskrit_lexicon --local

if [ $? -eq 0 ]; then
    echo "✓ Local migration applied successfully"
else
    echo "✗ Failed to apply local migration"
    exit 1
fi

echo ""
echo "Step 3: Would you like to apply to production? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Applying migration to production..."
    npx wrangler d1 migrations apply vaan_sanskrit_lexicon --remote
    
    if [ $? -eq 0 ]; then
        echo "✓ Production migration applied successfully"
    else
        echo "✗ Failed to apply production migration"
        exit 1
    fi
else
    echo "Skipping production migration"
fi

echo ""
echo "=== Migration Complete ==="
echo ""
echo "Next steps:"
echo "1. Test the /api/learning-words endpoint"
echo "2. Verify baby names feature still works"
echo "3. Check that new lexemes get learning data in the lexemes table"
