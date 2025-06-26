const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

class UserInfoCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'userinfo',
      description: 'Menampilkan informasi tentang user'
    });
  }

  // Register slash command
  registerApplicationCommands(registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          name: 'user',
          description: 'User yang ingin dilihat infonya (kosongkan untuk diri sendiri)',
          type: 6, // USER type
          required: false
        }
      ]
    });
  }

  // Slash command
  async chatInputRun(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild?.members.cache.get(targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.info} Informasi User`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '👤 Username',
          value: targetUser.tag,
          inline: true
        },
        {
          name: '🆔 ID',
          value: targetUser.id,
          inline: true
        },
        {
          name: '📅 Akun Dibuat',
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
          inline: false
        }
      );

    if (member) {
      embed.addFields(
        {
          name: '📝 Nickname',
          value: member.nickname || 'Tidak ada',
          inline: true
        },
        {
          name: '📅 Bergabung Server',
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
          inline: false
        },
        {
          name: '🎭 Roles',
          value: member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => `<@&${role.id}>`)
            .join(', ') || 'Tidak ada role',
          inline: false
        }
      );
    }

    embed
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      });

    return interaction.reply({ embeds: [embed] });
  }

  // Message command
  async messageRun(message, args) {
    let targetUser = message.author;
    
    // Cek apakah ada mention user
    if (message.mentions.users.size > 0) {
      targetUser = message.mentions.users.first();
    } else {
      // Cek apakah ada user ID
      const userId = args.pick('string').catch(() => null);
      if (userId) {
        try {
          targetUser = await this.container.client.users.fetch(userId);
        } catch {
          return message.reply(`${config.emojis.error} User tidak ditemukan!`);
        }
      }
    }

    const member = message.guild?.members.cache.get(targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.info} Informasi User`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '👤 Username',
          value: targetUser.tag,
          inline: true
        },
        {
          name: '🆔 ID',
          value: targetUser.id,
          inline: true
        },
        {
          name: '📅 Akun Dibuat',
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
          inline: false
        }
      );

    if (member) {
      embed.addFields(
        {
          name: '📝 Nickname',
          value: member.nickname || 'Tidak ada',
          inline: true
        },
        {
          name: '📅 Bergabung Server',
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
          inline: false
        },
        {
          name: '🎭 Roles',
          value: member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => `<@&${role.id}>`)
            .join(', ') || 'Tidak ada role',
          inline: false
        }
      );
    }

    embed
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL()
      });

    return message.reply({ embeds: [embed] });
  }
}

module.exports = { UserInfoCommand };
