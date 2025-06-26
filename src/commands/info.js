const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

class InfoCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'info',
      description: 'Menampilkan informasi tentang bot'
    });
  }

  // Slash command
  async chatInputRun(interaction) {
    const { client } = this.container;
    
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.bot} Informasi Bot`)
      .addFields(
        {
          name: '📛 Nama Bot',
          value: client.user.tag,
          inline: true
        },
        {
          name: '🆔 ID Bot',
          value: client.user.id,
          inline: true
        },
        {
          name: '🏠 Server',
          value: `${client.guilds.cache.size} server`,
          inline: true
        },
        {
          name: '👥 Users',
          value: `${client.users.cache.size} users`,
          inline: true
        },
        {
          name: '⚡ Framework',
          value: 'Sapphire.js',
          inline: true
        },
        {
          name: '🟢 Status',
          value: 'Online',
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({
        text: 'Bot dibuat dengan Sapphire.js'
      });

    return interaction.reply({ embeds: [embed] });
  }

  // Message command
  async messageRun(message) {
    const { client } = this.container;
    
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.bot} Informasi Bot`)
      .addFields(
        {
          name: '📛 Nama Bot',
          value: client.user.tag,
          inline: true
        },
        {
          name: '🆔 ID Bot',
          value: client.user.id,
          inline: true
        },
        {
          name: '🏠 Server',
          value: `${client.guilds.cache.size} server`,
          inline: true
        },
        {
          name: '👥 Users',
          value: `${client.users.cache.size} users`,
          inline: true
        },
        {
          name: '⚡ Framework',
          value: 'Sapphire.js',
          inline: true
        },
        {
          name: '🟢 Status',
          value: 'Online',
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({
        text: 'Bot dibuat dengan Sapphire.js'
      });

    return message.reply({ embeds: [embed] });
  }
}

module.exports = { InfoCommand };
