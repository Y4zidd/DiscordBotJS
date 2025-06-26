const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

class ServerInfoCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'serverinfo',
      description: 'Menampilkan informasi tentang server'
    });
  }

  // Register slash command
  registerApplicationCommands(registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description
    });
  }

  // Slash command
  async chatInputRun(interaction) {
    const guild = interaction.guild;
    
    if (!guild) {
      return interaction.reply({
        content: `${config.emojis.error} Command ini hanya bisa digunakan di server!`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.info} Informasi Server`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        {
          name: '📛 Nama Server',
          value: guild.name,
          inline: true
        },
        {
          name: '🆔 ID Server',
          value: guild.id,
          inline: true
        },
        {
          name: '👑 Owner',
          value: `<@${guild.ownerId}>`,
          inline: true
        },
        {
          name: '👥 Member Count',
          value: `${guild.memberCount} members`,
          inline: true
        },
        {
          name: '📅 Dibuat',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: true
        },
        {
          name: '🔒 Verification Level',
          value: guild.verificationLevel.toString(),
          inline: true
        },
        {
          name: '💬 Text Channels',
          value: `${guild.channels.cache.filter(c => c.type === 0).size}`,
          inline: true
        },
        {
          name: '🔊 Voice Channels',
          value: `${guild.channels.cache.filter(c => c.type === 2).size}`,
          inline: true
        },
        {
          name: '📝 Roles',
          value: `${guild.roles.cache.size}`,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      });

    return interaction.reply({ embeds: [embed] });
  }

  // Message command
  async messageRun(message) {
    const guild = message.guild;
    
    if (!guild) {
      return message.reply(`${config.emojis.error} Command ini hanya bisa digunakan di server!`);
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.info} Informasi Server`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        {
          name: '📛 Nama Server',
          value: guild.name,
          inline: true
        },
        {
          name: '🆔 ID Server',
          value: guild.id,
          inline: true
        },
        {
          name: '👑 Owner',
          value: `<@${guild.ownerId}>`,
          inline: true
        },
        {
          name: '👥 Member Count',
          value: `${guild.memberCount} members`,
          inline: true
        },
        {
          name: '📅 Dibuat',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: true
        },
        {
          name: '🔒 Verification Level',
          value: guild.verificationLevel.toString(),
          inline: true
        },
        {
          name: '💬 Text Channels',
          value: `${guild.channels.cache.filter(c => c.type === 0).size}`,
          inline: true
        },
        {
          name: '🔊 Voice Channels',
          value: `${guild.channels.cache.filter(c => c.type === 2).size}`,
          inline: true
        },
        {
          name: '📝 Roles',
          value: `${guild.roles.cache.size}`,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL()
      });

    return message.reply({ embeds: [embed] });
  }
}

module.exports = { ServerInfoCommand };
