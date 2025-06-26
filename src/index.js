// Load environment variables
require('dotenv').config();

const { SapphireClient } = require('@sapphire/framework');
const { GatewayIntentBits, ActivityType } = require('discord.js');
const config = require('./config');

// Membuat client Sapphire dengan konfigurasi yang diperlukan
const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  loadMessageCommandListeners: true, // Untuk message commands
  defaultPrefix: config.bot.prefix, // Prefix dari config
  presence: {
    activities: [{
      name: config.bot.presence.activity,
      type: ActivityType.Playing
    }],
    status: config.bot.presence.status
  }
});

// Event listener ketika bot berhasil login
client.once('ready', () => {
  console.log(`${config.emojis.success} ${config.bot.name} berhasil login sebagai ${client.user.tag}!`);
  console.log(`🏠 Server: ${client.guilds.cache.size}`);
  console.log(`👥 Users: ${client.users.cache.size}`);
});

// Login dengan token bot
// PENTING: Jangan pernah commit token ke repository!
// Gunakan environment variable atau file .env
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error(`${config.emojis.error} DISCORD_TOKEN tidak ditemukan di environment variables!`);
  console.error('Pastikan Anda sudah membuat file .env dan mengisi DISCORD_TOKEN');
  process.exit(1);
}

client.login(token);
