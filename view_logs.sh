#!/bin/bash

# Script to view Gemini API logs in real-time

echo "=== Cloudflare Worker Logs Monitor ==="
echo ""
echo "This will tail the logs from your deployed worker."
echo "The Gemini API logs will appear when:"
echo "  1. Someone visits /api/baby-names (triggers background processing)"
echo "  2. There are unprocessed lexemes in the database"
echo ""
echo "Starting log tail..."
echo ""

npx wrangler tail --format pretty
