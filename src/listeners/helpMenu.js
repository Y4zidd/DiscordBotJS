const { Listener } = require('@sapphire/framework');
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

class HelpMenuListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      event: 'interactionCreate'
    });
  }

  async run(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'help_command_select') return;

    const selectedValue = interaction.values[0];

    try {
      switch (selectedValue) {
        case 'ping':
          await this.handlePing(interaction);
          break;
        case 'chat':
          await this.handleChat(interaction);
          break;
        case 'air':
          await this.handleAir(interaction);
          break;
        case 'help':
          await this.handleHelp(interaction);
          break;
        default:
          await interaction.reply({ 
            content: '❌ Command tidak dikenali!', 
            ephemeral: true 
          });
      }
    } catch (error) {
      console.error('Error handling help menu selection:', error);
      await interaction.reply({ 
        content: '❌ Terjadi kesalahan saat memproses command!', 
        ephemeral: true 
      });
    }
  }

  async handlePing(interaction) {
    const msg = await interaction.reply({ 
      content: 'Ping?', 
      fetchReply: true 
    });

    const diff = msg.createdTimestamp - interaction.createdTimestamp;
    const ping = Math.round(interaction.client.ws.ping);

    return interaction.editReply(
      `Pong! 🏓\n` +
      `📡 **Latensi API**: ${diff}ms\n` +
      `💓 **Heartbeat**: ${ping}ms`
    );
  }

  async handleChat(interaction) {
    // Create modal for chat input
    const modal = new ModalBuilder()
      .setCustomId('chat_modal')
      .setTitle('💬 Chat dengan AI');

    const chatInput = new TextInputBuilder()
      .setCustomId('chat_message')
      .setLabel('Pesan untuk AI')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ketik pesan Anda disini...')
      .setRequired(true)
      .setMaxLength(2000);

    const firstActionRow = new ActionRowBuilder().addComponents(chatInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }

  async handleAir(interaction) {
    // Create modal for city input
    const modal = new ModalBuilder()
      .setCustomId('air_modal')
      .setTitle('🌤️ Cek Cuaca & Kualitas Udara');

    const cityInput = new TextInputBuilder()
      .setCustomId('city_name')
      .setLabel('Nama Kota')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Contoh: Jakarta, Surabaya, Tokyo')
      .setRequired(true)
      .setMaxLength(100);

    const firstActionRow = new ActionRowBuilder().addComponents(cityInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }

  async handleHelp(interaction) {
    // Get the help command and run it
    const helpCommand = this.container.stores.get('commands').get('help');
    if (helpCommand) {
      await helpCommand.showHelpMenu(interaction);
    } else {
      await interaction.reply({ 
        content: '❌ Help command tidak ditemukan!', 
        ephemeral: true 
      });
    }
  }
}

module.exports = { HelpMenuListener };
