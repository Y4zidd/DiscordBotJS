#!/bin/bash

# Script untuk memulai Discord Bot dengan PM2
echo "🚀 Starting Discord Bot with PM2..."

# Pindah ke direktori project
cd /root/DiscordBotJS

# Install dependencies jika belum ada
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start bot dengan PM2
pm2 start pm2/ecosystem.config.js

# Show status
echo "✅ Bot started! Status:"
pm2 status

echo ""
echo "📋 Useful commands:"
echo "   pm2 status          - Lihat status bot"
echo "   pm2 logs discord-bot - Lihat logs bot"
echo "   pm2 restart discord-bot - Restart bot"
echo "   pm2 stop discord-bot - Stop bot"
echo "   pm2 delete discord-bot - Hapus bot dari PM2"
