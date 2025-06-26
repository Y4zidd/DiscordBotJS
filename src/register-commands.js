// Load environment variables
require('dotenv').config();

const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID; // Bot's application ID

// Validate environment variables
if (!token) {
  console.error('❌ DISCORD_TOKEN not found in environment variables!');
  process.exit(1);
}

if (!clientId) {
  console.error('❌ CLIENT_ID not found in environment variables!');
  console.error('Please add CLIENT_ID (your bot\'s Application ID) to your .env file');
  process.exit(1);
}

// Command definitions
const commands = [
  {
    name: 'ping',
    description: 'Check bot latency'
  },
  {
    name: 'info',
    description: 'Display bot information'
  },
  {
    name: 'help',
    description: 'Show list of available commands'
  },
  {
    name: 'serverinfo',
    description: 'Display server information'
  },
  {
    name: 'userinfo',
    description: 'Display user information',
    options: [
      {
        name: 'user',
        description: 'User to view information about',
        type: 6, // USER type
        required: false
      }
    ]
  },
  {
    name: 'say',
    description: 'Make the bot say something',
    options: [
      {
        name: 'message',
        description: 'Message for the bot to say',
        type: 3, // STRING type
        required: true
      }
    ]
  },
  {
    name: 'ai',
    description: 'Configure and get info about AI Chat',
    options: [
      {
        name: 'status',
        description: 'Check AI Chat status',
        type: 1 // SUB_COMMAND type
      },
      {
        name: 'setup',
        description: 'Setup AI with API key',
        type: 1, // SUB_COMMAND type
        options: [
          {
            name: 'provider',
            description: 'Select AI provider',
            type: 3, // STRING type
            required: true,
            choices: [
              { name: 'OpenAI (ChatGPT)', value: 'openai' },
              { name: 'Google Gemini', value: 'gemini' },
              { name: 'Simple Responses', value: 'simple' }
            ]
          }
        ]
      }
    ]
  },
];

console.log(`✅ Prepared ${commands.length} commands for registration`);

// Initialize REST client
const rest = new REST({ version: '10' }).setToken(token);

// Deploy commands
(async () => {
  try {
    console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

    // Register commands globally (for all servers)
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
    process.exit(1);
  }
})();