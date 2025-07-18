const { Listener } = require('@sapphire/framework');
const { Events } = require('discord.js');

class GuildCreateListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      event: Events.GuildCreate
    });
  }

  run(guild) {
    console.log(`Bot added to a new server: ${guild.name} (ID: ${guild.id})`);
    console.log(`Member count: ${guild.memberCount}`);
    
    // Send a welcome message to the system channel if available
    if (guild.systemChannel) {
      const welcomeEmbed = {
        color: 0x00ff00,
        title: 'Hello! Thank you for adding this bot!',
        description: 'Welcome to the server!\n\n' +
                    '**Available Commands:**\n' +
                    '\u2022 `/ping` - Check bot latency\n' +
                    '\u2022 `/info` - Information about the bot\n' +
                    '\u2022 `/say <message>` - Make the bot say something\n\n' +
                    '**Message Commands:**\n' +
                    '\u2022 `!ping` - Check bot latency\n' +
                    '\u2022 `!info` - Information about the bot\n' +
                    '\u2022 `!say <message>` - Make the bot say something',
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Your friendly Discord bot'
        }
      };

      guild.systemChannel.send({ embeds: [welcomeEmbed] }).catch(() => {
        // Ignore if unable to send to the system channel
      });
    }
  }
}

module.exports = { GuildCreateListener };
