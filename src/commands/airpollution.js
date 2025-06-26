const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');

class AirPollutionCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'airpollution',
      description: 'Tampilkan informasi kualitas udara suatu kota',
      aliases: ['air', 'pollution', 'aqi']
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('city')
            .setDescription('Nama kota yang ingin dicek kualitas udaranya')
            .setRequired(true)
        )
    );
  }

  async chatInputRun(interaction) {
    const city = interaction.options.getString('city');
    return this.generateAirPollutionInfo(interaction, city);
  }

  async messageRun(message, args) {
    const city = args.rest('string');
    
    if (!city) {
      return message.reply({
        content: `${config.emojis.warning} Tolong sebutkan nama kota!\nContoh: \`!airpollution Jakarta\` atau \`!air Surabaya\``
      });
    }
    
    return this.generateAirPollutionInfo(message, city);
  }

  async generateAirPollutionInfo(context, cityName) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle(`${config.emojis.error} API Key Tidak Ditemukan`)
        .setDescription('OpenWeatherMap API key belum dikonfigurasi.\nDapatkan API key di: https://openweathermap.org/api')
        .addFields({
          name: 'Setup Instructions',
          value: '1. Daftar di OpenWeatherMap\n2. Dapatkan API key\n3. Tambahkan `OPENWEATHER_API_KEY=your_key` ke file .env\n4. Restart bot'
        })
        .setTimestamp();

      if (context.reply) {
        return context.reply({ embeds: [embed] });
      } else {
        return context.channel.send({ embeds: [embed] });
      }
    }

    try {
      // Show loading
      const loadingEmbed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setDescription(`${config.emojis.loading} Mengambil data kualitas udara untuk **${cityName}**...`);

      let loadingMessage;
      if (context.reply) {
        loadingMessage = await context.reply({ embeds: [loadingEmbed] });
      } else {
        loadingMessage = await context.channel.send({ embeds: [loadingEmbed] });
      }

      // Get city coordinates first
      const geoResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`);
      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.error)
          .setTitle(`${config.emojis.error} Kota Tidak Ditemukan`)
          .setDescription(`Tidak dapat menemukan kota **${cityName}**.\nPastikan nama kota benar!`)
          .addFields({
            name: 'Contoh nama kota yang valid:',
            value: 'Jakarta, Surabaya, Bandung, Medan, Yogyakarta'
          })
          .setTimestamp();

        return loadingMessage.edit({ embeds: [embed] });
      }

      const { lat, lon, name, country } = geoData[0];

      // Get air pollution data
      const airResponse = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
      const airData = await airResponse.json();

      if (!airData || !airData.list || airData.list.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(config.colors.error)
          .setTitle(`${config.emojis.error} Data Tidak Tersedia`)
          .setDescription(`Data kualitas udara untuk **${name}** tidak tersedia saat ini.`)
          .setTimestamp();

        return loadingMessage.edit({ embeds: [embed] });
      }

      const pollution = airData.list[0];
      const aqi = pollution.main.aqi;
      const components = pollution.components;

      // AQI levels and colors
      const aqiInfo = this.getAQIInfo(aqi);

      // Create embed
      const embed = new EmbedBuilder()
        .setColor(aqiInfo.color)
        .setTitle(`${aqiInfo.emoji} Kualitas Udara - ${name}, ${country}`)
        .setDescription(`**Status:** ${aqiInfo.status}\n**Level:** ${aqiInfo.description}`)
        .addFields(
          {
            name: `${config.emojis.info} Indeks Kualitas Udara (AQI)`,
            value: `**${aqi}/5** - ${aqiInfo.status}`,
            inline: true
          },
          {
            name: `📊 Komponen Utama`,
            value: [
              `**PM2.5:** ${components.pm2_5 || 'N/A'} μg/m³`,
              `**PM10:** ${components.pm10 || 'N/A'} μg/m³`,
              `**O₃:** ${components.o3 || 'N/A'} μg/m³`,
              `**NO₂:** ${components.no2 || 'N/A'} μg/m³`
            ].join('\n'),
            inline: true
          },
          {
            name: `🌡️ Komponen Lainnya`,
            value: [
              `**CO:** ${components.co || 'N/A'} μg/m³`,
              `**SO₂:** ${components.so2 || 'N/A'} μg/m³`,
              `**NH₃:** ${components.nh3 || 'N/A'} μg/m³`
            ].join('\n'),
            inline: true
          },
          {
            name: `💡 Rekomendasi`,
            value: aqiInfo.recommendation,
            inline: false
          }
        )
        .setFooter({
          text: `Data dari OpenWeatherMap • ${lat.toFixed(2)}, ${lon.toFixed(2)}`
        })
        .setTimestamp();

      return loadingMessage.edit({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching air pollution data:', error);
      
      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle(`${config.emojis.error} Terjadi Kesalahan`)
        .setDescription(`Gagal mengambil data kualitas udara untuk **${cityName}**.\nSilakan coba lagi nanti.`)
        .setTimestamp();

      if (context.reply) {
        return context.reply({ embeds: [embed] });
      } else {
        return context.channel.send({ embeds: [embed] });
      }
    }
  }

  getAQIInfo(aqi) {
    switch (aqi) {
      case 1:
        return {
          status: 'Baik',
          description: 'Kualitas udara sangat baik',
          color: config.colors.success,
          emoji: '🟢',
          recommendation: 'Aman untuk aktivitas outdoor. Udara bersih dan sehat untuk semua kelompok.'
        };
      case 2:
        return {
          status: 'Cukup',
          description: 'Kualitas udara dapat diterima',
          color: '#90EE90',
          emoji: '🟡',
          recommendation: 'Secara umum aman, tapi kelompok sensitif mungkin mengalami gejala ringan.'
        };
      case 3:
        return {
          status: 'Sedang',
          description: 'Tidak sehat untuk kelompok sensitif',
          color: config.colors.warning,
          emoji: '🟠',
          recommendation: 'Kelompok sensitif (anak-anak, lansia, penderita asma) sebaiknya mengurangi aktivitas outdoor.'
        };
      case 4:
        return {
          status: 'Buruk',
          description: 'Tidak sehat untuk semua',
          color: '#FF6B6B',
          emoji: '🔴',
          recommendation: 'Semua orang sebaiknya mengurangi aktivitas outdoor. Gunakan masker jika keluar rumah.'
        };
      case 5:
        return {
          status: 'Sangat Buruk',
          description: 'Berbahaya untuk kesehatan',
          color: config.colors.error,
          emoji: '🟣',
          recommendation: 'Hindari aktivitas outdoor! Tetap di dalam ruangan dan gunakan air purifier jika memungkinkan.'
        };
      default:
        return {
          status: 'Tidak Diketahui',
          description: 'Data tidak tersedia',
          color: config.colors.secondary,
          emoji: '⚪',
          recommendation: 'Data tidak tersedia untuk memberikan rekomendasi.'
        };
    }
  }
}

module.exports = { AirPollutionCommand };
