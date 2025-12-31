#!/bin/bash

# Refactoring Script: Orders to Records
# This script helps automate the renaming of files and updating imports

echo "🚀 Starting codebase refactoring..."

# Create backup
echo "📦 Creating backup..."
mkdir -p .refactor-backup
cp -r components .refactor-backup/
cp -r app .refactor-backup/
echo "✅ Backup created in .refactor-backup/"

# Rename component files
echo "📝 Renaming component files..."
if [ -f "components/order-form.tsx" ]; then
  echo "  - Keeping order-form.tsx for backward compatibility"
fi

if [ -f "components/orders-table.tsx" ]; then
  mv components/orders-table.tsx components/records-table.tsx
  echo "  ✅ Renamed orders-table.tsx → records-table.tsx"
fi

if [ -f "components/admin-orders-table.tsx" ]; then
  mv components/admin-orders-table.tsx components/admin-records-table.tsx
  echo "  ✅ Renamed admin-orders-table.tsx → admin-records-table.tsx"
fi

# Rename API route directories
echo "📝 Renaming API directories..."
if [ -d "app/api/orders" ]; then
  mv app/api/orders app/api/records
  echo "  ✅ Renamed app/api/orders → app/api/records"
fi

echo ""
echo "✅ File renaming complete!"
echo ""
echo "⚠️  Manual steps required:"
echo "  1. Update imports in all files"
echo "  2. Update API endpoint calls"
echo "  3. Update UI text from 'order' to 'record'"
echo "  4. Test all functionality"
echo ""
echo "📋 Use the following commands to help with text replacement:"
echo ""
echo "  # Find all files with 'order' references:"
echo "  grep -r 'order' --include='*.tsx' --include='*.ts' app/ components/"
echo ""
echo "  # Find all API calls to /api/orders:"
echo "  grep -r '/api/orders' --include='*.tsx' --include='*.ts' ."
echo ""
echo "💡 Tip: Review REFACTORING_GUIDE.md for detailed instructions"
