const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const config = require('../config');
require('dotenv').config();

class AirCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'air',
      description: 'Show air quality and weather information'
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('air')
        .setDescription('Show air quality and weather information')
        .addStringOption((option) =>
          option
            .setName('city')
            .setDescription('City name')
            .setRequired(true)
        )
    );
  }

  // Slash command
  async chatInputRun(interaction) {
    const city = interaction.options.getString('city');
    await this.handleAirQualityAndWeather(interaction, city);
  }

  // Message command
  async messageRun(message, args) {
    const city = args.rest;
    if (!city) {
      return message.reply('❌ Please enter a city name! Example: `!air Jakarta`');
    }
    await this.handleAirQualityAndWeather(message, city);
  }

  async handleAirQualityAndWeather(context, city) {
    const isInteraction = context.isCommand ? context.isCommand() : false;
    
    try {
      // Defer reply for slash command
      if (isInteraction) {
        await context.deferReply();
      }

      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        const errorMsg = '❌ OpenWeatherMap API key not found!';
        return isInteraction ? 
          context.editReply(errorMsg) : 
          context.reply(errorMsg);
      }

      // Get coordinates from city name with country code for Indonesia
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},ID&limit=5&appid=${apiKey}`;
      console.log('Geocoding URL:', geoUrl);
      
      const geoResponse = await fetch(geoUrl);

      if (!geoResponse.ok) {
        throw new Error(`Geocoding API error: ${geoResponse.status}`);
      }

      const geoData = await geoResponse.json();
      console.log('Geocoding data:', JSON.stringify(geoData, null, 2));
      
      if (!geoData || geoData.length === 0) {
        const notFoundMsg = `❌ City "${city}" not found!`;
        return isInteraction ? 
          context.editReply(notFoundMsg) : 
          context.reply(notFoundMsg);
      }

      // Find the most relevant result for Indonesia
      let selectedLocation = geoData[0];
      for (const location of geoData) {
        if (location.country === 'ID' || location.country === 'Indonesia') {
          selectedLocation = location;
          break;
        }
      }

      const { lat, lon, name, country } = selectedLocation;
      console.log('Selected location:', { lat, lon, name, country });

      // Get air quality and weather data simultaneously
      const airUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=en`;
      
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
        throw new Error('Air quality data not available');
      }

      if (!weatherData.main) {
        throw new Error('Weather data not available');
      }

      const airInfo = airData.list[0];
      const aqi = airInfo.main.aqi;
      const components = airInfo.components;

      // Weather data with stricter validation
      const temp = weatherData.main.temp ? Math.round(weatherData.main.temp) : 'N/A';
      const feelsLike = weatherData.main.feels_like ? Math.round(weatherData.main.feels_like) : 'N/A';
      const humidity = weatherData.main.humidity || 'N/A';
      const pressure = weatherData.main.pressure || 'N/A';
      const visibility = weatherData.visibility ? Math.round(weatherData.visibility / 1000) : 'N/A';
      const windSpeed = weatherData.wind && weatherData.wind.speed ? Math.round(weatherData.wind.speed * 3.6) : 0; // m/s to km/h
      const description = weatherData.weather && weatherData.weather[0] ? weatherData.weather[0].description : 'N/A';

      // Function to determine AQI quality with proper colors
      const getAQIInfo = (aqi) => {
        const aqiLevels = {
          1: { level: 'Good', color: 0x00FF00, emoji: '🟢' },        // Green
          2: { level: 'Fair', color: 0xFFFF00, emoji: '🟡' },      // Yellow
          3: { level: 'Moderate', color: 0xFF7F00, emoji: '🟠' }, // Orange
          4: { level: 'Poor', color: 0xFF0000, emoji: '🔴' }, // Red
          5: { level: 'Very Poor', color: 0x800080, emoji: '🟣' } // Purple
        };
        return aqiLevels[aqi] || { level: 'Unknown', color: 0x808080, emoji: '❓' };
      };

      const aqiInfo = getAQIInfo(aqi);
      
      // Alternative using OpenStreetMap (no API key needed)
      const osmThumbnail = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${lon},${lat}&z=10&l=map&size=400,300&pt=${lon},${lat},pm2rdm`;

      // Weather emoji based on conditions
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

      // Create embed with more attractive layout
      const embed = new EmbedBuilder()
        .setTitle(`${weatherEmoji} **Weather & Air Quality**`)
        .setDescription(`📍 **${name}, ${country === 'ID' ? 'Indonesia' : country}**\n` +
                       `🕐 *Last updated: ${new Date().toLocaleString('en-US', { 
                         timeZone: 'Asia/Jakarta',
                         dateStyle: 'short',
                         timeStyle: 'short'
                       })}*`)
        .setColor(aqiInfo.color)
        .setThumbnail(osmThumbnail)
        .addFields(
          {
            name: `${weatherEmoji} **Weather Conditions**`,
            value: 
              `> 🌡️ **${temp}°C** (feels like ${feelsLike}°C)\n` +
              `> 💧 **${humidity}%** humidity\n` +
              `> 🌬️ **${windSpeed} km/h** wind\n` +
              `> 📊 **${pressure} hPa** pressure\n` +
              `> 👁️ **${visibility} km** visibility\n` +
              `> ☁️ *${description}*`,
            inline: true
          },
          {
            name: `${aqiInfo.emoji} **Air Quality**`,
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
            name: '📊 **Air Quality Standards**',
            value: 
              `🟢 **1-2**: Good - Fair\n` +
              `🟠 **3**: Moderate\n` +
              `🔴 **4**: Poor\n` +
              `🟣 **5**: Very Poor`,
            inline: false
          }
        )
        .setFooter({ 
          text: `📡 Data from OpenWeatherMap API`, 
          iconURL: 'https://openweathermap.org/img/wn/10d.png'
        })
        .setTimestamp();

      return isInteraction ? 
        context.editReply({ embeds: [embed] }) : 
        context.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching air quality and weather data:', error);
      
      const errorMsg = `❌ An error occurred while fetching data: ${error.message}`;
      return isInteraction ? 
        context.editReply(errorMsg) : 
        context.reply(errorMsg);
    }
  }
}

module.exports = { AirCommand };
