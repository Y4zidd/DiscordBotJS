// tiktok-btchtest.js
// Standalone test script for TikTok video download using btch-downloader
const { ttdl } = require('btch-downloader');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Quick test for ttdl TikTok downloader
const testUrl = 'https://www.tiktok.com/@omagadsus/video/7025456384175017243?is_from_webapp=1&sender_device=pc&web_id6982004129280116226';
ttdl(testUrl)
  .then(data => {
    console.log('ttdl result:', data);
  })
  .catch(err => {
    console.error('ttdl error:', err);
  });

async function downloadTikTok(url) {
  try {
    console.log('Fetching TikTok video info...');
    const data = await ttdl(url);
    console.log('Raw ttdl result:', data); // Log the raw result for debugging
    let videoUrl = data.nowm;
    if (!videoUrl && Array.isArray(data.video) && data.video.length > 0) {
      videoUrl = data.video[0];
    }
    if (!videoUrl) {
      console.error('No downloadable TikTok video found.');
      return;
    }
    const filename = `tiktok_${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, filename);
    console.log('Downloading video:', videoUrl);
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
    console.log('Download complete:', outputPath, `(${(stats.size/1024/1024).toFixed(2)} MB)`);
    if (stats.size > 25 * 1024 * 1024) {
      console.warn('File is too large (>25MB) for Discord.');
    }
  } catch (err) {
    console.error('Download failed:', err.message);
  }
}

// Example usage: node tiktok-btchtest.js <tiktok_url>
const url = process.argv[2];
if (!url) {
  console.error('Usage: node tiktok-btchtest.js <tiktok_url>');
  process.exit(1);
}
downloadTikTok(url);
