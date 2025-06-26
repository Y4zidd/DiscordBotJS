const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class ChatCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'chat',
      description: 'Chat dengan AI Gemini'
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('chat')
        .setDescription('Chat dengan AI Gemini')
        .addStringOption((option) =>
          option
            .setName('pesan')
            .setDescription('Pesan untuk AI')
            .setRequired(true)
        )
    );
  }

  // Slash command
  async chatInputRun(interaction) {
    const pesan = interaction.options.getString('pesan');
    await this.handleChat(interaction, pesan);
  }

  // Message command
  async messageRun(message, args) {
    const pesan = args.rest;
    if (!pesan) {
      return message.reply('❌ Silakan masukkan pesan! Contoh: `!chat Halo AI`');
    }
    await this.handleChat(message, pesan);
  }

  async handleChat(context, pesan) {
    const isInteraction = context.isCommand ? context.isCommand() : false;
    
    try {
      // Defer reply untuk slash command
      if (isInteraction) {
        await context.deferReply();
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const errorMsg = '❌ API key Gemini tidak ditemukan!';
        return isInteraction ? 
          context.editReply(errorMsg) : 
          context.reply(errorMsg);
      }

      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Generate response
      const result = await model.generateContent(pesan);
      const response = await result.response;
      const text = response.text();

      // Create embed for response
      const embed = new EmbedBuilder()
        .setTitle('🤖 **AI Response**')
        .setDescription(`**Your Message:** ${pesan}\n\n**AI Reply:**\n${text}`)
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
      
      const errorMsg = `❌ Terjadi kesalahan saat berkomunikasi dengan AI: ${error.message}`;
      return isInteraction ? 
        context.editReply(errorMsg) : 
        context.reply(errorMsg);
    }
  }
}

module.exports = { ChatCommand };
