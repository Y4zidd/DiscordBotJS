const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');
require('dotenv').config();

class AirCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'air',
      description: 'Menampilkan kualitas udara dan cuaca'
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('air')
        .setDescription('Menampilkan kualitas udara dan cuaca')
        .addStringOption((option) =>
          option
            .setName('kota')
            .setDescription('Nama kota')
            .setRequired(true)
        )
    );
  }

  // Slash command
  async chatInputRun(interaction) {
    const kota = interaction.options.getString('kota');
    await this.handleAirQualityAndWeather(interaction, kota);
  }

  // Message command
  async messageRun(message, args) {
    const kota = args.rest;
    if (!kota) {
      return message.reply('❌ Silakan masukkan nama kota! Contoh: `!air Jakarta`');
    }
    await this.handleAirQualityAndWeather(message, kota);
  }

  async handleAirQualityAndWeather(context, kota) {
    const isInteraction = context.isCommand ? context.isCommand() : false;
    
    try {
      // Defer reply untuk slash command
      if (isInteraction) {
        await context.deferReply();
      }

      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        const errorMsg = '❌ API key OpenWeatherMap tidak ditemukan!';
        return isInteraction ? 
          context.editReply(errorMsg) : 
          context.reply(errorMsg);
      }

      // Ambil koordinat dari nama kota dengan country code untuk Indonesia
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(kota)},ID&limit=5&appid=${apiKey}`;
      console.log('Geocoding URL:', geoUrl);
      
      const geoResponse = await fetch(geoUrl);

      if (!geoResponse.ok) {
        throw new Error(`Geocoding API error: ${geoResponse.status}`);
      }

      const geoData = await geoResponse.json();
      console.log('Geocoding data:', JSON.stringify(geoData, null, 2));
      
      if (!geoData || geoData.length === 0) {
        const notFoundMsg = `❌ Kota "${kota}" tidak ditemukan!`;
        return isInteraction ? 
          context.editReply(notFoundMsg) : 
          context.reply(notFoundMsg);
      }

      // Cari hasil yang paling relevan untuk Indonesia
      let selectedLocation = geoData[0];
      for (const location of geoData) {
        if (location.country === 'ID' || location.country === 'Indonesia') {
          selectedLocation = location;
          break;
        }
      }

      const { lat, lon, name, country } = selectedLocation;
      console.log('Selected location:', { lat, lon, name, country });

      // Ambil data kualitas udara dan cuaca secara bersamaan
      const airUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=id`;
      
      console.log('Air Pollution URL:', airUrl);
      console.log('Weather URL:', weatherUrl);

      const [airResponse, weatherResponse] = await Promise.all([
        fetch(airUrl),
        fetch(weatherUrl)
      ]);

      if (!airResponse.ok) {
        throw new Error(`Air Pollution API error: ${airResponse.status}`);
      }

      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status}`);
      }

      const airData = await airResponse.json();
      const weatherData = await weatherResponse.json();

      console.log('Air data:', JSON.stringify(airData, null, 2));
      console.log('Weather data:', JSON.stringify(weatherData, null, 2));

      if (!airData.list || airData.list.length === 0) {
        throw new Error('Data kualitas udara tidak tersedia');
      }

      if (!weatherData.main) {
        throw new Error('Data cuaca tidak tersedia');
      }

      const airInfo = airData.list[0];
      const aqi = airInfo.main.aqi;
      const components = airInfo.components;

      // Data cuaca dengan validasi yang lebih ketat
      const temp = weatherData.main.temp ? Math.round(weatherData.main.temp) : 'N/A';
      const feelsLike = weatherData.main.feels_like ? Math.round(weatherData.main.feels_like) : 'N/A';
      const humidity = weatherData.main.humidity || 'N/A';
      const pressure = weatherData.main.pressure || 'N/A';
      const visibility = weatherData.visibility ? Math.round(weatherData.visibility / 1000) : 'N/A';
      const windSpeed = weatherData.wind && weatherData.wind.speed ? Math.round(weatherData.wind.speed * 3.6) : 0; // m/s ke km/h
      const description = weatherData.weather && weatherData.weather[0] ? weatherData.weather[0].description : 'N/A';

      // Fungsi untuk menentukan kualitas AQI dengan warna yang tepat
      const getAQIInfo = (aqi) => {
        const aqiLevels = {
          1: { level: 'Baik', color: 0x00FF00, emoji: '🟢' },        // Hijau
          2: { level: 'Sedang', color: 0xFFFF00, emoji: '🟡' },      // Kuning
          3: { level: 'Tidak Sehat untuk Sensitif', color: 0xFF7F00, emoji: '🟠' }, // Orange
          4: { level: 'Tidak Sehat', color: 0xFF0000, emoji: '🔴' }, // Merah
          5: { level: 'Sangat Tidak Sehat', color: 0x800080, emoji: '🟣' } // Ungu
        };
        return aqiLevels[aqi] || { level: 'Tidak Diketahui', color: 0x808080, emoji: '❓' };
      };

      const aqiInfo = getAQIInfo(aqi);
      
      // Alternatif menggunakan OpenStreetMap (tidak perlu API key)
      const osmThumbnail = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${lon},${lat}&z=10&l=map&size=400,300&pt=${lon},${lat},pm2rdm`;

      // Emoji cuaca berdasarkan kondisi
      const getWeatherEmoji = (weatherId) => {
        if (weatherId >= 200 && weatherId < 300) return '⛈️'; // Thunderstorm
        if (weatherId >= 300 && weatherId < 400) return '🌦️'; // Drizzle
        if (weatherId >= 500 && weatherId < 600) return '🌧️'; // Rain
        if (weatherId >= 600 && weatherId < 700) return '❄️'; // Snow
        if (weatherId >= 700 && weatherId < 800) return '🌫️'; // Atmosphere
        if (weatherId === 800) return '☀️'; // Clear
        if (weatherId > 800) return '☁️'; // Clouds
        return '🌤️';
      };

      const weatherEmoji = weatherData.weather && weatherData.weather[0] ? 
        getWeatherEmoji(weatherData.weather[0].id) : '🌤️';

      // Buat embed dengan layout yang lebih menarik
      const embed = new EmbedBuilder()
        .setTitle(`${weatherEmoji} **Cuaca & Kualitas Udara**`)
        .setDescription(`📍 **${name}, ${country === 'ID' ? 'Indonesia' : country}**\n` +
                       `🕐 *Diperbarui: ${new Date().toLocaleString('id-ID', { 
                         timeZone: 'Asia/Jakarta',
                         dateStyle: 'short',
                         timeStyle: 'short'
                       })}*`)
        .setColor(aqiInfo.color)
        .setThumbnail(osmThumbnail)
        .addFields(
          {
            name: `${weatherEmoji} **Kondisi Cuaca**`,
            value: 
              `> 🌡️ **${temp}°C** (terasa ${feelsLike}°C)\n` +
              `> 💧 **${humidity}%** kelembapan\n` +
              `> 🌬️ **${windSpeed} km/h** angin\n` +
              `> � **${pressure} hPa** tekanan\n` +
              `> 👁️ **${visibility} km** jarak pandang\n` +
              `> ☁️ *${description}*`,
            inline: true
          },
          {
            name: `${aqiInfo.emoji} **Kualitas Udara**`,
            value: 
              `> 📊 **AQI ${aqi}** - *${aqiInfo.level}*\n` +
              `> 💨 **${components.pm2_5 ? Math.round(components.pm2_5) : 'N/A'}** μg/m³ PM2.5\n` +
              `> 🫧 **${components.pm10 ? Math.round(components.pm10) : 'N/A'}** μg/m³ PM10\n` +
              `> 🌫️ **${components.co ? Math.round(components.co) : 'N/A'}** μg/m³ CO\n` +
              `> ⚗️ **${components.no2 ? Math.round(components.no2) : 'N/A'}** μg/m³ NO₂\n` +
              `> 🔸 **${components.o3 ? Math.round(components.o3) : 'N/A'}** μg/m³ O₃`,
            inline: true
          },
          {
            name: '📊 **Standar Kualitas Udara**',
            value: 
              `🟢 **1-2**: Baik - Sedang\n` +
              `🟠 **3**: Tidak sehat untuk sensitif\n` +
              `🔴 **4**: Tidak sehat\n` +
              `🟣 **5**: Sangat tidak sehat`,
            inline: false
          }
        )
        .setFooter({ 
          text: `📡 Data dari OpenWeatherMap API`, 
          iconURL: 'https://openweathermap.org/img/wn/10d.png'
        })
        .setTimestamp();

      return isInteraction ? 
        context.editReply({ embeds: [embed] }) : 
        context.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching air quality and weather data:', error);
      
      const errorMsg = `❌ Terjadi kesalahan saat mengambil data: ${error.message}`;
      return isInteraction ? 
        context.editReply(errorMsg) : 
        context.reply(errorMsg);
    }
  }
}

module.exports = { AirCommand };
