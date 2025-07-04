module.exports = {
  apps: [
    {
      name: 'discord-bot',
      script: './src/index.js',
      cwd: '/root/DiscordBotJS',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './src/pm2/logs/err.log',
      out_file: './src/pm2/logs/out.log',
      log_file: './src/pm2/logs/combined.log',
      time: true,
      // Restart delay
      restart_delay: 4000,
      // Maximum number of restart
      max_restarts: 10,
      // Minimum uptime before considering restart
      min_uptime: '10s'
    }
  ]
};
