const { Listener } = require('@sapphire/framework');
const { Events } = require('discord.js');

class ReadyListener extends Listener {
  constructor(context, options) {
    super(context, {
      ...options,
      once: true, // Event ini hanya dijalankan sekali
      event: Events.ClientReady
    });
  }

  run(client) {
    const { username, id } = client.user;
    console.log(`Bot successfully logged in!`);
    console.log(`Username: ${username}`);
    console.log(`ID: ${id}`);
    console.log(`Servers: ${client.guilds.cache.size} servers`);
    console.log(`Users: ${client.users.cache.size} users`);
    console.log('-'.repeat(50));
    
    // Set activity/status bot
    client.user.setActivity('with Sapphire.js', { 
      type: 'PLAYING' 
    });
  }
}

module.exports = { ReadyListener };
