# PM2 Configuration for Discord Bot

This folder contains configuration and scripts to run Discord bot using PM2 Process Manager.

## 📁 Folder Structure
```
pm2/
├── ecosystem.config.js   # PM2 Configuration
├── start.sh             # Script to start bot
├── stop.sh              # Script to stop bot  
├── monitor.sh           # Script for monitoring
├── setup-startup.sh     # Script for auto-startup setup
├── logs/                # Folder for log files
└── README.md           # This documentation
```

## 🚀 How to Use

### 1. Install PM2 (if not installed)
```bash
npm install -g pm2
```

### 2. Start Bot
```bash
# Using script
./src/pm2/start.sh

# Or using npm
npm run pm2:start

# Or directly with PM2
pm2 start src/pm2/ecosystem.config.js
```

### 3. Monitoring Bot
```bash
# View status
pm2 status

# View logs real-time
pm2 logs discord-bot

# Monitor resource usage
./src/pm2/monitor.sh
```

### 4. Control Bot
```bash
# Restart bot
pm2 restart discord-bot

# Stop bot
pm2 stop discord-bot

# Delete from PM2
pm2 delete discord-bot
```

### 5. Setup Auto-Startup (Optional)
```bash
# Setup auto-start when VPS restarts
./src/pm2/setup-startup.sh
```

## 📊 Log Files

Log files are stored in `src/pm2/logs/`:
- `combined.log` - All logs
- `out.log` - Output log  
- `err.log` - Error log

## 🔧 Configuration

Edit `ecosystem.config.js` to change:
- Memory limit
- Restart policy
- Environment variables
- Log rotation

## 📋 Useful Commands

```bash
# View all PM2 processes
pm2 list

# Save current configuration
pm2 save

# Restart all processes
pm2 restart all

# Stop all processes
pm2 stop all

# Clear logs
pm2 flush

# Reload (zero downtime restart)
pm2 reload discord-bot
```

## ❗ Important Notes

- Bot will automatically restart if it crashes
- Memory limit is set to 1GB
- Log rotation is automatically active
- Use `pm2 save` after configuration changes
