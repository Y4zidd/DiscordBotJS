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
        case 'socdl':
          await this.handleSocdl(interaction);
          break;
        case 'purge':
          await this.handlePurge(interaction);
          break;
        case 'manga':
          await this.handleManga(interaction);
          break;
        case 'anime':
          await this.handleAnime(interaction);
          break;
        case 'youtube':
          await this.handleYoutube(interaction);
          break;
        case 'character':
          await this.handleCharacter(interaction);
          break;
        default:
          await interaction.reply({ 
            content: 'Command not recognized!', 
            ephemeral: true 
          });
      }
    } catch (error) {
      console.error('Error handling help menu selection:', error);
      await interaction.reply({ 
        content: 'An error occurred while processing command!', 
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
      `Pong!\n` +
      `API Latency: ${diff}ms\n` +
      `Heartbeat: ${ping}ms`
    );
  }

  async handleChat(interaction) {
    // Create modal for chat input
    const modal = new ModalBuilder()
      .setCustomId('chat_modal')
      .setTitle('Chat with AI');

    const chatInput = new TextInputBuilder()
      .setCustomId('chat_message')
      .setLabel('Message for AI')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Type your message here...')
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
      .setTitle('Check Weather & Air Quality');

    const cityInput = new TextInputBuilder()
      .setCustomId('city_name')
      .setLabel('City Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Example: Jakarta, Surabaya, Tokyo')
      .setRequired(true)
      .setMaxLength(100);

    const firstActionRow = new ActionRowBuilder().addComponents(cityInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }

  async handleHelp(interaction) {
    await interaction.reply({
      content: 'Help menu is already open.',
      ephemeral: true
    });
  }

  async handleSocdl(interaction) {
    // Create modal for socdl input
    const modal = new ModalBuilder()
      .setCustomId('socdl_modal')
      .setTitle('Download Video (IG/FB/TT)');

    const urlInput = new TextInputBuilder()
      .setCustomId('socdl_url')
      .setLabel('Video URL')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Paste Instagram/Facebook/TikTok URL here')
      .setRequired(true)
      .setMaxLength(300);

    const firstActionRow = new ActionRowBuilder().addComponents(urlInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }

  async handlePurge(interaction) {
    // Create modal for purge input
    const modal = new ModalBuilder()
      .setCustomId('purge_modal')
      .setTitle('Bulk Delete Messages');

    const amountInput = new TextInputBuilder()
      .setCustomId('purge_amount')
      .setLabel('Number of messages to delete (1-100)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Example: 10')
      .setRequired(true)
      .setMaxLength(3);

    const firstActionRow = new ActionRowBuilder().addComponents(amountInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }

  async handleManga(interaction) {
    // Create modal for manga search input
    const modal = new ModalBuilder()
      .setCustomId('manga_modal')
      .setTitle('Search Manga (MangaDex)');

    const mangaInput = new TextInputBuilder()
      .setCustomId('manga_title')
      .setLabel('Manga Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Example: One Piece, Naruto, etc.')
      .setRequired(true)
      .setMaxLength(100);

    const firstActionRow = new ActionRowBuilder().addComponents(mangaInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }

  async handleAnime(interaction) {
    // Create modal for anime search input
    const modal = new ModalBuilder()
      .setCustomId('anime_modal')
      .setTitle('Search Anime (HiAnime)');

    const animeInput = new TextInputBuilder()
      .setCustomId('anime_title')
      .setLabel('Anime Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Example: Naruto, One Piece, Kaguya-sama, etc.')
      .setRequired(true)
      .setMaxLength(100);

    const firstActionRow = new ActionRowBuilder().addComponents(animeInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }

  async handleYoutube(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('youtube_modal')
      .setTitle('Search YouTube');

    const queryInput = new TextInputBuilder()
      .setCustomId('youtube_title')
      .setLabel('Video title to search for')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter video title...')
      .setRequired(true)
      .setMaxLength(100);

    const firstActionRow = new ActionRowBuilder().addComponents(queryInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }

  async handleCharacter(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('character_modal')
      .setTitle('Search Anime Character (MyAnimeList)');

    const characterInput = new TextInputBuilder()
      .setCustomId('character_name')
      .setLabel('Character Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Example: Reimu Hakurei, Naruto, Luffy, etc.')
      .setRequired(true)
      .setMaxLength(100);

    const firstActionRow = new ActionRowBuilder().addComponents(characterInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }
}

module.exports = { HelpMenuListener };
