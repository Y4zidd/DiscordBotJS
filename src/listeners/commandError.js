const { Listener } = require('@sapphire/framework');
const { Events } = require('discord.js');

class CommandErrorListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      event: 'commandError'
    });
  }

  run(error, { command, message, interaction }) {
    console.error(`❌ Error in command ${command.name}:`, error);
    
    const errorMessage = '❌ Terjadi error saat menjalankan command ini!';
    
    if (interaction) {
      // Error di slash command
      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({
          content: errorMessage,
          ephemeral: true
        });
      } else {
        return interaction.reply({
          content: errorMessage,
          ephemeral: true
        });
      }
    } else if (message) {
      // Error di message command
      return message.reply(errorMessage);
    }
  }
}

module.exports = { CommandErrorListener };
