const { Command } = require('@sapphire/framework');
const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');
const { createCanvas, loadImage } = require('canvas');

// In-memory cache for pagination (userId+query)
const mangaCache = {};

// Helper: Generate a canvas collage of up to 6 covers (2x3 grid)
async function createMangaCollage(covers) {
  const cellW = 180, cellH = 256, cols = 3, rows = 2;
  const canvas = createCanvas(cellW * cols, cellH * rows);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < covers.length; i++) {
    const x = (i % cols) * cellW;
    const y = Math.floor(i / cols) * cellH;
    if (!covers[i]) {
      // Draw placeholder
      ctx.fillStyle = '#444';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('No Image', x + 30, y + cellH / 2);
      continue;
    }
    try {
      const img = await loadImage(covers[i]);
      ctx.drawImage(img, x, y, cellW, cellH);
    } catch {
      ctx.fillStyle = '#444';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('No Image', x + 30, y + cellH / 2);
    }
  }
  return canvas.toBuffer('image/png');
}

// Send a manga page (canvas collage + embed + interactive buttons)
async function sendMangaPage(interaction, title, userId, page, allData, isInitial) {
  try {
    const perPage = 6;
    const total = allData.length;
    const maxPage = Math.ceil(total / perPage);
    const start = page * perPage;
    const end = start + perPage;
    const pageData = allData.slice(start, end);
    // Prepare cover URLs
    const covers = pageData.map(manga => {
      const rel = manga.relationships || [];
      const cover = rel.find(r => r.type === 'cover_art');
      if (cover && cover.attributes && cover.attributes.fileName) {
        return `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.256.jpg`;
      }
      return null;
    });
    const buffer = await createMangaCollage(covers);
    // Use unique attachment name per page
    const attachmentName = `covers_page${page + 1}.png`;
    const attachment = new AttachmentBuilder(buffer, { name: attachmentName });
    // Build manga list
    let desc = '';
    for (let i = 0; i < pageData.length; i++) {
      const manga = pageData[i];
      const attr = manga.attributes;
      const mangaTitle = attr.title.en || Object.values(attr.title)[0] || 'No Title';
      const url = `https://mangadex.org/title/${manga.id}`;
      const year = attr.year || 'Unknown';
      const status = attr.status || 'Unknown';
      const genres = attr.tags && attr.tags.length ? attr.tags.map(t => t.attributes.name.en).join(', ') : 'None';
      desc += `**${start + i + 1}. [${mangaTitle}](${url})**\n`;
      desc += `Status: \`${status}\` | Year: \`${year}\`\n`;
      desc += `Genres: _${genres}_\n`;
      desc += `\n`;
    }
    const embed = new EmbedBuilder()
      .setTitle(`Search results for "${title}"`)
      .setColor('#2ecc71')
      .setFooter({ text: `MangaDex • Page ${page + 1} of ${maxPage}` })
      .setDescription(desc.trim())
      .setImage(`attachment://${attachmentName}`);
    // Pagination buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`manga_prev_${userId}_${title}`)
        .setLabel('<')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId('manga_index')
        .setLabel(`${page + 1} / ${maxPage}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`manga_next_${userId}_${title}`)
        .setLabel('>')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === maxPage - 1)
    );
    // Always use editReply for both initial and pagination updates
    return interaction.editReply({ embeds: [embed], files: [attachment], components: [row] });
  } catch (err) {
    console.error('sendMangaPage error:', err);
    try {
      await interaction.editReply('Error displaying manga page.');
    } catch {}
  }
}

class MangaCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'manga',
      description: 'Search for manga info from MangaDex',
      chatInputCommand: true
    });
  }

  registerApplicationCommands(registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('manga')
        .setDescription('Search for manga info from MangaDex')
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Manga title to search')
            .setRequired(true)
        )
    );
  }

  async chatInputRun(interaction) {
    await interaction.deferReply();
    const title = interaction.options.getString('title');
    const userId = interaction.user.id;
    try {
      // Query MangaDex REST API v5 (get up to 60 results for pagination)
      const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=60&availableTranslatedLanguage[]=en&includes[]=cover_art`;
      const response = await fetch(url);
      const data = await response.json();
      if (!data.data || !data.data.length) {
        return interaction.editReply('No manga found with that title.');
      }
      // Cache results for this user/query
      mangaCache[`${userId}_${title}`] = data.data;
      // Show first page
      return sendMangaPage(interaction, title, userId, 0, data.data, true);
    } catch (err) {
      console.error('MangaDex REST API error:', err);
      return interaction.editReply('Error fetching manga info.');
    }
  }
}

// Button interaction handler for manga pagination
async function handleMangaButton(interaction) {
  try {
    if (!interaction.isButton() || !interaction.customId.startsWith('manga_')) return;
    const [_, action, userId, ...titleArr] = interaction.customId.split('_');
    const title = titleArr.join('_');
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: 'You cannot control this pagination.', ephemeral: true });
    }
    const cacheKey = `${userId}_${title}`;
    const allData = mangaCache[cacheKey];
    if (!allData) {
      return interaction.reply({ content: 'Session expired. Please search again.', ephemeral: true });
    }
    // Get current page from label or embed footer
    let page = 0;
    if (interaction.message.embeds[0]?.footer?.text) {
      const match = interaction.message.embeds[0].footer.text.match(/Page (\d+) of (\d+)/);
      if (match) page = parseInt(match[1], 10) - 1;
    }
    if (action === 'prev' && page > 0) page--;
    if (action === 'next' && page < Math.ceil(allData.length / 6) - 1) page++;
    // Defer update to prevent timeout
    await interaction.deferUpdate();
    // Use editReply for updating the message
    await sendMangaPage(interaction, title, userId, page, allData, true);
  } catch (err) {
    console.error('handleMangaButton error:', err);
    try {
      await interaction.followUp({ content: 'Error handling button interaction.', ephemeral: true });
    } catch {}
  }
}

module.exports = { MangaCommand, handleMangaButton };
