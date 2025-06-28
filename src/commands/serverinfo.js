const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

class ServerInfoCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'serverinfo',
      description: 'Displays information about the server'
    });
  }

  // Register slash command
  registerApplicationCommands(registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description
    });
  }

  // Common function to create embed
  createServerInfoEmbed(guild, user) {
    return new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`Server Information`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        {
          name: 'Server Name',
          value: guild.name,
          inline: true
        },
        {
          name: 'Server ID',
          value: guild.id,
          inline: true
        },
        {
          name: 'Owner',
          value: `<@${guild.ownerId}>`,
          inline: true
        },
        {
          name: 'Member Count',
          value: `${guild.memberCount} members`,
          inline: true
        },
        {
          name: 'Created At',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: true
        },
        {
          name: 'Verification Level',
          value: this.formatVerificationLevel(guild.verificationLevel),
          inline: true
        },
        {
          name: 'Text Channels',
          value: `${guild.channels.cache.filter(c => c.type === 0).size}`,
          inline: true
        },
        {
          name: 'Voice Channels',
          value: `${guild.channels.cache.filter(c => c.type === 2).size}`,
          inline: true
        },
        {
          name: 'Roles',
          value: `${guild.roles.cache.size}`,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Requested by ${user.tag}`,
        iconURL: user.displayAvatarURL()
      });
  }

  // Common error response
  getErrorResponse(context) {
    const content = `${config.emojis.error} This command can only be used in a server!`;
    return context.reply ? 
      context.reply({ content, ephemeral: true }) : 
      context.reply(content);
  }

  // Slash command
  async chatInputRun(interaction) {
    if (!interaction.guild) {
      return this.getErrorResponse(interaction);
    }
    
    const embed = this.createServerInfoEmbed(interaction.guild, interaction.user);
    return interaction.reply({ embeds: [embed] });
  }

  // Message command
  async messageRun(message) {
    if (!message.guild) {
      return this.getErrorResponse(message);
    }
    
    const embed = this.createServerInfoEmbed(message.guild, message.author);
    return message.reply({ embeds: [embed] });
  }
}

module.exports = { ServerInfoCommand };