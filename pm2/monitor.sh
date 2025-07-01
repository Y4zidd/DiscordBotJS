#!/bin/bash

# Script untuk monitoring Discord Bot
echo "📊 Discord Bot Monitoring Dashboard"
echo "=================================="

# Check if bot is running
if pm2 list | grep -q "discord-bot"; then
    echo "✅ Bot Status: RUNNING"
    echo ""
    
    # Show detailed status
    pm2 status discord-bot
    
    echo ""
    echo "📈 Memory & CPU Usage:"
    pm2 monit discord-bot &
    
    echo ""
    echo "📋 Available commands:"
    echo "   pm2 logs discord-bot --lines 50  - Lihat 50 log terakhir"
    echo "   pm2 restart discord-bot          - Restart bot"
    echo "   pm2 reload discord-bot           - Reload bot (zero downtime)"
    echo "   pm2 flush discord-bot            - Clear logs"
    echo "   Ctrl+C                           - Exit monitoring"
    
else
    echo "❌ Bot Status: NOT RUNNING"
    echo ""
    echo "🚀 To start the bot, run:"
    echo "   ./pm2/start.sh"
fi
