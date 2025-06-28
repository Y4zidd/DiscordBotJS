// Load environment variables
require('dotenv').config();

const { SapphireClient } = require('@sapphire/framework');
const { GatewayIntentBits, ActivityType } = require('discord.js');
const config = require('./config');

// Create Sapphire client with required configuration
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
  console.log(`${config.bot.name} successfully entered as ${client.user.tag}!`);
  console.log(`Server: ${client.guilds.cache.size}`);
  console.log(`Users: ${client.users.cache.size}`);
});

// Login with bot token
// IMPORTANT: Never commit tokens to repository!
// Use environment variables or .env file
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error(`DISCORD_TOKEN not found in environment variables!`);
  console.error('Make sure you have created a .env file and filled in DISCORD_TOKEN');
  process.exit(1);
}

client.login(token);
