const { Listener } = require('@sapphire/framework');
const { handleAnimeButton } = require('../../commands/otaku/anime');

class AnimeMenuListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      event: 'interactionCreate'
    });
  }

  async run(interaction) {
    // Ganti prefix dari 'anime_' ke 'anime|' agar sesuai dengan customId baru
    if (interaction.isButton() && interaction.customId.startsWith('anime|')) {
      await handleAnimeButton(interaction);
    }
  }
}

module.exports = { AnimeMenuListener };
