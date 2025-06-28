const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../config');

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
      .setTitle('Bot Command Menu')
      .setDescription('Select a command from the dropdown menu below to use it directly!')
      .setColor(config.colors.primary)
      .addFields(
        {
          name: 'Available Commands',
          value: 
            'Ping - Check bot latency\n' +
            'Chat - AI conversation\n' +
            'Air - Weather & air quality info\n' +
            'Socdl - Download video from Instagram, Facebook, or TikTok\n' +
            'Purge - Bulk delete messages in a channel\n' +
            'Help - Show this menu',
          inline: false
        },
        {
          name: 'How to Use',
          value: 'Select a command from the dropdown menu below, or type manually:\n' +
                 '• Slash commands: `/ping`, `/chat`, `/air`\n' +
                 '• Message commands: `!ping`, `!chat`, `!air`',
          inline: false
        }
      )
      .setFooter({ 
        text: 'Select from dropdown to use a command directly!',
        iconURL: context.client?.user?.displayAvatarURL() || undefined
      })
      .setTimestamp();

    // Create dropdown menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_command_select')
      .setPlaceholder('Select the command you want to use...')
      .addOptions([
        {
          label: 'Ping - Check Latency',
          description: 'Check bot latency and connection status',
          value: 'ping'
        },
        {
          label: 'Chat - AI Conversation', 
          description: 'Start conversation with Gemini AI',
          value: 'chat'
        },
        {
          label: 'Air - Weather & Air Quality',
          description: 'Check weather and air quality of a city',
          value: 'air'
        },
        {
          label: 'Socdl - Video Downloader',
          description: 'Download video from Instagram, Facebook, or TikTok',
          value: 'socdl'
        },
        {
          label: 'Purge - Bulk Delete Messages',
          description: 'Bulk delete messages in this channel',
          value: 'purge'
        },
        {
          label: 'Help - Show Menu',
          description: 'Show this help menu again',
          value: 'help'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return isInteraction ? 
      context.reply({ embeds: [helpEmbed], components: [row] }) : 
      context.reply({ embeds: [helpEmbed], components: [row] });
  }
}

module.exports = { HelpCommand };
