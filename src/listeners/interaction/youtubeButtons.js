const { Listener } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Import cache dari youtube.js command - shared in-memory cache
// Kita buat cache global yang bisa diakses dari kedua file
global.youtubeCache = global.youtubeCache || new Map();

class YoutubeButtonsListener extends Listener {
    constructor(context, options) {
        super(context, {
            ...options,
            event: 'interactionCreate'
        });
    }

    async run(interaction) {
        if (!interaction.isButton() || !interaction.customId.startsWith('youtube_')) return;

        const parts = interaction.customId.split('_');
        const action = parts[1];
        const messageId = parts[2];

        if (!['prev', 'next', 'close', 'info'].includes(action)) return;

        const session = global.youtubeCache.get(messageId);

        // Cek apakah session masih ada
        if (!session) {
            try {
                await interaction.update({ 
                    content: '❌ This YouTube search session has expired or was not found.\nPlease start a new search with `/youtube`', 
                    embeds: [],
                    components: [] 
                });
            } catch (e) {
                console.error('[YouTubeButtons] Failed to update expired session:', e);
            }
            return;
        }

        // Handle tombol info (tidak melakukan apa-apa, hanya disabled)
        if (action === 'info') {
            return;
        }

        // Handle tombol close
        if (action === 'close') {
            global.youtubeCache.delete(messageId);
            try {
                await interaction.update({
                    content: `✅ YouTube search closed. Results for: **"${session.query}"**`,
                    embeds: [],
                    components: []
                });
            } catch (e) {
                console.error('[YouTubeButtons] Failed to close session:', e);
            }
            return;
        }

        // Handle navigasi previous/next
        let newPage = session.page;
        if (action === 'prev') {
            newPage = Math.max(0, session.page - 1);
        } else if (action === 'next') {
            newPage = Math.min(session.results.length - 1, session.page + 1);
        }

        // Update page di cache
        session.page = newPage;
        global.youtubeCache.set(messageId, session);

        // Buat embed baru untuk page yang dipilih
        const video = session.results[newPage];
        const embed = this.createVideoEmbed(video, newPage, session.results.length, session.query);
        const components = this.createNavigationButtons(messageId, newPage, session.results.length);

        try {
            await interaction.update({ embeds: [embed], components: [components] });
        } catch (error) {
            console.error('[YouTubeButtons] Failed to update interaction:', error);
            try {
                await interaction.followUp({ 
                    content: '❌ Failed to update the message. Please try again.',
                    ephemeral: true 
                });
            } catch (e) {
                console.error('[YouTubeButtons] Failed to send follow-up:', e);
            }
        }
    }

    createVideoEmbed(video, pageIndex, totalResults, query) {
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
                text: `Result ${pageIndex + 1} of ${totalResults} • Query: "${query}"`,
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

module.exports = { YoutubeButtonsListener };
