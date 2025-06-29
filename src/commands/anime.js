const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { HiAnime } = require('aniwatch');
const fs = require('fs');
const CACHE_FILE = './animeCache.json';

// In-memory cache for pagination (userId+query)
const animeCache = {};
const hianime = new HiAnime.Scraper();

// Helper to encode/decode query safely for customId and cacheKey
function encodeQuery(q) {
  return encodeURIComponent(q);
}
function decodeQuery(q) {
  return decodeURIComponent(q);
}

// Load cache dari file saat start
if (fs.existsSync(CACHE_FILE)) {
  Object.assign(animeCache, JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')));
}

// Simpan cache ke file setiap kali di-set
function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(animeCache));
}

async function fetchAllAnimeResults(query) {
  // Ambil semua hasil pencarian dari HiAnime (Aniwatch)
  let allData = [];
  let page = 1;
  let hasNext = true;
  while (hasNext && page <= 5) { // Limit 5 pages for safety
    const data = await hianime.search(query, page);
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
  // Gunakan | sebagai delimiter agar query apapun aman
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
      .setLabel('Lihat Episode')
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
      animeCache[cacheKey] = allResults;
      saveCache();
      console.log('Cache set:', cacheKey, 'Jumlah:', allResults.length);
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
    // Reload cache from file to ensure sync across processes/restarts
    if (fs.existsSync(CACHE_FILE)) {
      Object.assign(animeCache, JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')));
    }
    if (!interaction.isButton() || !interaction.customId.startsWith('anime|')) return;
    const parts = interaction.customId.split('|');
    const action = parts[1];
    const userId = parts[2];
    const encodedQuery = parts[3];
    const index = parseInt(parts[4], 10);
    const query = decodeQuery(encodedQuery);
    const cacheKey = `${userId}_${encodedQuery}`;
    const allData = animeCache[cacheKey];
    console.log('Cache get:', cacheKey, 'Ada:', !!allData);
    if (!allData) {
      return interaction.reply({ content: 'Session expired. Please search again.', ephemeral: true });
    }
    let idx = index;
    if (isNaN(idx) && interaction.message.embeds[0]?.footer?.text) {
      const match = interaction.message.embeds[0].footer.text.match(/Result (\d+) of (\d+)/);
      if (match) idx = parseInt(match[1], 10) - 1;
    }
    if (action === 'prev' && idx > 0) idx--;
    if (action === 'next' && idx < allData.length - 1) idx++;
    if (action === 'episodes') {
      await interaction.deferUpdate();
      const anime = allData[idx];
      const episodesData = await hianime.getEpisodes(anime.id);
      if (!episodesData.episodes || episodesData.episodes.length === 0) {
        return interaction.followUp({ content: 'Tidak ada episode ditemukan.', ephemeral: true });
      }
      let desc = `Daftar episode untuk **${anime.name}**:\n\n`;
      desc += episodesData.episodes.map(ep => `Episode ${ep.number}: ${ep.title}\nhttps://hianime.to/watch/${anime.id}?ep=${ep.episodeId.split('=')[1]}`).join('\n\n');
      return interaction.followUp({ content: desc, ephemeral: true });
    }
    await interaction.deferUpdate();
    await sendAnimeEmbed(interaction, query, userId, idx, allData);
  } catch (err) {
    console.error('handleAnimeButton error:', err);
    try {
      await interaction.followUp({ content: 'Error handling button interaction.', ephemeral: true });
    } catch {}
  }
}

module.exports = { AnimeCommand, handleAnimeButton };
