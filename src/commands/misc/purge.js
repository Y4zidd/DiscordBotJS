const { Command } = require('@sapphire/framework');
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

class PurgeCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'purge',
      description: 'Bulk delete messages in a channel',
      chatInputCommand: true,
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete messages in this channel')
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Number of messages to delete (max 100)')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    );
  }

  async chatInputRun(interaction) {
    const amount = interaction.options.getInteger('amount');
    if (amount < 1 || amount > 100) {
      return interaction.reply({ content: 'Please provide a number between 1 and 100.', flags: MessageFlags.Ephemeral });
    }
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      // Fetch messages, including bot messages, and delete up to the requested amount
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      // Filter to only user and bot messages (all messages)
      const toDelete = messages.filter(m => !m.pinned).first(amount);
      const deleted = await interaction.channel.bulkDelete(toDelete, true);
      await interaction.editReply(`Deleted ${deleted.size} messages (including bot and user messages, <14 days old).`);
    } catch (err) {
      await interaction.editReply('Failed to delete messages. Make sure I have permission and the messages are not older than 14 days.');
    }
  }
}

module.exports = { PurgeCommand };
