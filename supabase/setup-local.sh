#!/bin/bash
# Quick setup script for Pawpals local Supabase environment

set -e

echo "🚀 Pawpals Supabase Setup Script"
echo "=================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "✅ Supabase CLI found"
echo ""

# Initialize Supabase if needed
if [ ! -d "supabase" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
fi

echo ""
echo "🗄️  Starting local Supabase..."
supabase start

echo ""
echo "✨ Local Supabase started!"
echo ""
echo "📝 Next steps:"
echo "1. Your database is running locally on postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo "2. Supabase Studio is available at http://localhost:54323"
echo "3. API is available at http://localhost:54321"
echo "4. Migrations in supabase/migrations/ are automatically applied"
echo ""
echo "🧪 To test the setup:"
echo "   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo "   SELECT * FROM core.accounts;"
echo ""
echo "🔄 To reset the database:"
echo "   supabase db reset"
echo ""
echo "📤 To push changes to production:"
echo "   supabase db push"
echo ""
