const { Listener } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const cachePath = path.join(__dirname, '..\..\..\tmp', 'youtubeCache.json');

function readCache() {
    try {
        if (fs.existsSync(cachePath)) {
            const rawData = fs.readFileSync(cachePath);
            return JSON.parse(rawData);
        }
    } catch (error) {
        console.error('Error reading YouTube cache:', error);
    }
    return {};
}

function writeCache(data) {
    try {
        fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing YouTube cache:', error);
    }
}

class YoutubeButtonsListener extends Listener {
    constructor(context, options) {
        super(context, {
            ...options,
            event: 'interactionCreate'
        });
    }

    async run(interaction) {
        if (!interaction.isButton()) return;
        if (!['youtube_prev', 'youtube_next', 'youtube_close'].includes(interaction.customId)) return;

        const cache = readCache();
        const messageId = interaction.message.id;
        const session = cache[messageId];

        if (!session) {
            return interaction.reply({ content: 'This interaction has expired.', ephemeral: true });
        }

        if (interaction.customId === 'youtube_close') {
            delete cache[messageId];
            writeCache(cache);
            await interaction.message.delete();
            return;
        }

        let page = session.page;
        if (interaction.customId === 'youtube_prev') {
            page = Math.max(0, page - 1);
        }

        if (interaction.customId === 'youtube_next') {
            page = Math.min(session.results.length - 1, page + 1);
        }

        session.page = page;
        writeCache(cache);

        const result = session.results[page];
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(result.title)
            .setURL(result.url)
            .setThumbnail(result.thumbnail.url)
            .addFields(
                { name: 'Duration', value: result.durationFormatted, inline: true },
                { name: 'Views', value: result.views.toLocaleString(), inline: true },
                { name: 'Uploaded', value: result.uploadedAt, inline: true },
                { name: 'Channel', value: `[${result.channel.name}](${result.channel.url})`, inline: false },
            )
            .setFooter({ text: `Result ${page + 1} of ${session.results.length}` });

        await interaction.update({ embeds: [embed], components: interaction.message.components });
    }
}

module.exports = {
    YoutubeButtonsListener
};
