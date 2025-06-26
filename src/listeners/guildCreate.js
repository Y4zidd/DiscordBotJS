const { Listener } = require('@sapphire/framework');
const { Events } = require('discord.js');

class GuildCreateListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      event: Events.GuildCreate
    });
  }

  run(guild) {
    console.log(`✨ Bot ditambahkan ke server baru: ${guild.name} (ID: ${guild.id})`);
    console.log(`👥 Member count: ${guild.memberCount}`);
    
    // Kirim pesan selamat datang ke channel system jika ada
    if (guild.systemChannel) {
      const welcomeEmbed = {
        color: 0x00ff00,
        title: '👋 Halo! Terima kasih telah menambahkan bot ini!',
        description: 'Bot ini dibuat menggunakan Sapphire.js framework.\n\n' +
                    '**Perintah yang tersedia:**\n' +
                    '• `/ping` - Cek latensi bot\n' +
                    '• `/info` - Informasi tentang bot\n' +
                    '• `/say <pesan>` - Buat bot mengatakan sesuatu\n\n' +
                    '**Message Commands:**\n' +
                    '• `!ping` - Cek latensi bot\n' +
                    '• `!info` - Informasi tentang bot\n' +
                    '• `!say <pesan>` - Buat bot mengatakan sesuatu',
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Dibuat dengan ❤️ menggunakan Sapphire.js'
        }
      };

      guild.systemChannel.send({ embeds: [welcomeEmbed] }).catch(() => {
        // Ignore jika tidak bisa mengirim ke system channel
      });
    }
  }
}

module.exports = { GuildCreateListener };
