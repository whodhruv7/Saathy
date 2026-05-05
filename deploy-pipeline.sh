#!/bin/bash

echo "=========================================="
echo "DEPLOYING SAATHY PIPELINE EDGE FUNCTION"
echo "=========================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "ERROR: Supabase CLI not found!"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo "Setting OPENROUTER_API_KEY secret..."
supabase secrets set OPENROUTER_API_KEY=$OPENROUTER_API_KEY --project-ref vwcqhznkajipsummeemv

echo ""
echo "Deploying pipeline function..."
supabase functions deploy pipeline --project-ref vwcqhznkajipsummeemv

echo ""
echo "=========================================="
echo "DEPLOY COMPLETE!"
echo "=========================================="
echo ""
echo "Test the pipeline:"
echo "1. Open browser console (F12)"
echo "2. Send a research query"
echo "3. Check console logs"
echo ""
read -p "Press Enter to continue..."
