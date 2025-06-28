const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

class InfoCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'info',
      description: 'Show information about the bot'
    });
  }

  async chatInputRun(interaction) {
    const { client } = this.container;
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`Bot Information`)
      .addFields(
        { name: 'Bot Name', value: client.user.tag, inline: true },
        { name: 'Bot ID', value: client.user.id, inline: true },
        { name: 'Servers', value: `${client.guilds.cache.size} servers`, inline: true },
        { name: 'Users', value: `${client.users.cache.size} users`, inline: true },
        { name: 'Framework', value: 'Sapphire.js', inline: true },
        { name: 'Status', value: 'Online', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Bot created with Sapphire.js' });
    return interaction.reply({ embeds: [embed] });
  }

  async messageRun(message) {
    const { client } = this.container;
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`Bot Information`)
      .addFields(
        { name: 'Bot Name', value: client.user.tag, inline: true },
        { name: 'Bot ID', value: client.user.id, inline: true },
        { name: 'Servers', value: `${client.guilds.cache.size} servers`, inline: true },
        { name: 'Users', value: `${client.users.cache.size} users`, inline: true },
        { name: 'Framework', value: 'Sapphire.js', inline: true },
        { name: 'Status', value: 'Online', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Bot created with Sapphire.js' });
    return message.reply({ embeds: [embed] });
  }
}

module.exports = { InfoCommand };
