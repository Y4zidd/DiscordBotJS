const insta = require('priyansh-ig-downloader');

async function test(url) {
  try {
    const result = await insta(url);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Ganti URL di bawah ini dengan link Instagram yang ingin Anda tes
test('https://www.instagram.com/reel/C9HytkYS4Hc/?utm_source=ig_web_copy_link');
