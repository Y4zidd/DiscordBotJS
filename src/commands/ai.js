const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const AIHelper = require('../aiHelper');

class AiCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'ai',
      description: 'Konfigurasi dan info tentang AI Chat'
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
            .setDescription('Cek status AI Chat')
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('setup')
            .setDescription('Setup AI dengan API key')
            .addStringOption((option) =>
              option
                .setName('provider')
                .setDescription('Pilih AI provider')
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
      return this.handleSetup(interaction);
    }
  }

  async messageRun(message, args) {
    const subcommand = args.pick('string').catch(() => null);
    
    if (subcommand === 'status' || !subcommand) {
      return this.handleStatus(message);
    } else if (subcommand === 'setup') {
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
      .setTitle(`${config.emojis.bot} AI Chat Status`)
      .setDescription('Informasi tentang AI Chat bot')
      .addFields(
        {
          name: `${config.emojis.success} Status`,
          value: `AI Chat aktif dengan **${serviceNames[status.service]}**`,
          inline: true
        },
        {
          name: `${config.emojis.info} Available Services`,
          value: [
            `OpenAI: ${status.available.openai ? '✅' : '❌'}`,
            `Gemini: ${status.available.gemini ? '✅' : '❌'}`,
            `Anthropic: ${status.available.anthropic ? '✅' : '❌'}`,
            `Simple: ✅`
          ].join('\n'),
          inline: true
        },
        {
          name: `${config.emojis.settings} Cara Menggunakan`,
          value: '• Mention bot: `@Y4zBot halo`\n• DM bot langsung\n• Sebut nama bot: "Y4zBot apa kabar?"',
          inline: false
        },
        {
          name: `${config.emojis.warning} Rate Limit`,
          value: '1 response per 3 detik per user',
          inline: true
        }
      )
      .setFooter({
        text: status.service === 'simple' ? 'Gunakan /ai setup untuk upgrade ke AI yang lebih canggih' : 'AI powered chat is active!'
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
      .setTitle(`${config.emojis.settings} AI Setup Guide`)
      .setDescription('Cara setup AI yang lebih canggih:')
      .addFields(
        {
          name: `${config.emojis.info} 1. OpenAI (ChatGPT) - Recommended`,
          value: '• Daftar di https://platform.openai.com\n• Dapatkan API key\n• Tambahkan `OPENAI_API_KEY=your_key` ke .env\n• Restart bot',
          inline: false
        },
        {
          name: `${config.emojis.info} 2. Google Gemini - Free Tier`,
          value: '• Daftar di https://makersuite.google.com\n• Dapatkan API key\n• Tambahkan `GEMINI_API_KEY=your_key` ke .env\n• Restart bot',
          inline: false
        },
        {
          name: `${config.emojis.warning} Biaya`,
          value: '• OpenAI: ~$0.002 per 1000 tokens\n• Gemini: Gratis sampai 60 requests/menit\n• Simple: Gratis tapi terbatas',
          inline: false
        }
      )
      .setFooter({
        text: 'Setelah setup, bot akan otomatis menggunakan AI yang lebih pintar!'
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
