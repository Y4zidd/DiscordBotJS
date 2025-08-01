const config = require('./config');

class AIHelper {
  constructor() {
    // Check which AI services are available
    this.geminiKey = process.env.GEMINI_API_KEY;
    
    // Set preferred AI service
    this.preferredService = this.detectPreferredService();
    
    // Debug log
    console.log(`AI Service detected: ${this.preferredService}`);
    console.log(`Available APIs: Gemini=${!!this.geminiKey}`);
  }

  detectPreferredService() {
    if (this.geminiKey) return 'gemini';
    return 'simple';
  }

  async getAIResponse(userMessage, username, context = {}) {
    try {
      switch (this.preferredService) {
        case 'gemini':
          return await this.getGeminiResponse(userMessage, username, context);
        default:
          return this.getSimpleResponse(userMessage, username);
      }
    } catch (error) {
      console.error(`Error with ${this.preferredService} AI:`, error);
      return this.getSimpleResponse(userMessage, username);
    }
  }

  async getGeminiResponse(userMessage, username, context) {
    if (!this.geminiKey) throw new Error('Gemini API key not found');
    
    // Install: npm install @google/generative-ai
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Remove emoji and emoji instructions from prompt
    const botName = context?.client?.user?.username || 'Bot';
    const prompt = `You are ${botName}, a friendly and helpful Discord bot. Characteristics:
    - Speak in casual and friendly English
    - Answer briefly and naturally (maximum 2-3 sentences)
    - If asked about yourself, say you are ${botName}
    - Don't be too formal, keep it casual

User speaking: ${username}
Message: ${userMessage}

Response:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }

  getSimpleResponse(userMessage, username) {
    // Simple fallback for error
    return `Hmm, I'm having some trouble right now, ${username}. Please try asking again later!`;
  }

  getStatus() {
    return {
      service: this.preferredService,
      available: {
        gemini: !!this.geminiKey
      }
    };
  }
}

module.exports = AIHelper;
