// Bot configuration
module.exports = {
  // Bot settings
  bot: {
    name: 'Discord Bot JS',
    version: '1.0.0',
    description: 'Discord Bot using Sapphire.js',
    author: 'Yazid'
  },

  // Colors for embeds
  colors: {
    primary: 0x0099ff,
    success: 0x00ff00,
    warning: 0xffff00,
    error: 0xff0000,
    info: 0x00ffff,
    anime: 0xff6b9d,
    youtube: 0xff0000
  },

  // Timeout settings (in milliseconds)
  timeouts: {
    animeSession: 180000,      // 3 minutes - anime search session
    youtubeCache: 1800000,     // 30 minutes - youtube cache
    buttonInteraction: 15000,  // 15 seconds - button response timeout
    aiResponse: 30000          // 30 seconds - AI response timeout
  },

  // Cache settings
  cache: {
    cleanupInterval: 600000,   // 10 minutes - cleanup check interval
    maxEntries: 1000,          // Maximum cache entries per type
    animeExpiry: 180000,       // 3 minutes - anime session expiry
    youtubeExpiry: 1800000     // 30 minutes - youtube cache expiry
  },

  // Pagination settings
  pagination: {
    episodesPerPage: 10,       // Episodes shown per page
    maxSearchPages: 5,         // Maximum search result pages
    maxEpisodeButtons: 25      // Maximum episode buttons per message
  },

  // API limits and settings
  limits: {
    messageLength: 2000,       // Discord message character limit
    embedFieldLength: 1024,    // Discord embed field character limit
    embedDescriptionLength: 4096, // Discord embed description limit
    maxSearchResults: 50       // Maximum search results to process
  },

  // Links
  links: {
    github: 'https://github.com/Y4zidd/discord-bot-js',
    support: 'https://discord.gg/4CMU8nds',
    hiAnime: 'https://hianime.to',
    youtube: 'https://youtube.com'
  }
};
