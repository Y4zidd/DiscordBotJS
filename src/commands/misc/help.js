const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../../config');

class HelpCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'help',
      description: 'Show help menu with command list'
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('help')
        .setDescription('Show help menu with command list')
    );
  }

  // Slash command
  async chatInputRun(interaction) {
    await this.showHelpMenu(interaction);
  }

  // Message command
  async messageRun(message) {
    await this.showHelpMenu(message);
  }

  async showHelpMenu(context) {
    const isInteraction = context.isCommand ? context.isCommand() : false;

    // Main help embed
    const helpEmbed = new EmbedBuilder()
      .setTitle('🤖 Y4zBot Command Center')
      .setDescription('Welcome to the ultimate Discord bot experience! 🎉\n\n**Select a command from the dropdown menu below to use it directly!**')
      .setColor('#4ECDC4')
      .addFields(
        {
          name: '🎮 **Utility Commands**',
          value: 
            '`/ping` - Check bot latency and connection status\n' +
            '`/help` - Show this help menu\n' +
            '`/purge` - Bulk delete messages (1-100)',
          inline: false
        },
        {
          name: '🤖 **AI & Information**',
          value: 
            '`/chat` - AI conversation with Gemini\n' +
            '`/air` - Weather & air quality information',
          inline: false
        },
        {
          name: '📺 **Media & Entertainment**',
          value: 
            '`/youtube` - Search videos on YouTube\n' +
            '`/socdl` - Download from Instagram/Facebook/TikTok',
          inline: false
        },
        {
          name: '📚 **Anime & Manga**',
          value: 
            '`/anime` - Search anime from HiAnime with episodes\n' +
            '`/manga` - Search manga from MangaDex with collage\n' +
            '`/character` - Search anime characters from MyAnimeList',
          inline: false
        }
      )
      .addFields(
        {
          name: '💡 **How to Use**',
          value: '**Dropdown Menu:** Select any command below for instant access!\n' +
                 '**Slash Commands:** `/ping`, `/chat`, `/anime`, `/character`\n' +
                 '**Message Commands:** `!ping`, `!chat`, `!anime`, `!character`',
          inline: false
        }
      )
      .setFooter({ 
        text: '🎯 Select from dropdown to use a command directly! • Powered by Y4zBot',
        iconURL: context.client?.user?.displayAvatarURL() || undefined
      })
      .setTimestamp();

    // Create dropdown menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_command_select')
      .setPlaceholder('🎯 Select a command to use instantly...')
      .addOptions([
        {
          label: '🏓 Ping - Check Latency',
          description: 'Check bot latency and connection status',
          value: 'ping'
        },
        {
          label: '🤖 Chat - AI Conversation', 
          description: 'Start conversation with Gemini AI',
          value: 'chat'
        },
        {
          label: '🌤️ Air - Weather & Air Quality',
          description: 'Check weather and air quality of a city',
          value: 'air'
        },
        {
          label: '📺 YouTube - Search Videos',
          description: 'Search for videos on YouTube',
          value: 'youtube'
        },
        {
          label: '⬇️ Socdl - Video Downloader',
          description: 'Download video from Instagram, Facebook, or TikTok',
          value: 'socdl'
        },
        {
          label: '🗑️ Purge - Bulk Delete Messages',
          description: 'Bulk delete messages in this channel',
          value: 'purge'
        },
        {
          label: '❓ Help - Show Menu',
          description: 'Show this help menu again',
          value: 'help'
        },
        {
          label: '📚 Manga - Search Manga',
          description: 'Search manga from MangaDex with interactive collage & unlimited pagination',
          value: 'manga'
        },
        {
          label: '🎬 Anime - Search Anime',
          description: 'Search anime from HiAnime (Aniwatch) with embed navigation and episode list',
          value: 'anime'
        },
        {
          label: '👤 Character - Search Characters',
          description: 'Search anime characters from MyAnimeList with detailed info and voice actors',
          value: 'character'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return isInteraction ? 
      context.reply({ embeds: [helpEmbed], components: [row] }) : 
      context.reply({ embeds: [helpEmbed], components: [row] });
  }
}

module.exports = { HelpCommand };
