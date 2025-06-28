const { Command } = require('@sapphire/framework');
const { ApplicationCommandType } = require('discord.js');

class SayCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'say',
      description: 'Make the bot say something'
    });
  }

  // Register slash command with options
  registerApplicationCommands(registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          name: 'message',
          description: 'The message you want the bot to say',
          type: 3, // STRING type
          required: true
        }
      ]
    });
  }

  // Slash command
  async chatInputRun(interaction) {
    const message = interaction.options.getString('message');
    
    // Check if user has permission to use this command
    if (!interaction.member.permissions.has('ManageMessages')) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: 'Message sent successfully!',
      ephemeral: true
    });

    return interaction.followUp(message);
  }

  // Message command
  async messageRun(message, args) {
    // Check if user has permission
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('You do not have permission to use this command!');
    }

    const content = args.rest('string');
    
    if (!content) {
      return message.reply('Please provide a message for the bot to say!\nExample: `!say Hello everyone!`');
    }

    // Delete original message and send new one
    await message.delete().catch(() => {});
    return message.channel.send(content);
  }
}

module.exports = { SayCommand };