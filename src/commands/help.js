const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../config');

class HelpCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'help',
      description: 'Tampilkan menu bantuan dengan daftar command'
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('help')
        .setDescription('Tampilkan menu bantuan dengan daftar command')
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
      .setTitle('🤖 **Bot Command Menu**')
      .setDescription('Pilih command dari dropdown menu di bawah untuk langsung menggunakannya!')
      .setColor(config.colors.primary)
      .addFields(
        {
          name: '📋 **Available Commands**',
          value: 
            '🏓 **Ping** - Check bot latency\n' +
            '💬 **Chat** - AI conversation\n' +
            '🌤️ **Air** - Weather & air quality info\n' +
            '❓ **Help** - Show this menu',
          inline: false
        },
        {
          name: '💡 **How to Use**',
          value: 'Pilih command dari dropdown menu di bawah, atau ketik manual:\n' +
                 '• Slash commands: `/ping`, `/chat`, `/air`\n' +
                 '• Message commands: `!ping`, `!chat`, `!air`',
          inline: false
        }
      )
      .setFooter({ 
        text: 'Pilih dari dropdown untuk langsung menggunakan command!',
        iconURL: context.client?.user?.displayAvatarURL() || undefined
      })
      .setTimestamp();

    // Create dropdown menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_command_select')
      .setPlaceholder('🔽 Pilih command yang ingin digunakan...')
      .addOptions([
        {
          label: 'Ping - Check Latency',
          description: 'Cek latensi dan status koneksi bot',
          value: 'ping',
          emoji: '🏓'
        },
        {
          label: 'Chat - AI Conversation', 
          description: 'Mulai percakapan dengan AI Gemini',
          value: 'chat',
          emoji: '💬'
        },
        {
          label: 'Air - Weather & Air Quality',
          description: 'Cek cuaca dan kualitas udara suatu kota',
          value: 'air',
          emoji: '🌤️'
        },
        {
          label: 'Help - Show Menu',
          description: 'Tampilkan menu bantuan ini lagi',
          value: 'help',
          emoji: '❓'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return isInteraction ? 
      context.reply({ embeds: [helpEmbed], components: [row] }) : 
      context.reply({ embeds: [helpEmbed], components: [row] });
  }
}

module.exports = { HelpCommand };
