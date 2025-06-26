const config = require('./config');

class AIHelper {
  constructor() {
    // Check which AI services are available
    this.geminiKey = process.env.GEMINI_API_KEY;
    
    // Set preferred AI service
    this.preferredService = this.detectPreferredService();
    
    // Debug log
    console.log(`🤖 AI Service detected: ${this.preferredService}`);
    console.log(`🔑 Available APIs: Gemini=${!!this.geminiKey}`);
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

    const prompt = `Kamu adalah Y4zBot, bot Discord yang ramah dan membantu. Karakteristik:
- Berbicara dalam bahasa Indonesia casual dan friendly
- Gunakan emoji yang sesuai
- Jawab dengan singkat dan natural (maksimal 2-3 kalimat)
- Kalau ditanya tentang dirimu, bilang kamu adalah Y4zBot
- Jangan terlalu formal, santai aja

User yang bicara: ${username}
Pesan: ${userMessage}

Response:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }

  getSimpleResponse(userMessage, username) {
    // Fallback sederhana untuk error
    return `Hmm, aku lagi ada masalah nih ${username}. Coba tanya lagi ya! 🤖`;
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
