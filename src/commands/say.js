const { Command } = require('@sapphire/framework');
const { ApplicationCommandType } = require('discord.js');

class SayCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'say',
      description: 'Membuat bot mengatakan sesuatu'
    });
  }

  // Register slash command dengan options
  registerApplicationCommands(registry) {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          name: 'message',
          description: 'Pesan yang ingin dikatakan bot',
          type: 3, // STRING type
          required: true
        }
      ]
    });
  }

  // Slash command
  async chatInputRun(interaction) {
    const message = interaction.options.getString('message');
    
    // Cek apakah user memiliki permission untuk menggunakan command ini
    if (!interaction.member.permissions.has('ManageMessages')) {
      return interaction.reply({
        content: '❌ Kamu tidak memiliki permission untuk menggunakan command ini!',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: '✅ Pesan berhasil dikirim!',
      ephemeral: true
    });

    return interaction.followUp(message);
  }

  // Message command
  async messageRun(message, args) {
    // Cek apakah user memiliki permission
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('❌ Kamu tidak memiliki permission untuk menggunakan command ini!');
    }

    const content = args.rest('string');
    
    if (!content) {
      return message.reply('❌ Silakan berikan pesan yang ingin dikatakan bot!\nContoh: `!say Halo semua!`');
    }

    // Hapus pesan original dan kirim pesan baru
    await message.delete().catch(() => {});
    return message.channel.send(content);
  }
}

module.exports = { SayCommand };
