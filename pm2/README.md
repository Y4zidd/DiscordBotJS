# PM2 Configuration untuk Discord Bot

Folder ini berisi konfigurasi dan script untuk menjalankan Discord bot menggunakan PM2 Process Manager.

## 📁 Struktur Folder
```
pm2/
├── ecosystem.config.js   # Konfigurasi PM2
├── start.sh             # Script untuk start bot
├── stop.sh              # Script untuk stop bot  
├── monitor.sh           # Script untuk monitoring
├── setup-startup.sh     # Script setup auto-startup
├── logs/                # Folder untuk log files
└── README.md           # Dokumentasi ini
```

## 🚀 Cara Penggunaan

### 1. Install PM2 (jika belum ada)
```bash
npm install -g pm2
```

### 2. Start Bot
```bash
# Menggunakan script
./pm2/start.sh

# Atau menggunakan npm
npm run pm2:start

# Atau langsung PM2
pm2 start pm2/ecosystem.config.js
```

### 3. Monitoring Bot
```bash
# Lihat status
pm2 status

# Lihat logs real-time
pm2 logs discord-bot

# Monitor resource usage
./pm2/monitor.sh
```

### 4. Kontrol Bot
```bash
# Restart bot
pm2 restart discord-bot

# Stop bot
pm2 stop discord-bot

# Delete dari PM2
pm2 delete discord-bot
```

### 5. Setup Auto-Startup (Optional)
```bash
# Setup agar bot auto-start saat VPS restart
./pm2/setup-startup.sh
```

## 📊 Log Files

Log files disimpan di `pm2/logs/`:
- `combined.log` - Semua log
- `out.log` - Output log  
- `err.log` - Error log

## 🔧 Konfigurasi

Edit `ecosystem.config.js` untuk mengubah:
- Memory limit
- Restart policy
- Environment variables
- Log rotation

## 📋 Perintah Berguna

```bash
# Lihat semua proses PM2
pm2 list

# Save konfigurasi saat ini
pm2 save

# Restart semua proses
pm2 restart all

# Stop semua proses
pm2 stop all

# Clear logs
pm2 flush

# Reload (zero downtime restart)
pm2 reload discord-bot
```

## ❗ Catatan Penting

- Bot akan otomatis restart jika crash
- Memory limit di-set ke 1GB
- Log rotation otomatis aktif
- Gunakan `pm2 save` setelah perubahan konfigurasi
