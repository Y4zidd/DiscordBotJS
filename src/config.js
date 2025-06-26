// Konfigurasi bot
module.exports = {
  // Bot settings
  bot: {
    name: 'Discord Bot JS',
    version: '1.0.0',
    description: 'Bot Discord menggunakan Sapphire.js',
    author: 'Your Name',
    prefix: '!',
    presence: {
      activity: 'dengan Sapphire.js',
      type: 'PLAYING', // PLAYING, STREAMING, LISTENING, WATCHING
      status: 'online' // online, idle, dnd, invisible
    }
  },

  // Colors untuk embeds
  colors: {
    primary: 0x0099ff,
    success: 0x00ff00,
    warning: 0xffff00,
    error: 0xff0000,
    info: 0x00ffff
  },

  // Emojis
  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    ping: '🏓',
    bot: '🤖',
    loading: '⏳'
  },

  // Links
  links: {
    github: 'https://github.com/your-username/discord-bot-js',
    support: 'https://discord.gg/your-support-server',
    invite: 'https://discord.com/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=YOUR_PERMISSIONS&scope=bot%20applications.commands'
  }
};
