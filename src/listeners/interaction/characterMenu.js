const { Listener } = require('@sapphire/framework');

class CharacterMenuListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      event: 'interactionCreate'
    });
  }

  async run(interaction) {
    if (interaction.isButton() && interaction.customId.startsWith('character_')) {
      try {
        const { handleCharacterButton } = require('../../commands/otaku/character');
        await handleCharacterButton(interaction);
      } catch (err) {
        console.error('CharacterMenuListener error:', err);
        try {
          await interaction.followUp({ 
            content: 'Error handling button interaction.', 
            flags: 64 
          });
        } catch {}
      }
    }
  }
}

module.exports = { CharacterMenuListener }; 