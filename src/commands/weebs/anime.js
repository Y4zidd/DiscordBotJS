const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../../config');

// Global In-Memory Cache untuk anime
global.animeCache = global.animeCache || new Map();

// Cleanup cache setiap interval untuk mencegah memory leak
setInterval(() => {
    const now = Date.now();
    const expireTime = config.cache.youtubeExpiry; // 30 menit
    
    for (const [key, entry] of global.animeCache.entries()) {
        if (now - entry.lastActive > expireTime) {
            global.animeCache.delete(key);
            console.log(`[AnimeCache] Cleaned expired session: ${key}`);
        }
    }
}, config.cache.cleanupInterval); // Check setiap 10 menit

// HiAnime akan di-import dinamis saat dibutuhkan
let HiAnime = null;
let hianime = null;

// Helper to encode/decode query safely for customId and cacheKey
function encodeQuery(q) {
  return encodeURIComponent(q);
}
function decodeQuery(q) {
  return decodeURIComponent(q);
}

// In-memory cache functions - lebih cepat dari file JSON
function setAnimeCache(key, data) {
  global.animeCache.set(key, {
    data,
    lastActive: Date.now()
  });
}

function getAnimeCache(key) {
  const entry = global.animeCache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.lastActive > config.timeouts.animeSession) { // 3 minutes from config
    global.animeCache.delete(key);
    return 'expired';
  }
  
  // Update lastActive on access
  entry.lastActive = now;
  global.animeCache.set(key, entry);
  return entry.data;
}

async function initializeHiAnime() {
  if (!HiAnime) {
    const module = await import('aniwatch');
    HiAnime = module.HiAnime;
    hianime = new HiAnime.Scraper();
  }
  return hianime;
}

async function fetchAllAnimeResults(query) {
  // Initialize HiAnime if needed
  const scraper = await initializeHiAnime();
  
  // Get all search results from HiAnime (Aniwatch)
  let allData = [];
  let page = 1;
  let hasNext = true;
  while (hasNext && page <= 5) { // Limit 5 pages for safety
    const data = await scraper.search(query, page);
    if (!data.animes || data.animes.length === 0) break;
    allData = allData.concat(data.animes);
    hasNext = data.hasNextPage;
    page++;
  }
  return allData;
}

async function sendAnimeEmbed(interaction, query, userId, index, allData) {
  const anime = allData[index];
  if (!anime) return interaction.editReply('Anime not found.');
  const encodedQuery = encodeQuery(query);
  // Use | as delimiter so any query is safe
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`anime|prev|${userId}|${encodedQuery}|${index}`)
      .setLabel('<')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index === 0),
    new ButtonBuilder()
      .setCustomId('anime|index')
      .setLabel(`${index + 1} / ${allData.length}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`anime|next|${userId}|${encodedQuery}|${index}`)
      .setLabel('>')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(index === allData.length - 1),
    new ButtonBuilder()
      .setCustomId(`anime|episodes|${userId}|${encodedQuery}|${index}`)
      .setLabel('View Episodes')
      .setStyle(ButtonStyle.Primary)
  );
  const embed = new EmbedBuilder()
    .setTitle(anime.name)
    .setDescription(`Type: ${anime.type || '-'} | Rating: ${anime.rating || '-'} | Episodes: ${anime.episodes?.sub || 0} sub / ${anime.episodes?.dub || 0} dub`)
    .setImage(anime.poster)
    .setURL(anime.url || `https://hianime.to/watch/${anime.id}`)
    .setFooter({ text: `Result ${index + 1} of ${allData.length}` });
  await interaction.editReply({ embeds: [embed], components: [row] });
}

class AnimeCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'anime',
      description: 'Search for anime info from HiAnime',
      chatInputCommand: true
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('anime')
        .setDescription('Search for anime info from HiAnime')
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Anime title to search')
            .setRequired(true)
        )
    );
  }

  async chatInputRun(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('title');
    const userId = interaction.user.id;
    try {
      const allResults = await fetchAllAnimeResults(query);
      if (!allResults.length) {
        return interaction.editReply('No anime found with that title.');
      }
      const cacheKey = `${userId}_${encodeQuery(query)}`;
      setAnimeCache(cacheKey, allResults);
      console.log('Cache set:', cacheKey, 'Count:', allResults.length);
      return sendAnimeEmbed(interaction, query, userId, 0, allResults);
    } catch (err) {
      console.error('Aniwatch API error:', err);
      return interaction.editReply('Error fetching anime info.');
    }
  }
}

// Button interaction handler for anime pagination & episode
async function handleAnimeButton(interaction) {
  try {
    if (!interaction.isButton() || !interaction.customId.startsWith('anime|')) return;
    const parts = interaction.customId.split('|');
    const action = parts[1];
    const userId = parts[2];
    const encodedQuery = parts[3];
    const index = parseInt(parts[4], 10);
    const query = decodeQuery(encodedQuery);
    const cacheKey = `${userId}_${encodedQuery}`;
    
    // Special handling for epclose action - don't check cache first
    if (action === 'epclose') {
      // Manual close: delete cache and show only thank you message
      console.log('Deleting cache with key:', cacheKey);
      deleteAnimeCache(cacheKey);
      
      return interaction.update({ 
        content: '✅ **Session closed successfully!**\n\nThank you for using the anime search feature. You can search for anime anytime with `/anime` command.\n\nHave a great day!', 
        embeds: [], 
        components: [] 
      });
    }
    
    // For all other actions, check cache
    const allData = getAnimeCache(cacheKey);
    if (allData === 'expired') {
      return interaction.update({ 
        content: '⏰ **Session expired due to inactivity**\n\nYour anime search session has been automatically closed after 3 minutes of inactivity. This helps keep the bot running smoothly.\n\nYou can start a new search anytime with `/anime` command. Happy watching!', 
        embeds: [], 
        components: [] 
      });
    }
    if (!allData) {
      return interaction.reply({ content: 'No active session found. Please search again.', flags: MessageFlags.Ephemeral });
    }
    let idx = index;
    if (isNaN(idx) && interaction.message.embeds[0]?.footer?.text) {
      const match = interaction.message.embeds[0].footer.text.match(/Result (\d+) of (\d+)/);
      if (match) idx = parseInt(match[1], 10) - 1;
    }
    if (action === 'prev' && idx > 0) idx--;
    if (action === 'next' && idx < allData.length - 1) idx++;
    if (action === 'episodes') {
      const anime = allData[idx];
      let episodesData;
      try {
        const scraper = await initializeHiAnime();
        episodesData = await scraper.getEpisodes(anime.id);
      } catch (err) {
        console.error('getEpisodes error:', err);
        return interaction.update({ content: 'Failed to fetch episode data from HiAnime. Please try again later or check the anime page directly.' });
      }
      if (!episodesData.episodes || episodesData.episodes.length === 0) {
        return interaction.update({ content: 'No episodes found.' });
      }
      // Show first page (0), teruskan idx dan encodedQuery
      await sendEpisodesEmbed(interaction, anime, episodesData.episodes, 0, userId, idx, encodedQuery);
      // Jangan hapus cache di sini!
      return;
    }
    if (action === 'epnext' || action === 'epprev') {
      const anime = allData[idx];
      let episodesData;
      try {
        const scraper = await initializeHiAnime();
        episodesData = await scraper.getEpisodes(anime.id);
      } catch (err) {
        console.error('getEpisodes error:', err);
        return interaction.update({ content: 'Failed to fetch episode data from HiAnime. Please try again later or check the anime page directly.' });
      }
      if (!episodesData.episodes || episodesData.episodes.length === 0) {
        return interaction.update({ content: 'No episodes found.' });
      }
      let page = parseInt(parts[5], 10) || 0;
      if (action === 'epnext') page++;
      if (action === 'epprev') page--;
      await sendEpisodesEmbed(interaction, anime, episodesData.episodes, page, userId, idx, encodedQuery);
      // Jangan hapus cache di sini!
      return;
    }
    // Hapus aksi epwatch, karena ButtonStyle.Link tidak trigger event ke bot
    await interaction.deferUpdate();
    await sendAnimeEmbed(interaction, query, userId, idx, allData);
  } catch (err) {
    console.error('handleAnimeButton error:', err);
    try {
      await interaction.followUp({ content: 'Error handling button interaction.', flags: MessageFlags.Ephemeral });
    } catch {}
  }
}

// Fungsi untuk menghapus cache user dari memory
function deleteAnimeCache(key) {
  console.log('deleteAnimeCache called with key:', key);
  if (global.animeCache.has(key)) {
    console.log('Cache key found, deleting...');
    global.animeCache.delete(key);
    console.log('Cache successfully deleted from memory');
    console.log('Remaining cache keys:', Array.from(global.animeCache.keys()));
  } else {
    console.log('Cache key not found in memory:', key);
    console.log('Available cache keys:', Array.from(global.animeCache.keys()));
  }
}

// Helper to send paginated episodes embed
async function sendEpisodesEmbed(interaction, anime, episodes, page, userId, animeIndex, encodedQuery) {
  const perPage = 10;
  const totalPages = Math.ceil(episodes.length / perPage);
  if (page < 0) page = 0;
  if (page >= totalPages) page = totalPages - 1;
  const start = page * perPage;
  const end = start + perPage;
  const pageEpisodes = episodes.slice(start, end);
  const embed = new EmbedBuilder()
    .setTitle(`Episodes for ${anime.name}`)
    .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

  // Episode buttons (max 5 per row, max 25 per message)
  const episodeRows = [];
  for (let i = 0; i < Math.min(pageEpisodes.length, 25); i += 5) {
    episodeRows.push(new ActionRowBuilder().addComponents(
      pageEpisodes.slice(i, i + 5).map(ep =>
        new ButtonBuilder()
          .setLabel(`Ep ${ep.number}`)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://hianime.to/watch/${anime.id}?ep=${ep.episodeId.split('=')[1]}`)
      )
    ));
  }

  // Navigasi and close row
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`anime|epprev|${userId}|${encodedQuery}|${animeIndex}|${page}`)
      .setLabel('<')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId('anime|epindex')
      .setLabel(`${page + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`anime|epnext|${userId}|${encodedQuery}|${animeIndex}|${page}`)
      .setLabel('>')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`anime|epclose|${userId}|${encodedQuery}|${animeIndex}`)
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
  );
  try {
    await interaction.update({ embeds: [embed], components: [...episodeRows, navRow] });
  } catch (e) {
    if (e.code === 10062 || (e.rawError && e.rawError.code === 10062)) {
      // Interaction expired, do nothing or optionally log
      console.warn('Interaction expired: cannot update episode embed.');
    } else {
      throw e;
    }
  }
}

module.exports = { AnimeCommand, handleAnimeButton };
