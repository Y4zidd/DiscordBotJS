const { Listener } = require('@sapphire/framework');
const { Events } = require('discord.js');
const config = require('../config');
const AIHelper = require('../aiHelper');

class AiChatListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'aiChat',
      event: Events.MessageCreate
    });
    
    this.aiHelper = new AIHelper();
  }

  async run(message) {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Ignore if message is a command (starts with prefix or is slash command)
    if (message.content.startsWith(config.prefix)) return;
    
    // Check if bot is mentioned OR message is in DM OR contains bot name
    const botMentioned = message.mentions.has(this.container.client.user);
    const isDM = message.channel.type === 1; // DM channel
    const containsBotName = message.content.toLowerCase().includes('y4zbot') || 
                           message.content.toLowerCase().includes('bot');
    
    // Only respond if bot is mentioned, in DM, or bot name is mentioned
    if (!botMentioned && !isDM && !containsBotName) return;
    
    // Rate limiting - prevent spam (max 1 response per 3 seconds per user)
    const userId = message.author.id;
    const now = Date.now();
    const cooldown = 3000; // 3 seconds
    
    if (!this.cooldowns) this.cooldowns = new Map();
    
    if (this.cooldowns.has(userId)) {
      const lastUsed = this.cooldowns.get(userId);
      if (now - lastUsed < cooldown) return;
    }
    
    this.cooldowns.set(userId, now);
    
    try {
      // Show typing indicator
      await message.channel.sendTyping();
      
      // Clean message content (remove mentions)
      let cleanContent = message.content
        .replace(/<@!?\d+>/g, '') // Remove mentions
        .replace(/y4zbot/gi, '') // Remove bot name
        .trim();
      
      if (!cleanContent) {
        cleanContent = "Halo!";
      }
      
      // Get AI response
      const aiResponse = await this.aiHelper.getAIResponse(cleanContent, message.author.username, {
        channelType: message.channel.type,
        guildName: message.guild?.name,
        isDM: message.channel.type === 1
      });
      
      // Send response
      await message.reply(aiResponse);
      
    } catch (error) {
      console.error('Error in AI chat:', error);
      
      // Fallback responses if AI fails
      const fallbackResponses = [
        "Maaf, aku sedang bingung nih 🤔",
        "Hmm, bisa ulangi lagi ga? 😅",
        "Waduh, otakku error sebentar 🤖",
        "Sorry, aku lagi loading... ⏳"
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      await message.reply(randomResponse);
    }
  }
}

module.exports = { AiChatListener };
