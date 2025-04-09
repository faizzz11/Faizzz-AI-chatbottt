import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with the key from environment variables
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to generate a response from Gemini
export async function generateResponse(messages) {
  try {
    // Get the generative model - using gemini-1.5-flash instead of gemini-pro
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Format the chat history for Gemini API
    const history = [];
    const userMessage = messages[messages.length - 1].content;
    
    // Add chat history (except the last message which we'll send separately)
    if (messages.length > 1) {
      for (let i = 0; i < messages.length - 1; i++) {
        const msg = messages[i];
        history.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Start a chat session with history
    const chat = model.startChat({
      history: history,
    });

    // Send the latest user message
    const result = await chat.sendMessage(userMessage);
    
    // Return the generated response text
    return result.response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    
    // Return a fallback message in case of API errors
    return "I'm sorry, I'm having trouble connecting to my AI services. Please try again later.";
  }
} 