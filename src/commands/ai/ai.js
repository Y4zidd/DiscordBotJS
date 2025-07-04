const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config');
const AIHelper = require('../../aiHelper');

class AiCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'ai',
      description: 'Configure and get info about AI Chat'
    });
    
    this.aiHelper = new AIHelper();
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((subcommand) =>
          subcommand
            .setName('status')
            .setDescription('Check AI Chat status')
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('setup')
            .setDescription('Setup AI with API key')
            .addStringOption((option) =>
              option
                .setName('provider')
                .setDescription('Choose AI provider')
                .setRequired(true)
                .addChoices(
                  { name: 'OpenAI (ChatGPT)', value: 'openai' },
                  { name: 'Google Gemini', value: 'gemini' },
                  { name: 'Simple Responses', value: 'simple' }
                )
            )
        )
    );
  }

  async chatInputRun(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'status') {
      return this.handleStatus(interaction);
    } else if (subcommand === 'setup') {
      // Only allow admins (ManageGuild) to use setup
      if (!interaction.member.permissions.has('ManageGuild')) {
        return interaction.reply({
          content: 'Only server admins can use /ai setup.',
          ephemeral: true
        });
      }
      return this.handleSetup(interaction);
    }
  }

  async messageRun(message, args) {
    const subcommand = args.pick('string').catch(() => null);
    if (subcommand === 'status' || !subcommand) {
      return this.handleStatus(message);
    } else if (subcommand === 'setup') {
      // Only allow admins (ManageGuild) to use setup
      if (!message.member.permissions.has('ManageGuild')) {
        return message.reply('Only server admins can use !ai setup.');
      }
      return this.handleSetup(message);
    }
  }

  async handleStatus(context) {
    const status = this.aiHelper.getStatus();
    
    const serviceNames = {
      openai: 'OpenAI (ChatGPT)',
      gemini: 'Google Gemini',
      anthropic: 'Anthropic Claude',
      simple: 'Simple Responses'
    };
    
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`AI Chat Status`)
      .setDescription('Information about AI Chat bot')
      .addFields(
        {
          name: `Status`,
          value: `AI Chat is active with **${serviceNames[status.service]}**`,
          inline: true
        },
        {
          name: `Available Services`,
          value: [
            `OpenAI: ${status.available.openai ? '✅' : '❌'}`,
            `Gemini: ${status.available.gemini ? '✅' : '❌'}`,
            `Anthropic: ${status.available.anthropic ? '✅' : '❌'}`,
            `Simple: ✅`
          ].join('\n'),
          inline: true
        },
        {
          name: `How to Use`,
          value: '• Mention bot: `@Y4zBot hello`\n• DM the bot directly\n• Say the bot\'s name: "Y4zBot how are you?"',
          inline: false
        },
        {
          name: `Rate Limit`,
          value: '1 response per 3 seconds per user',
          inline: true
        }
      )
      .setFooter({
        text: status.service === 'simple' ? 'Use /ai setup to upgrade to a more advanced AI' : 'AI powered chat is active!'
      })
      .setTimestamp();

    if (context.reply) {
      return context.reply({ embeds: [embed] });
    } else {
      return context.channel.send({ embeds: [embed] });
    }
  }

  async handleSetup(context) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`AI Setup Guide`)
      .setDescription('How to setup more advanced AI:')
      .addFields(
        {
          name: `1. OpenAI (ChatGPT) - Recommended`,
          value: '• Register at https://platform.openai.com\n• Get API key\n• Add `OPENAI_API_KEY=your_key` to .env\n• Restart bot',
          inline: false
        },
        {
          name: `2. Google Gemini - Free Tier`,
          value: '• Register at https://makersuite.google.com\n• Get API key\n• Add `GEMINI_API_KEY=your_key` to .env\n• Restart bot',
          inline: false
        },
        {
          name: `Cost`,
          value: '• OpenAI: ~$0.002 per 1000 tokens\n• Gemini: Free up to 60 requests/minute\n• Simple: Free but limited',
          inline: false
        }
      )
      .setFooter({
        text: 'After setup, the bot will automatically use smarter AI!'
      })
      .setTimestamp();

    if (context.reply) {
      return context.reply({ embeds: [embed], ephemeral: true });
    } else {
      return context.channel.send({ embeds: [embed] });
    }
  }
}

module.exports = { AiCommand };