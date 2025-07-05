const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');

// Global cache like anime.js
global.characterCache = global.characterCache || new Map();

// Cache functions like anime.js
function setCharacterCache(key, data) {
  global.characterCache.set(key, {
    data,
    lastActive: Date.now()
  });
}

function getCharacterCache(key) {
  const entry = global.characterCache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.lastActive > 180000) { // 3 minutes
    global.characterCache.delete(key);
    return 'expired';
  }
  
  // Update lastActive on access
  entry.lastActive = now;
  global.characterCache.set(key, entry);
  return entry.data;
}

function deleteCharacterCache(key) {
  console.log('deleteCharacterCache called with key:', key);
  if (global.characterCache.has(key)) {
    console.log('Cache key found, deleting...');
    global.characterCache.delete(key);
    console.log('Cache successfully deleted from memory');
  } else {
    console.log('Cache key not found in memory:', key);
  }
}

// Search characters using Jikan API
async function searchCharacters(query) {
    try {
        const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=20`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            return [];
        }
        
        return data.data;
    } catch (error) {
        console.error('Error fetching characters:', error);
        return [];
    }
}

// Get character details using Jikan API
async function getCharacterDetails(malId) {
    try {
        const url = `https://api.jikan.moe/v4/characters/${malId}/full`;
        const response = await fetch(url);
        const data = await response.json();
        
        return data.data;
    } catch (error) {
        console.error('Error fetching character details:', error);
        return null;
    }
}

// Send character embed with pagination
async function sendCharacterEmbed(interaction, query, userId, index, allData) {
    const character = allData[index];
    if (!character) return interaction.editReply('Character not found.');
    
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`character_prev_${userId}_${query}`)
            .setLabel('<')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(index === 0),
        new ButtonBuilder()
            .setCustomId('character_index')
            .setLabel(`${index + 1} / ${allData.length}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId(`character_next_${userId}_${query}`)
            .setLabel('>')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(index === allData.length - 1),
        new ButtonBuilder()
            .setCustomId(`character_details_${userId}_${query}_${index}`)
            .setLabel('Full Details')
            .setStyle(ButtonStyle.Primary)
    );
    
    const embed = new EmbedBuilder()
        .setTitle(character.name)
        .setDescription(character.about ? character.about.substring(0, 200) + '...' : 'No description available.')
        .setImage(character.images?.jpg?.image_url || character.images?.webp?.image_url)
        .setURL(character.url)
        .setColor('#FF6B6B')
        .addFields(
            { name: 'Japanese Name', value: character.name_kanji || 'None', inline: true },
            { name: 'Nicknames', value: character.nicknames?.join(', ') || 'None', inline: true },
            { name: 'Favorites', value: character.favorites?.toLocaleString() || '0', inline: true }
        )
        .setFooter({ text: `Result ${index + 1} of ${allData.length} • MyAnimeList` });
    
    await interaction.editReply({ embeds: [embed], components: [row] });
}

// Send full character details
async function sendCharacterDetailsEmbed(interaction, character, userId, index) {
    const details = await getCharacterDetails(character.mal_id);
    
    if (!details) {
        return interaction.reply({ 
            content: 'Failed to fetch character details.', 
            flags: 64 // Ephemeral
        });
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`${character.name} - Full Details`)
        .setImage(character.images?.jpg?.image_url || character.images?.webp?.image_url)
        .setURL(character.url)
        .setColor('#4ECDC4')
        .addFields(
            { name: 'Japanese Name', value: details.name_kanji || 'None', inline: true },
            { name: 'Nicknames', value: details.nicknames?.join(', ') || 'None', inline: true },
            { name: 'Favorites', value: details.favorites?.toLocaleString() || '0', inline: true },
            { name: 'Description', value: (details.about || 'No description available.').substring(0, 950) + (details.about && details.about.length > 950 ? `... [read more](${character.url})` : ''), inline: false }
        );
    
    if (details.voices && details.voices.length > 0) {
        const voiceList = details.voices.slice(0, 5).map(voice => 
            `• ${voice.person.name} (${voice.language})`
        ).join('\n');
        const moreLink = details.voices.length > 5 ? `\n[...and more](${character.url})` : '';
        embed.addFields({ 
            name: 'Voice Actors', 
            value: voiceList + moreLink,
            inline: false 
        });
    }
    
    embed.setFooter({ text: 'MyAnimeList • Full Details' });
    
    await interaction.reply({ embeds: [embed], flags: 64 }); // Ephemeral
}

class CharacterCommand extends Command {
    constructor(context, options) {
        super(context, {
            ...options,
            name: 'character',
            description: 'Search for anime character information from MyAnimeList',
            chatInputCommand: true
        });
    }

    registerApplicationCommands(registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName('character')
                .setDescription('Search for anime character information from MyAnimeList')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the anime character to search for')
                        .setRequired(true)
                )
        );
    }

    async chatInputRun(interaction) {
        await interaction.deferReply();
        const query = interaction.options.getString('name');
        const userId = interaction.user.id;
        
        try {
            const allResults = await searchCharacters(query);
            
            if (!allResults.length) {
                return interaction.editReply('No characters found with that name.');
            }
            
            const cacheKey = `${userId}_${query}`;
            setCharacterCache(cacheKey, allResults);
            console.log('Cache set:', cacheKey, 'Count:', allResults.length);
            
            return sendCharacterEmbed(interaction, query, userId, 0, allResults);
        } catch (err) {
            console.error('Character search error:', err);
            return interaction.editReply('Error searching for anime characters.');
        }
    }
}

// Button interaction handler (like manga.js)
async function handleCharacterButton(interaction) {
    try {
        if (!interaction.isButton() || !interaction.customId.startsWith('character_')) return;
        
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const userId = parts[2];
        
        let query, page = 0;
        if (action === 'details') {
            // character_details_userId_query_index
            query = parts[3];
            page = parseInt(parts[4], 10);
        } else {
            // character_prev/next_userId_query
            query = parts.slice(3).join('_');
        }
        
        if (interaction.user.id !== userId) {
            return interaction.reply({ 
                content: 'You cannot control this pagination.', 
                flags: 64 
            });
        }
        
                const cacheKey = `${userId}_${query}`;
        const allData = getCharacterCache(cacheKey);
        
        if (allData === 'expired') {
          return interaction.update({ 
            content: '⏰ **Session expired due to inactivity**\n\nYour character search session has been automatically closed after 3 minutes of inactivity. This helps keep the bot running smoothly.\n\nYou can start a new search anytime with `/character` command. Happy searching!', 
            embeds: [], 
            components: [] 
          });
        }
        
        if (!allData) {
          return interaction.reply({ 
            content: 'No active session found. Please search again.', 
            flags: 64 
          });
        }
        
        // Get current page from embed footer
        if (action !== 'details' && interaction.message.embeds[0]?.footer?.text) {
            const match = interaction.message.embeds[0].footer.text.match(/Result (\d+) of (\d+)/);
            if (match) page = parseInt(match[1], 10) - 1;
        }
        
        if (action === 'prev' && page > 0) page--;
        if (action === 'next' && page < allData.length - 1) page++;
        
        if (action === 'details') {
            const character = allData[page];
            // Show details first, then delete cache
            await sendCharacterDetailsEmbed(interaction, character, userId, page);
            // Delete cache after showing details
            console.log('Deleting cache with key:', cacheKey);
            deleteCharacterCache(cacheKey);
            return;
        }
        
        // Defer update to prevent timeout
        await interaction.deferUpdate();
        await sendCharacterEmbed(interaction, query, userId, page, allData);
        
    } catch (err) {
        console.error('handleCharacterButton error:', err);
        try {
            await interaction.reply({ 
                content: 'An error occurred while processing your request.', 
                flags: 64 
            });
        } catch {}
    }
}

module.exports = { CharacterCommand, handleCharacterButton, setCharacterCache, getCharacterCache, deleteCharacterCache }; 