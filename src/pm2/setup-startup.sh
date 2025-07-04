#!/bin/bash

# Script untuk setup startup otomatis
echo "🔧 Setting up auto-startup for Discord Bot..."

# Save current PM2 process list
pm2 save

# Generate startup script
echo "📝 Generating startup script..."
sudo pm2 startup

echo ""
echo "✅ Auto-startup configured!"
echo ""
echo "ℹ️  Sekarang bot akan otomatis start ketika VPS restart"
echo "ℹ️  Untuk disable auto-startup: pm2 unstartup"
