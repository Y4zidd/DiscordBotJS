const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class ChatCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'chat',
      description: 'Chat with Gemini AI'
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('chat')
        .setDescription('Chat with Gemini AI')
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('Message for AI')
            .setRequired(true)
        )
    );
  }

  // Slash command
  async chatInputRun(interaction) {
    const message = interaction.options.getString('message');
    await this.handleChat(interaction, message);
  }

  // Message command
  async messageRun(message, args) {
    const messageText = args.rest;
    if (!messageText) {
      return message.reply('Please enter a message! Example: `!chat Hello AI`');
    }
    await this.handleChat(message, messageText);
  }

  async handleChat(context, messageText) {
    const isInteraction = context.isCommand ? context.isCommand() : false;
    
    try {
      // Defer reply for slash command
      if (isInteraction) {
        await context.deferReply();
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const errorMsg = 'Gemini API key not found!';
        return isInteraction ? 
          context.editReply(errorMsg) : 
          context.reply(errorMsg);
      }

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Generate response
      const result = await model.generateContent(messageText);
      const response = await result.response;
      const text = response.text();

      // Create embed for response
      const embed = new EmbedBuilder()
        .setTitle('**AI Response**')
        .setDescription(`**Your Message:** ${messageText}\n\n**AI Reply:**\n${text}`)
        .setColor(config.colors.primary)
        .setFooter({ 
          text: 'Powered by Google Gemini AI',
          iconURL: context.client?.user?.displayAvatarURL() || undefined
        })
        .setTimestamp();

      return isInteraction ? 
        context.editReply({ embeds: [embed] }) : 
        context.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error with Gemini AI:', error);
      
      const errorMsg = `An error occurred while communicating with AI: ${error.message}`;
      return isInteraction ? 
        context.editReply(errorMsg) : 
        context.reply(errorMsg);
    }
  }
}

module.exports = { ChatCommand };
