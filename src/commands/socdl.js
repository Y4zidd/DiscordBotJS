// src/commands/socdl.js
// Discord command handler for /socdl (social media downloader: IG/Facebook) using btch-downloader
const { Command } = require('@sapphire/framework');
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { fbdown, igdl } = require('btch-downloader');
const axios = require('axios');

const TMP_DIR = path.join(__dirname, '../../tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

class SocdlCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'socdl',
      description: 'Download video from Instagram or Facebook (btch-downloader)',
      chatInputCommand: true,
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      new SlashCommandBuilder()
        .setName('socdl')
        .setDescription('Download video from Instagram or Facebook (btch-downloader)')
        .addStringOption(option =>
          option.setName('url')
            .setDescription('Instagram/Facebook video URL')
            .setRequired(true)
        )
    );
  }

  async chatInputRun(interaction) {
    let url;
    try {
      url = interaction.options.getString('url');
    } catch (err) {
      // If we can't get the URL, reply immediately
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply('❌ Failed to read the URL.');
      }
      return;
    }
    try {
      await interaction.deferReply();
    } catch (err) {
      // If already replied or deferred, just return
      return;
    }
    let outputPath = null;
    let fileLabel = null;
    try {
      await interaction.editReply('⏳ Downloading video, please wait...');
      let videoUrl = null;
      if (url.includes('facebook.com') || url.includes('fb.watch')) {
        // Facebook
        const data = await fbdown(url);
        videoUrl = data.HD || data.Normal_video;
        fileLabel = 'fb';
        if (!videoUrl) throw new Error('No downloadable Facebook video found.');
      } else if (url.includes('instagram.com')) {
        // Instagram
        const data = await igdl(url);
        if (Array.isArray(data) && data.length > 0 && data[0].url) {
          videoUrl = data[0].url;
          fileLabel = 'ig';
        } else {
          throw new Error('No downloadable Instagram video found.');
        }
      } else {
        throw new Error('URL not recognized. Only Instagram and Facebook are supported.');
      }
      const filename = `${fileLabel}_${Date.now()}.mp4`;
      outputPath = path.join(TMP_DIR, filename);
      const response = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream',
      });
      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      const stats = fs.statSync(outputPath);
      if (stats.size > 25 * 1024 * 1024) {
        await interaction.editReply('❌ File is too large (>25MB), cannot be sent to Discord.');
        fs.unlinkSync(outputPath);
        return;
      }
      await interaction.editReply({
        content: `✅ Download successful!`,
        files: [outputPath]
      });
      fs.unlinkSync(outputPath);
    } catch (err) {
      try {
        await interaction.editReply('❌ Download failed: ' + err.message);
      } catch (e) {
        // If editReply fails, log the error but don't throw
        console.error('Failed to editReply:', e);
      }
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  }
}

module.exports = { SocdlCommand };
