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
        case 'socdl_modal':
          await this.handleSocdlModal(interaction);
          break;
        case 'purge_modal':
          await this.handlePurgeModal(interaction);
          break;
        case 'manga_modal':
          await this.handleMangaModal(interaction);
          break;
      }
    } catch (error) {
      console.error('Error handling modal submit:', error);
      await interaction.reply({ 
        content: 'An error occurred while processing input!', 
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
        content: 'Chat command not found!', 
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
        content: 'Air command not found!', 
        ephemeral: true 
      });
    }
  }

  async handleSocdlModal(interaction) {
    const url = interaction.fields.getTextInputValue('socdl_url');
    // Get the socdl command and run it directly
    const socdlCommand = this.container.stores.get('commands').get('socdl');
    if (socdlCommand) {
      // Simulate a slash command interaction by calling the handler
      // Sapphire's chatInputRun expects a ChatInputCommandInteraction, but we can call the same logic
      // We'll call the handler and pass the url as if it was a slash command
      // You may need to adapt socdl.js to support this if it doesn't already
      interaction.options = {
        getString: () => url
      };
      await socdlCommand.chatInputRun(interaction);
    } else {
      await interaction.reply({
        content: 'Socdl command not found!',
        ephemeral: true
      });
    }
  }

  async handlePurgeModal(interaction) {
    const amountStr = interaction.fields.getTextInputValue('purge_amount');
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      await interaction.reply({
        content: 'Please enter a valid number between 1 and 100.',
        ephemeral: true
      });
      return;
    }
    // Get the purge command and run it directly
    const purgeCommand = this.container.stores.get('commands').get('purge');
    if (purgeCommand) {
      interaction.options = {
        getInteger: () => amount
      };
      await purgeCommand.chatInputRun(interaction);
    } else {
      await interaction.reply({
        content: 'Purge command not found!',
        ephemeral: true
      });
    }
  }

  async handleMangaModal(interaction) {
    const mangaTitle = interaction.fields.getTextInputValue('manga_title');
    // Get the manga command and run it directly
    const mangaCommand = this.container.stores.get('commands').get('manga');
    if (mangaCommand) {
      interaction.options = {
        getString: () => mangaTitle
      };
      await mangaCommand.chatInputRun(interaction);
    } else {
      await interaction.reply({
        content: 'Manga command not found!',
        ephemeral: true
      });
    }
  }
}

module.exports = { ModalSubmitListener };
