const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

class UserInfoCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'userinfo',
      description: 'Displays information about a user'
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
          description: 'User to view information (leave empty for yourself)',
          type: 6, // USER type
          required: false
        }
      ]
    });
  }

  // Common function to create embed
  createUserInfoEmbed(targetUser, requester, member = null) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.emojis.info} User Information`)
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
          name: '📅 Account Created',
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
          inline: false
        }
      );

    if (member) {
      embed.addFields(
        {
          name: '📝 Nickname',
          value: member.nickname || 'None',
          inline: true
        },
        {
          name: '📅 Joined Server',
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
          inline: false
        },
        {
          name: '🎭 Roles',
          value: member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => `<@&${role.id}>`)
            .join(', ') || 'No roles',
          inline: false
        }
      );
    }

    return embed
      .setTimestamp()
      .setFooter({
        text: `Requested by ${requester.tag}`,
        iconURL: requester.displayAvatarURL()
      });
  }

  // Common function to resolve target user
  async resolveTargetUser(context, args) {
    // For slash commands
    if (context.options) {
      return context.options.getUser('user') || context.user;
    }
    
    // For message commands
    if (context.mentions.users.size > 0) {
      return context.mentions.users.first();
    }

    const userId = args.pick('string').catch(() => null);
    if (userId) {
      try {
        return await this.container.client.users.fetch(userId);
      } catch {
        throw new Error('User not found');
      }
    }
    
    return context.author;
  }

  // Slash command
  async chatInputRun(interaction) {
    try {
      const targetUser = await this.resolveTargetUser(interaction);
      const member = interaction.guild?.members.cache.get(targetUser.id);
      const embed = this.createUserInfoEmbed(targetUser, interaction.user, member);
      
      return interaction.reply({ embeds: [embed] });
    } catch {
      return interaction.reply({
        content: `${config.emojis.error} User not found!`,
        ephemeral: true
      });
    }
  }

  // Message command
  async messageRun(message, args) {
    try {
      const targetUser = await this.resolveTargetUser(message, args);
      const member = message.guild?.members.cache.get(targetUser.id);
      const embed = this.createUserInfoEmbed(targetUser, message.author, member);
      
      return message.reply({ embeds: [embed] });
    } catch {
      return message.reply(`${config.emojis.error} User not found!`);
    }
  }
}

module.exports = { UserInfoCommand };