const { Command } = require('@sapphire/framework');
const config = require('../config');

class PingCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'ping',
      description: 'Check bot latency'
    });
  }

  // Slash command
  async chatInputRun(interaction) {
    const msg = await interaction.reply({ 
      content: 'Ping?', 
      fetchReply: true 
    });

    const diff = msg.createdTimestamp - interaction.createdTimestamp;
    const ping = Math.round(this.container.client.ws.ping);

    return interaction.editReply(
      `Pong! ${config.emojis.ping}\n` +
      `📡 **API Latency**: ${diff}ms\n` +
      `💓 **Heartbeat**: ${ping}ms`
    );
  }

  // Message command
  async messageRun(message) {
    const msg = await message.reply('Ping?');
    const diff = msg.createdTimestamp - message.createdTimestamp;
    const ping = Math.round(this.container.client.ws.ping);

    return msg.edit(
      `Pong! ${config.emojis.ping}\n` +
      `📡 **API Latency**: ${diff}ms\n` +
      `💓 **Heartbeat**: ${ping}ms`
    );
  }
}

module.exports = { PingCommand };