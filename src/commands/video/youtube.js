const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const YouTube = require('youtube-sr').default;

// Global In-Memory Cache - shared dengan youtubeButtons.js
global.youtubeCache = global.youtubeCache || new Map();

// Cleanup cache setiap 30 menit untuk mencegah memory leak
setInterval(() => {
    const now = Date.now();
    const expireTime = 30 * 60 * 1000; // 30 menit
    
    for (const [messageId, session] of global.youtubeCache.entries()) {
        if (now - session.timestamp > expireTime) {
            global.youtubeCache.delete(messageId);
            console.log(`[YouTubeCache] Cleaned expired session: ${messageId}`);
        }
    }
}, 10 * 60 * 1000); // Check setiap 10 menit

class YoutubeCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'youtube',
            description: 'Search for YouTube videos with thumbnail, title, channel, upload date, and duration.',
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('youtube')
                .setDescription('Search for YouTube videos')
                .addStringOption((option) =>
                    option
                        .setName('title')
                        .setDescription('The video title to search for')
                        .setRequired(true)
                )
        );
    }

    async chatInputRun(interaction) {
        const query = interaction.options.getString('title');
        await this.handleYouTubeSearch(interaction, query);
    }

    // Message command
    async messageRun(message, args) {
        const query = args.rest;
        if (!query) {
            return message.reply('Please enter a video title! Example: `!youtube how to code`');
        }
        await this.handleYouTubeSearch(message, query);
    }

    async handleYouTubeSearch(context, query) {
        const isInteraction = context.isCommand ? context.isCommand() : false;
        
        try {
            // Defer reply for slash command
            if (isInteraction) {
                await context.deferReply();
            }

            // Search menggunakan YouTube.search sesuai dokumentasi
            const searchResults = await YouTube.search(query, { limit: 10, type: 'video' });
            
            if (!searchResults || searchResults.length === 0) {
                const noResultsMsg = `❌ No videos found for: **${query}**\nTry using different keywords.`;
                return isInteraction ? 
                    context.editReply({ content: noResultsMsg, ephemeral: true }) : 
                    context.reply({ content: noResultsMsg });
            }

            const messageId = isInteraction ? 
                (await context.fetchReply()).id : 
                context.id;

            // Map hasil pencarian sesuai struktur Response Example dari dokumentasi
            const videos = searchResults.map(video => ({
                id: video.id,
                title: video.title,
                url: video.url,
                description: video.description,
                durationFormatted: video.durationFormatted,
                duration: video.duration,
                uploadedAt: video.uploadedAt,
                views: video.views,
                shorts: video.shorts,
                thumbnail: {
                    id: video.thumbnail?.id,
                    width: video.thumbnail?.width,
                    height: video.thumbnail?.height,
                    url: video.thumbnail?.url
                },
                channel: {
                    name: video.channel?.name,
                    verified: video.channel?.verified,
                    id: video.channel?.id,
                    url: video.channel?.url,
                    subscribers: video.channel?.subscribers
                },
                likes: video.likes,
                dislikes: video.dislikes,
                live: video.live,
                private: video.private,
                tags: video.tags || []
            }));

            // Simpan ke in-memory cache
            global.youtubeCache.set(messageId, {
                query: query,
                results: videos,
                page: 0,
                timestamp: Date.now()
            });

            // Buat embed untuk video pertama
            const embed = this.createVideoEmbed(videos, 0, query);
            const components = this.createNavigationButtons(messageId, 0, videos.length);

            const response = { embeds: [embed], components: [components] };
            return isInteraction ? 
                context.editReply(response) : 
                context.reply(response);

        } catch (error) {
            console.error('[YouTubeCommand] Search Error:', error);
            const errorMsg = `❌ An error occurred while searching: \`${error.message}\`\nPlease try again later.`;
            return isInteraction ? 
                context.editReply({ content: errorMsg, ephemeral: true }) : 
                context.reply({ content: errorMsg });
        }
    }

    createVideoEmbed(videos, pageIndex, query) {
        const video = videos[pageIndex];
        
        // Format views number
        const viewsText = video.views ? video.views.toLocaleString() : 'N/A';
        
        // Format channel info dengan verification badge
        let channelText = 'N/A';
        if (video.channel?.name) {
            const verifiedBadge = video.channel.verified ? ' ✓' : '';
            if (video.channel.url) {
                channelText = `[${video.channel.name}](${video.channel.url})${verifiedBadge}`;
            } else {
                channelText = `${video.channel.name}${verifiedBadge}`;
            }
        }

        // Format duration
        const durationText = video.durationFormatted || 'N/A';
        
        // Format upload date
        const uploadText = video.uploadedAt || 'N/A';

        // Shorts indicator
        const typeText = video.shorts ? '🩳 YouTube Shorts' : '📹 YouTube Video';

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(video.title || 'Untitled Video')
            .setURL(video.url)
            .setDescription(typeText)
            .addFields(
                { name: '⏱️ Duration', value: durationText, inline: true },
                { name: '👀 Views', value: viewsText, inline: true },
                { name: '📅 Uploaded', value: uploadText, inline: true },
                { name: '📺 Channel', value: channelText, inline: false }
            )
            .setFooter({ 
                text: `Result ${pageIndex + 1} of ${videos.length} • Query: "${query}"`,
                iconURL: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/youtube/youtube-original.svg'
            })
            .setTimestamp();

        // Set thumbnail jika tersedia
        if (video.thumbnail?.url) {
            embed.setThumbnail(video.thumbnail.url);
        }

        return embed;
    }

    createNavigationButtons(messageId, currentPage, totalResults) {
        return new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`youtube_prev_${messageId}`)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId(`youtube_info_${messageId}`)
                    .setLabel(`${currentPage + 1}/${totalResults}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`youtube_next_${messageId}`)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(currentPage >= totalResults - 1),
                new ButtonBuilder()
                    .setCustomId(`youtube_close_${messageId}`)
                    .setLabel('Close')
                    .setStyle(ButtonStyle.Danger)
            );
    }
}

module.exports = { YoutubeCommand };
