const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const yt = require('youtube-sr').default;
const fs = require('fs');
const path = require('path');

const cacheFilePath = path.join(__dirname, '..', '..', 'youtubeCache.json');

function readCache() {
    if (!fs.existsSync(cacheFilePath)) {
        return {};
    }
    const cacheData = fs.readFileSync(cacheFilePath);
    return JSON.parse(cacheData);
}

function writeCache(cache) {
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('youtube')
        .setDescription('Search for a YouTube video.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The video to search for.')
                .setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('query');
        await interaction.deferReply();

        try {
            const videos = await yt.search(query, { limit: 25, type: 'video' });
            if (!videos.length) {
                return interaction.editReply('No videos found for your query.');
            }

            const sessionId = interaction.user.id;
            const cache = readCache();
            cache[sessionId] = {
                videos: videos.map(v => ({
                    title: v.title,
                    url: v.url,
                    thumbnail: v.thumbnail.url,
                    duration: v.durationFormatted,
                    views: v.views,
                    channel: v.channel.name
                })),
                page: 0,
                query: query,
                interactionId: null, // Will be set after the first reply
            };
            writeCache(cache);

            const embed = createEmbed(cache[sessionId], 0);
            const row = createButtons(sessionId, 0, cache[sessionId].videos.length);

            const message = await interaction.editReply({ embeds: [embed], components: [row] });

            // Update cache with interactionId for later reference
            cache[sessionId].interactionId = message.id;
            writeCache(cache);

        } catch (error) {
            console.error('Error searching YouTube:', error);
            interaction.editReply('An error occurred while searching for videos.');
        }
    },
};

function createEmbed(sessionData, page) {
    const video = sessionData.videos[page];
    return new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(video.title)
        .setURL(video.url)
        .setImage(video.thumbnail)
        .setDescription(`**Channel:** ${video.channel}\n**Duration:** ${video.duration}\n**Views:** ${video.views ? video.views.toLocaleString() : 'N/A'}`)
        .setFooter({ text: `Result ${page + 1} of ${sessionData.videos.length} for "${sessionData.query}"` });
}

function createButtons(sessionId, page, total) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`youtube_prev_${sessionId}`)
                .setLabel('◀️ Prev')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`youtube_next_${sessionId}`)
                .setLabel('Next ▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === total - 1),
            new ButtonBuilder()
                .setCustomId(`youtube_close_${sessionId}`)
                .setLabel('Close')
                .setStyle(ButtonStyle.Danger)
        );
}
