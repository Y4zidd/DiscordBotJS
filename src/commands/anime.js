const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const fs = require('fs');
const CACHE_FILE = './animeCache.json';

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

// Selalu baca/tulis cache langsung ke file, bukan memory
function setAnimeCache(key, data) {
  let fileCache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      fileCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {}
  }
  fileCache[key] = {
    data,
    lastActive: Date.now()
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(fileCache));
}

function getAnimeCache(key) {
  let fileCache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      fileCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {}
  }
  const entry = fileCache[key];
  if (!entry) return null;
  const now = Date.now();
  if (now - entry.lastActive > 180000) { // 3 minutes
    delete fileCache[key];
    fs.writeFileSync(CACHE_FILE, JSON.stringify(fileCache));
    return 'expired';
  }
  // Update lastActive on access
  entry.lastActive = now;
  fileCache[key] = entry;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(fileCache));
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
          option.setName('query')
            .setDescription('Anime title to search')
            .setRequired(true)
        )
    );
  }

  async chatInputRun(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString('query');
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
    // Hapus: reload cache dari file (tidak perlu lagi)
    // if (fs.existsSync(CACHE_FILE)) {
    //   Object.assign(animeCache, JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')));
    // }
    if (!interaction.isButton() || !interaction.customId.startsWith('anime|')) return;
    const parts = interaction.customId.split('|');
    const action = parts[1];
    const userId = parts[2];
    const encodedQuery = parts[3];
    const index = parseInt(parts[4], 10);
    const query = decodeQuery(encodedQuery);
    const cacheKey = `${userId}_${encodedQuery}`;
    const allData = getAnimeCache(cacheKey);
    if (allData === 'expired') {
      return interaction.reply({ content: 'Your session has expired due to inactivity (over 3 minutes). Please search again to continue.', flags: MessageFlags.Ephemeral });
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
    if (action === 'epclose') {
      // Manual close: delete cache and disable all buttons
      deleteAnimeCache(cacheKey);
      const embed = interaction.message.embeds[0];
      const disabledRow = new ActionRowBuilder().addComponents(
        interaction.message.components[0].components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
      );
      return interaction.update({ embeds: [embed], components: [disabledRow], content: 'Session closed. You can search again anytime.' });
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

// Fungsi untuk menghapus cache user dari file
function deleteAnimeCache(key) {
  let fileCache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      fileCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {}
  }
  if (fileCache[key]) {
    delete fileCache[key];
    fs.writeFileSync(CACHE_FILE, JSON.stringify(fileCache));
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
