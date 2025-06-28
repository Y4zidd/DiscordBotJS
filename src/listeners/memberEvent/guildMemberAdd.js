const { Listener } = require('@sapphire/framework');
const { Events, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');

class GuildMemberAddListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      event: Events.GuildMemberAdd
    });
  }

  async run(member) {
    // Create canvas
    const width = 800;
    const height = 400;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Custom gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#232526');
    gradient.addColorStop(1, '#414345');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw avatar with border and shadow
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await Canvas.loadImage(avatarURL);
    const avatarX = width / 2 - 80;
    const avatarY = 40;
    // Shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, avatarY + 80, 84, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();
    // Border
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, avatarY + 80, 82, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.clip();
    // Avatar
    ctx.beginPath();
    ctx.arc(width / 2, avatarY + 80, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, 160, 160);
    ctx.restore();

    // Welcome text
    ctx.font = 'bold 54px Sans';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillText('WELCOME', width / 2, 260);
    ctx.shadowBlur = 0;

    // Username
    ctx.font = 'bold 38px Sans';
    ctx.fillStyle = '#ffb347';
    ctx.fillText(member.user.username, width / 2, 310);

    // Server name
    ctx.font = '28px Sans';
    ctx.fillStyle = '#fff';
    ctx.fillText(`to ${member.guild.name}`, width / 2, 350);

    // Send as attachment
    const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'welcome.png' });
    const channel = member.guild.systemChannel || member.guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(member.guild.members.me).has('SendMessages'));
    if (channel) {
      channel.send({ content: `Hi ${member.user}, welcome to **${member.guild.name}**!`, files: [attachment] });
    }
  }
}

module.exports = { GuildMemberAddListener };
