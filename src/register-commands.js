// Load environment variables
require('dotenv').config();

const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID; // Bot's application ID

if (!token) {
  console.error('❌ DISCORD_TOKEN tidak ditemukan di environment variables!');
  process.exit(1);
}

if (!clientId) {
  console.error('❌ CLIENT_ID tidak ditemukan di environment variables!');
  console.error('Tambahkan CLIENT_ID (Application ID bot) ke file .env Anda');
  process.exit(1);
}

// Daftar commands secara manual untuk menghindari error instansiasi
const commands = [
  {
    name: 'ping',
    description: 'Cek latensi bot'
  },
  {
    name: 'info',
    description: 'Tampilkan informasi bot'
  },
  {
    name: 'help',
    description: 'Tampilkan daftar semua command'
  },
  {
    name: 'serverinfo',
    description: 'Tampilkan informasi server'
  },
  {
    name: 'userinfo',
    description: 'Tampilkan informasi user',
    options: [
      {
        name: 'user',
        description: 'User yang ingin dilihat informasinya',
        type: 6, // USER type
        required: false
      }
    ]
  },
  {
    name: 'say',
    description: 'Buat bot mengatakan sesuatu',
    options: [
      {
        name: 'message',
        description: 'Pesan yang ingin dikatakan bot',
        type: 3, // STRING type
        required: true
      }
    ]
  },
  {
    name: 'ai',
    description: 'Konfigurasi dan info tentang AI Chat',
    options: [
      {
        name: 'status',
        description: 'Cek status AI Chat',
        type: 1 // SUB_COMMAND type
      },
      {
        name: 'setup',
        description: 'Setup AI dengan API key',
        type: 1, // SUB_COMMAND type
        options: [
          {
            name: 'provider',
            description: 'Pilih AI provider',
            type: 3, // STRING type
            required: true,
            choices: [
              { name: 'OpenAI (ChatGPT)', value: 'openai' },
              { name: 'Google Gemini', value: 'gemini' },
              { name: 'Simple Responses', value: 'simple' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'airpollution',
    description: 'Tampilkan informasi kualitas udara suatu kota menggunakan data real-time',
    options: [
      {
        name: 'city',
        description: 'Nama kota yang ingin dicek kualitas udaranya',
        type: 3, // STRING type
        required: true
      }
    ]
  }
];

console.log(`✅ Prepared ${commands.length} commands for registration`);

// REST instance
const rest = new REST({ version: '10' }).setToken(token);

// Deploy commands
(async () => {
  try {
    console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

    // Register commands globally (untuk semua server)
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
