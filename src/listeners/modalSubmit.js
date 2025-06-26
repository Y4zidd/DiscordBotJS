const { Listener } = require('@sapphire/framework');

class ModalSubmitListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      event: 'interactionCreate'
    });
  }

  async run(interaction) {
    if (!interaction.isModalSubmit()) return;

    try {
      switch (interaction.customId) {
        case 'chat_modal':
          await this.handleChatModal(interaction);
          break;
        case 'air_modal':
          await this.handleAirModal(interaction);
          break;
      }
    } catch (error) {
      console.error('Error handling modal submit:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while processing input!', 
        ephemeral: true 
      });
    }
  }

  async handleChatModal(interaction) {
    const chatMessage = interaction.fields.getTextInputValue('chat_message');
    
    // Get the chat command and run it directly
    const chatCommand = this.container.stores.get('commands').get('chat');
    if (chatCommand) {
      await chatCommand.handleChat(interaction, chatMessage);
    } else {
      await interaction.reply({ 
        content: '❌ Chat command not found!', 
        ephemeral: true 
      });
    }
  }

  async handleAirModal(interaction) {
    const cityName = interaction.fields.getTextInputValue('city_name');
    
    // Get the air command and run it directly
    const airCommand = this.container.stores.get('commands').get('air');
    if (airCommand) {
      await airCommand.handleAirQualityAndWeather(interaction, cityName);
    } else {
      await interaction.reply({ 
        content: '❌ Air command not found!', 
        ephemeral: true 
      });
    }
  }
}

module.exports = { ModalSubmitListener };
