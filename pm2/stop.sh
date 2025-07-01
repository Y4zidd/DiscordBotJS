#!/bin/bash

# Script untuk stop Discord Bot
echo "🛑 Stopping Discord Bot..."

pm2 stop discord-bot
pm2 delete discord-bot

echo "✅ Bot stopped and removed from PM2"
